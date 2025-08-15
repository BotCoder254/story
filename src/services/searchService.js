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
      
      // Search in title
      for (const term of searchTerms) {
        queries.push(
          query(
            collection(db, 'stories'),
            where('isDraft', '==', false),
            where('title', '>=', term),
            where('title', '<=', term + '\uf8ff'),
            orderBy('title'),
            limit(limitCount)
          )
        );
      }

      // Search in author name
      for (const term of searchTerms) {
        queries.push(
          query(
            collection(db, 'stories'),
            where('isDraft', '==', false),
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
          if (this.matchesFilters(story, filters)) {
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
      
      const q = query(
        collection(db, 'stories'),
        where('isDraft', '==', false),
        where('tags', 'array-contains-any', searchTags),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const stories = [];
      
      snapshot.forEach(doc => {
        const story = { id: doc.id, ...doc.data() };
        if (this.matchesFilters(story, filters)) {
          stories.push(story);
        }
      });

      return stories;
    } catch (error) {
      console.error('Tag search error:', error);
      return [];
    }
  }

  async getFilteredStories(filters, sortBy, limitCount, offset) {
    try {
      let q = collection(db, 'stories');
      const conditions = [where('isDraft', '==', false)];

      // Apply filters
      if (filters.authorId) {
        conditions.push(where('authorId', '==', filters.authorId));
      }

      if (filters.tags && filters.tags.length > 0) {
        conditions.push(where('tags', 'array-contains-any', filters.tags));
      }

      if (filters.location) {
        conditions.push(where('location.name', '>=', filters.location));
        conditions.push(where('location.name', '<=', filters.location + '\uf8ff'));
      }

      // Apply conditions
      conditions.forEach(condition => {
        q = query(q, condition);
      });

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'oldest':
          q = query(q, orderBy('createdAt', 'asc'));
          break;
        case 'popular':
          q = query(q, orderBy('stats.likeCount', 'desc'));
          break;
        case 'trending':
          q = query(q, orderBy('score', 'desc'));
          break;
        default:
          q = query(q, orderBy('createdAt', 'desc'));
      }

      q = query(q, limit(limitCount + offset));
      const snapshot = await getDocs(q);
      
      const stories = [];
      snapshot.forEach(doc => {
        stories.push({ id: doc.id, ...doc.data() });
      });

      return stories.slice(offset);
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
      const q = query(
        collection(db, 'stories'),
        where('isDraft', '==', false),
        where('tags', '!=', []),
        orderBy('tags'),
        orderBy('stats.likeCount', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const tagCounts = new Map();

      snapshot.forEach(doc => {
        const story = doc.data();
        (story.tags || []).forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      return Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag);
    } catch (error) {
      console.error('Error getting popular tags:', error);
      return [];
    }
  }

  async getLocationSuggestions(query, limit = 5) {
    try {
      const q = query(
        collection(db, 'stories'),
        where('isDraft', '==', false),
        where('location.name', '>=', query),
        where('location.name', '<=', query + '\uf8ff'),
        orderBy('location.name'),
        limit(limit * 2)
      );

      const snapshot = await getDocs(q);
      const locations = new Set();

      snapshot.forEach(doc => {
        const story = doc.data();
        if (story.location?.name) {
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

      const q = query(
        collection(db, 'stories'),
        where('isDraft', '==', false),
        where('createdAt', '>=', startDate),
        orderBy('createdAt'),
        orderBy('score', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      const stories = [];

      snapshot.forEach(doc => {
        stories.push({ id: doc.id, ...doc.data() });
      });

      return stories;
    } catch (error) {
      console.error('Error getting trending stories:', error);
      return [];
    }
  }

  async getDiscoveryFeed(userId, preferences = {}) {
    try {
      // Get user's interaction history for personalization
      const userTags = preferences.tags || [];
      const userLocations = preferences.locations || [];

      let q = query(
        collection(db, 'stories'),
        where('isDraft', '==', false),
        orderBy('score', 'desc'),
        limit(50)
      );

      // If user has preferences, try to get personalized content
      if (userTags.length > 0) {
        q = query(
          collection(db, 'stories'),
          where('isDraft', '==', false),
          where('tags', 'array-contains-any', userTags.slice(0, 10)),
          orderBy('tags'),
          orderBy('score', 'desc'),
          limit(30)
        );
      }

      const snapshot = await getDocs(q);
      const stories = [];

      snapshot.forEach(doc => {
        const story = { id: doc.id, ...doc.data() };
        // Exclude user's own stories from discovery
        if (story.authorId !== userId) {
          stories.push(story);
        }
      });

      // Shuffle for variety
      return this.shuffleArray(stories).slice(0, 20);
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