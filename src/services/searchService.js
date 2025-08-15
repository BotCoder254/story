import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  or,
  and
} from 'firebase/firestore';
import { db } from '../config/firebase';
import storyService from './storyService';

class SearchService {
  constructor() {
    this.searchIndex = new Map(); // Client-side search index
    this.isIndexLoaded = false;
    this.searchHistory = this.loadSearchHistory();
  }

  // ==================== CLIENT-SIDE FULL-TEXT SEARCH ====================
  
  async buildSearchIndex() {
    if (this.isIndexLoaded) return;
    
    try {
      console.log('Building search index...');
      const { stories } = await storyService.getStories({ limitCount: 1000 });
      
      stories.forEach(story => {
        const searchableText = this.createSearchableText(story);
        const tokens = this.tokenize(searchableText);
        
        tokens.forEach(token => {
          if (!this.searchIndex.has(token)) {
            this.searchIndex.set(token, new Set());
          }
          this.searchIndex.get(token).add(story.id);
        });
      });
      
      this.isIndexLoaded = true;
      console.log(`Search index built with ${this.searchIndex.size} tokens`);
    } catch (error) {
      console.error('Error building search index:', error);
    }
  }

  createSearchableText(story) {
    const parts = [
      story.title || '',
      story.content || '',
      story.authorName || '',
      story.location?.name || '',
      story.location?.address || '',
      ...(story.tags || [])
    ];
    return parts.join(' ').toLowerCase();
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
      .map(token => token.trim());
  }

  // ==================== SEARCH METHODS ====================

  async searchStories(searchQuery, options = {}) {
    const {
      filters = {},
      sortBy = 'relevance',
      limitCount = 20,
      offset = 0
    } = options;

    // If no query, return filtered results
    if (!searchQuery.trim()) {
      return this.getFilteredStories(filters, sortBy, limitCount, offset);
    }

    // Try different search methods
    const results = await Promise.all([
      this.basicFirestoreSearch(searchQuery, filters, limitCount),
      this.clientSideSearch(searchQuery, filters, limitCount, offset),
      this.tagSearch(searchQuery, filters, limitCount)
    ]);

    // Merge and deduplicate results
    const mergedResults = this.mergeSearchResults(results, sortBy);
    
    // Save search query
    this.saveSearchQuery(searchQuery);
    
    return {
      stories: mergedResults.slice(offset, offset + limitCount),
      total: mergedResults.length,
      hasMore: mergedResults.length > offset + limitCount,
      searchTime: Date.now()
    };
  }

  async basicFirestoreSearch(searchQuery, filters, limitCount) {
    try {
      const queries = [];
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
      
      // Search in title - simplified to avoid compound queries
      for (const term of searchTerms) {
        queries.push(
          query(
            collection(db, 'stories'),
            where('title', '>=', term),
            where('title', '<=', term + '\uf8ff'),
            orderBy('title'),
            limit(limitCount)
          )
        );
      }

      // Search in author name - simplified to avoid compound queries
      for (const term of searchTerms) {
        queries.push(
          query(
            collection(db, 'stories'),
            where('authorName', '>=', term),
            where('authorName', '<=', term + '\uf8ff'),
            orderBy('authorName'),
            limit(limitCount)
          )
        );
      }

      const results = await Promise.all(
        queries.map(q => getDocs(q).catch(() => ({ docs: [] })))
      );

      const stories = new Map();
      results.forEach(snapshot => {
        snapshot.docs?.forEach(doc => {
          const story = { id: doc.id, ...doc.data() };
          // Client-side filtering for drafts and other filters
          if (story.isDraft !== true && this.matchesFilters(story, filters)) {
            stories.set(doc.id, story);
          }
        });
      });

      return Array.from(stories.values());
    } catch (error) {
      console.error('Firestore search error:', error);
      return [];
    }
  }

  async clientSideSearch(searchQuery, filters, limitCount, offset) {
    if (!this.isIndexLoaded) {
      await this.buildSearchIndex();
    }

    const searchTerms = this.tokenize(searchQuery);
    const storyScores = new Map();

    // Calculate relevance scores
    searchTerms.forEach(term => {
      const matchingStoryIds = this.searchIndex.get(term) || new Set();
      matchingStoryIds.forEach(storyId => {
        const currentScore = storyScores.get(storyId) || 0;
        storyScores.set(storyId, currentScore + 1);
      });
    });

    // Get story details and apply filters
    const storyIds = Array.from(storyScores.keys());
    const storyPromises = storyIds.map(id => storyService.getStory(id).catch(() => null));
    const stories = (await Promise.all(storyPromises))
      .filter(story => story && this.matchesFilters(story, filters))
      .map(story => ({
        ...story,
        searchScore: storyScores.get(story.id)
      }))
      .sort((a, b) => b.searchScore - a.searchScore);

    return stories;
  }

  async tagSearch(searchQuery, filters, limitCount) {
    try {
      const searchTags = searchQuery.toLowerCase().split(' ').map(tag => tag.replace('#', ''));
      
      // Simple query without compound conditions to avoid index requirements
      const q = query(
        collection(db, 'stories'),
        where('tags', 'array-contains-any', searchTags),
        limit(limitCount * 2) // Get more for client-side filtering
      );

      const snapshot = await getDocs(q);
      const stories = [];
      
      snapshot.forEach(doc => {
        const story = { id: doc.id, ...doc.data() };
        // Client-side filtering for drafts and other filters
        if (story.isDraft !== true && this.matchesFilters(story, filters)) {
          stories.push(story);
        }
      });

      // Client-side sorting by createdAt
      stories.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      return stories.slice(0, limitCount);
    } catch (error) {
      console.error('Tag search error:', error);
      return [];
    }
  }

  async getFilteredStories(filters, sortBy, limitCount, offset) {
    try {
      // Use simple query to avoid composite indexes
      let q = query(
        collection(db, 'stories'),
        limit((limitCount + offset) * 2) // Get more for client-side filtering
      );

      // Apply single filter if available to reduce data
      if (filters.authorId) {
        q = query(
          collection(db, 'stories'),
          where('authorId', '==', filters.authorId),
          limit((limitCount + offset) * 2)
        );
      } else if (filters.tags && filters.tags.length > 0) {
        q = query(
          collection(db, 'stories'),
          where('tags', 'array-contains-any', filters.tags),
          limit((limitCount + offset) * 2)
        );
      }

      const snapshot = await getDocs(q);
      const allStories = [];
      
      snapshot.forEach(doc => {
        const story = { id: doc.id, ...doc.data() };
        allStories.push(story);
      });

      // Client-side filtering
      let filteredStories = allStories.filter(story => {
        // Filter out drafts
        if (story.isDraft === true) return false;
        
        // Apply all filters client-side
        if (filters.authorId && story.authorId !== filters.authorId) return false;
        
        if (filters.tags && filters.tags.length > 0) {
          const storyTags = story.tags || [];
          const hasMatchingTag = filters.tags.some(filterTag =>
            storyTags.some(storyTag => 
              storyTag.toLowerCase().includes(filterTag.toLowerCase())
            )
          );
          if (!hasMatchingTag) return false;
        }
        
        if (filters.location) {
          const locationName = story.location?.name || '';
          if (!locationName.toLowerCase().includes(filters.location.toLowerCase())) {
            return false;
          }
        }
        
        return this.matchesFilters(story, filters);
      });

      // Client-side sorting
      switch (sortBy) {
        case 'newest':
          filteredStories.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          break;
        case 'oldest':
          filteredStories.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return aTime - bTime;
          });
          break;
        case 'popular':
          filteredStories.sort((a, b) => (b.stats?.likeCount || 0) - (a.stats?.likeCount || 0));
          break;
        case 'trending':
          filteredStories.sort((a, b) => (b.score || 0) - (a.score || 0));
          break;
        default:
          filteredStories.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
      }

      return filteredStories.slice(offset, offset + limitCount);
    } catch (error) {
      console.error('Filtered search error:', error);
      return [];
    }
  }

  matchesFilters(story, filters) {
    // Date range filter
    if (filters.dateRange) {
      const storyDate = story.createdAt?.toDate?.() || new Date(story.createdAt);
      if (filters.dateRange.start && storyDate < filters.dateRange.start) return false;
      if (filters.dateRange.end && storyDate > filters.dateRange.end) return false;
    }

    // Trip type filter
    if (filters.tripType && story.tripType !== filters.tripType) return false;

    // Mood filter
    if (filters.mood && story.mood !== filters.mood) return false;

    // Privacy filter
    if (filters.privacy && story.privacy !== filters.privacy) return false;

    return true;
  }

  mergeSearchResults(resultArrays, sortBy) {
    const storyMap = new Map();
    
    resultArrays.forEach((results, index) => {
      results.forEach(story => {
        if (!storyMap.has(story.id)) {
          storyMap.set(story.id, {
            ...story,
            searchRelevance: (resultArrays.length - index) * (story.searchScore || 1)
          });
        } else {
          // Boost relevance for stories found in multiple searches
          const existing = storyMap.get(story.id);
          existing.searchRelevance += (resultArrays.length - index);
        }
      });
    });

    const stories = Array.from(storyMap.values());

    // Sort results
    switch (sortBy) {
      case 'relevance':
        return stories.sort((a, b) => b.searchRelevance - a.searchRelevance);
      case 'newest':
        return stories.sort((a, b) => {
          const aDate = a.createdAt?.toMillis?.() || 0;
          const bDate = b.createdAt?.toMillis?.() || 0;
          return bDate - aDate;
        });
      case 'popular':
        return stories.sort((a, b) => (b.stats?.likeCount || 0) - (a.stats?.likeCount || 0));
      default:
        return stories;
    }
  }

  // ==================== SUGGESTIONS & AUTOCOMPLETE ====================

  async getSearchSuggestions(query, limit = 5) {
    if (!query || query.length < 2) return [];

    const suggestions = new Set();
    
    // Add from search history
    this.searchHistory
      .filter(term => term.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .forEach(term => suggestions.add(term));

    // Add popular tags
    const popularTags = await this.getPopularTags(10);
    popularTags
      .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .forEach(tag => suggestions.add(`#${tag}`));

    // Add location suggestions
    try {
      const locationSuggestions = await this.getLocationSuggestions(query, 3);
      locationSuggestions.forEach(location => suggestions.add(location));
    } catch (error) {
      console.error('Location suggestions error:', error);
    }

    return Array.from(suggestions).slice(0, limit);
  }

  async getPopularTags(limit = 20) {
    try {
      // Use simple query to avoid composite index issues
      const q = query(
        collection(db, 'stories'),
        orderBy('createdAt', 'desc'),
        limit(200) // Get more stories for better tag analysis
      );

      const snapshot = await getDocs(q);
      const tagCounts = new Map();
      const tagEngagement = new Map();

      snapshot.forEach(doc => {
        const story = doc.data();
        
        // Skip drafts
        if (story.isDraft === true) return;
        
        // Process tags
        (story.tags || []).forEach(tag => {
          const cleanTag = tag.toLowerCase().trim();
          if (cleanTag) {
            // Count occurrences
            tagCounts.set(cleanTag, (tagCounts.get(cleanTag) || 0) + 1);
            
            // Calculate engagement score for this tag
            const engagement = (story.stats?.likeCount || 0) + 
                             (story.stats?.commentsCount || 0) * 2 + 
                             (story.stats?.bookmarksCount || 0) * 3;
            
            tagEngagement.set(cleanTag, (tagEngagement.get(cleanTag) || 0) + engagement);
          }
        });
      });

      // Calculate trending score for tags (frequency + engagement)
      const tagScores = new Map();
      tagCounts.forEach((count, tag) => {
        const engagement = tagEngagement.get(tag) || 0;
        const score = count * 2 + engagement; // Weight frequency and engagement
        tagScores.set(tag, score);
      });

      return Array.from(tagScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag);
    } catch (error) {
      console.error('Error getting popular tags:', error);
      // Return some default popular tags as fallback
      return [
        'travel', 'adventure', 'backpacking', 'foodie', 'photography',
        'nature', 'culture', 'solo', 'budget', 'luxury', 'beach', 'mountains',
        'city', 'roadtrip', 'hiking', 'sunset', 'wanderlust', 'explore'
      ].slice(0, limit);
    }
  }

  async getLocationSuggestions(query, limit = 5) {
    try {
      // Simple query without compound conditions
      const q = query(
        collection(db, 'stories'),
        where('location.name', '>=', query),
        where('location.name', '<=', query + '\uf8ff'),
        orderBy('location.name'),
        limit(limit * 3) // Get more for client-side filtering
      );

      const snapshot = await getDocs(q);
      const locations = new Set();

      snapshot.forEach(doc => {
        const story = doc.data();
        // Client-side filtering for drafts
        if (story.isDraft !== true && story.location?.name) {
          locations.add(story.location.name);
        }
      });

      return Array.from(locations).slice(0, limit);
    } catch (error) {
      console.error('Location suggestions error:', error);
      return [];
    }
  }

  // ==================== TRENDING & DISCOVERY ====================

  async getTrendingStories(timeframe = '7d', limit = 20) {
    try {
      const now = new Date();
      const timeframes = {
        '1d': 1,
        '7d': 7,
        '30d': 30
      };
      
      const daysAgo = timeframes[timeframe] || 7;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      // Use simple query to avoid composite index issues
      const q = query(
        collection(db, 'stories'),
        orderBy('createdAt', 'desc'),
        limit(limit * 3) // Get more for client-side filtering
      );

      const snapshot = await getDocs(q);
      const allStories = [];

      snapshot.forEach(doc => {
        const storyData = { id: doc.id, ...doc.data() };
        allStories.push(storyData);
      });

      // Client-side filtering and sorting for trending
      const filteredStories = allStories
        .filter(story => {
          // Filter out drafts
          if (story.isDraft === true) return false;
          
          // Filter by timeframe
          const storyDate = story.createdAt?.toDate?.() || new Date(story.createdAt);
          return storyDate >= startDate;
        })
        .map(story => ({
          ...story,
          // Calculate trending score based on engagement and recency
          trendingScore: this.calculateTrendingScore(story, now)
        }))
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

      return filteredStories;
    } catch (error) {
      console.error('Error getting trending stories:', error);
      // Fallback to recent stories
      try {
        const fallbackQuery = query(
          collection(db, 'stories'),
          orderBy('createdAt', 'desc'),
          limit(limit)
        );
        
        const snapshot = await getDocs(fallbackQuery);
        const stories = [];
        
        snapshot.forEach(doc => {
          const storyData = { id: doc.id, ...doc.data() };
          if (storyData.isDraft !== true) {
            stories.push(storyData);
          }
        });

        return stories.slice(0, limit);
      } catch (fallbackError) {
        console.error('Fallback trending query failed:', fallbackError);
        return [];
      }
    }
  }

  calculateTrendingScore(story, now) {
    const storyDate = story.createdAt?.toDate?.() || new Date(story.createdAt);
    const ageInHours = (now - storyDate) / (1000 * 60 * 60);
    
    // Base engagement score
    const likes = story.stats?.likeCount || 0;
    const comments = story.stats?.commentsCount || 0;
    const views = story.stats?.viewsCount || 0;
    const bookmarks = story.stats?.bookmarksCount || 0;
    
    const engagementScore = (likes * 3) + (comments * 2) + (bookmarks * 4) + (views * 0.1);
    
    // Time decay factor (newer stories get higher scores)
    const timeDecay = Math.max(0.1, 1 - (ageInHours / (7 * 24))); // Decay over 7 days
    
    return engagementScore * timeDecay;
  }

  async getDiscoveryFeed(userId, preferences = {}) {
    try {
      // Get user's interaction history for personalization
      const userTags = preferences.tags || [];

      let q;
      
      // If user has preferences, try to get personalized content
      if (userTags.length > 0) {
        q = query(
          collection(db, 'stories'),
          where('tags', 'array-contains-any', userTags.slice(0, 10)),
          limit(100) // Get more for client-side filtering
        );
      } else {
        // Simple query without compound conditions
        q = query(
          collection(db, 'stories'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      const allStories = [];

      snapshot.forEach(doc => {
        const story = { id: doc.id, ...doc.data() };
        allStories.push(story);
      });

      // Client-side filtering and sorting
      const filteredStories = allStories
        .filter(story => {
          // Filter out drafts
          if (story.isDraft === true) return false;
          // Exclude user's own stories from discovery
          if (story.authorId === userId) return false;
          return true;
        })
        .map(story => ({
          ...story,
          discoveryScore: (story.stats?.likeCount || 0) + (story.stats?.commentsCount || 0) * 2
        }))
        .sort((a, b) => b.discoveryScore - a.discoveryScore);

      // Shuffle for variety and return top 20
      return this.shuffleArray(filteredStories).slice(0, 20);
    } catch (error) {
      console.error('Error getting discovery feed:', error);
      return [];
    }
  }

  // ==================== SEARCH HISTORY ====================

  saveSearchQuery(query) {
    if (!query || query.length < 2) return;
    
    const trimmedQuery = query.trim();
    this.searchHistory = this.searchHistory.filter(q => q !== trimmedQuery);
    this.searchHistory.unshift(trimmedQuery);
    this.searchHistory = this.searchHistory.slice(0, 20); // Keep last 20 searches
    
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
  }

  loadSearchHistory() {
    try {
      const history = localStorage.getItem('searchHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      return [];
    }
  }

  clearSearchHistory() {
    this.searchHistory = [];
    localStorage.removeItem('searchHistory');
  }

  // ==================== UTILITY METHODS ====================

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  highlightSearchTerms(text, searchQuery) {
    if (!searchQuery || !text) return text;
    
    const terms = searchQuery.split(' ').filter(term => term.length > 0);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }

  // ==================== SEMANTIC SEARCH (Future Enhancement) ====================

  async generateEmbedding(text) {
    // Placeholder for future semantic search implementation
    // Could integrate with OpenAI embeddings or similar service
    console.log('Semantic search not implemented yet');
    return null;
  }

  async semanticSearch(query, limit = 10) {
    // Placeholder for semantic search
    console.log('Semantic search not implemented yet');
    return [];
  }
}

export default new SearchService();