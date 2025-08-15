import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import geolocationService from './geolocationService';

class StoryService {
  // Create a new story
  async createStory(storyData, userId) {
    try {
      // Clean the data to remove File objects and other non-serializable data
      const cleanedMedia = (storyData.media || []).map(media => ({
        url: media.url || '',
        storagePath: media.storagePath || '',
        fileName: media.fileName || '',
        size: media.size || 0,
        type: media.type || '',
        uploadedAt: media.uploadedAt || new Date().toISOString()
      })).filter(media => media.url); // Only include media with URLs

      const story = {
        title: storyData.title || '',
        content: storyData.content || '',
        authorId: userId,
        authorName: storyData.authorName || '',
        authorAvatar: storyData.authorAvatar || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: storyData.isDraft ? null : serverTimestamp(),
        isDraft: storyData.isDraft || false,
        stats: {
          likeCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          bookmarksCount: 0
        },
        score: 0, // For trending algorithm
        pinned: false,
        featured: false,
        tags: Array.isArray(storyData.tags) ? storyData.tags : [],
        location: storyData.location ? {
          name: storyData.location.name || '',
          lat: storyData.location.lat || null,
          lng: storyData.location.lng || null,
          address: storyData.location.address || ''
        } : null,
        geohash: storyData.location?.lat && storyData.location?.lng 
          ? geolocationService.generateGeohash(storyData.location.lat, storyData.location.lng)
          : null,
        media: cleanedMedia,
        privacy: storyData.privacy || 'public', // public, followers, private
        mood: storyData.mood || '',
        tripType: storyData.tripType || ''
      };

      const docRef = await addDoc(collection(db, 'stories'), story);
      return { id: docRef.id, ...story };
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  // Update story
  async updateStory(storyId, updates, userId) {
    try {
      const storyRef = doc(db, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
        throw new Error('Story not found');
      }
      
      const story = storyDoc.data();
      if (story.authorId !== userId) {
        throw new Error('Unauthorized to update this story');
      }

      // Clean the updates data to remove File objects
      const cleanedMedia = (updates.media || []).map(media => ({
        url: media.url || '',
        storagePath: media.storagePath || '',
        fileName: media.fileName || '',
        size: media.size || 0,
        type: media.type || '',
        uploadedAt: media.uploadedAt || new Date().toISOString()
      })).filter(media => media.url);

      const updateData = {
        title: updates.title || story.title,
        content: updates.content || story.content,
        tags: Array.isArray(updates.tags) ? updates.tags : story.tags,
        location: updates.location ? {
          name: updates.location.name || '',
          lat: updates.location.lat || null,
          lng: updates.location.lng || null,
          address: updates.location.address || ''
        } : story.location,
        media: updates.media ? cleanedMedia : story.media,
        privacy: updates.privacy || story.privacy,
        mood: updates.mood || story.mood,
        tripType: updates.tripType || story.tripType,
        isDraft: updates.hasOwnProperty('isDraft') ? updates.isDraft : story.isDraft,
        updatedAt: serverTimestamp()
      };

      // If publishing a draft
      if (story.isDraft && !updateData.isDraft) {
        updateData.publishedAt = serverTimestamp();
      }

      await updateDoc(storyRef, updateData);
      return { id: storyId, ...story, ...updateData };
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  }

  // Delete story
  async deleteStory(storyId, userId) {
    try {
      const storyRef = doc(db, 'stories', storyId);
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
        throw new Error('Story not found');
      }
      
      const story = storyDoc.data();
      if (story.authorId !== userId) {
        throw new Error('Unauthorized to delete this story');
      }

      // Delete associated media files
      if (story.media && story.media.length > 0) {
        const deletePromises = story.media.map(media => {
          const mediaRef = ref(storage, media.storagePath);
          return deleteObject(mediaRef).catch(console.error);
        });
        await Promise.all(deletePromises);
      }

      await deleteDoc(storyRef);
      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  // Get story by ID
  async getStory(storyId) {
    try {
      const storyDoc = await getDoc(doc(db, 'stories', storyId));
      if (!storyDoc.exists()) {
        throw new Error('Story not found');
      }
      return { id: storyDoc.id, ...storyDoc.data() };
    } catch (error) {
      console.error('Error getting story:', error);
      throw error;
    }
  }

  // Get stories with pagination - simplified to avoid composite indexes
  async getStories(options = {}) {
    try {
      const {
        orderType = 'latest',
        lastDoc = null,
        limitCount = 10,
        userId = null,
        location = null,
        tags = [],
        authorId = null
      } = options;

      let q;
      
      // Use single-field queries to avoid composite indexes
      if (authorId) {
        // Query by author only
        q = query(
          collection(db, 'stories'),
          where('authorId', '==', authorId),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 2) // Get extra for client-side filtering
        );
      } else {
        // Simple query without compound filters
        q = query(
          collection(db, 'stories'),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 3) // Get extra for client-side filtering
        );
      }

      // Add pagination if provided
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const allStories = [];
      
      snapshot.forEach(doc => {
        allStories.push({ id: doc.id, ...doc.data() });
      });

      // Client-side filtering to avoid composite indexes
      let filteredStories = allStories.filter(story => {
        // Filter out drafts
        if (story.isDraft === true) return false;
        
        // Filter by tags if specified
        if (tags.length > 0) {
          const storyTags = story.tags || [];
          const hasMatchingTag = tags.some(tag => 
            storyTags.some(storyTag => 
              storyTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
          if (!hasMatchingTag) return false;
        }
        
        return true;
      });

      // Sort by order type (client-side)
      if (orderType === 'trending') {
        // Calculate trending score for each story
        const now = new Date();
        filteredStories = filteredStories.map(story => ({
          ...story,
          trendingScore: this.calculateTrendingScore(story, now)
        })).sort((a, b) => b.trendingScore - a.trendingScore);
      } else if (orderType === 'popular') {
        filteredStories.sort((a, b) => (b.stats?.likeCount || 0) - (a.stats?.likeCount || 0));
      } else if (orderType === 'forYou') {
        // Simple algorithm for "For You" - mix of recent and popular
        filteredStories.sort((a, b) => {
          const aScore = (a.stats?.likeCount || 0) + (a.stats?.commentsCount || 0) * 2;
          const bScore = (b.stats?.likeCount || 0) + (b.stats?.commentsCount || 0) * 2;
          return bScore - aScore;
        });
      }
      // 'latest' and 'nearby' are already sorted by createdAt desc from the query

      // Limit results
      const stories = filteredStories.slice(0, limitCount);

      return {
        stories,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: allStories.length >= limitCount * 2 && filteredStories.length > limitCount
      };
    } catch (error) {
      console.error('Error getting stories:', error);
      // Fallback to simplest possible query
      try {
        const fallbackLimitCount = options.limitCount || 10;
        const fallbackQuery = query(
          collection(db, 'stories'),
          orderBy('createdAt', 'desc'),
          limit(fallbackLimitCount)
        );
        
        const snapshot = await getDocs(fallbackQuery);
        const stories = [];
        
        snapshot.forEach(doc => {
          const storyData = { id: doc.id, ...doc.data() };
          // Only include non-draft stories
          if (storyData.isDraft !== true) {
            stories.push(storyData);
          }
        });

        return {
          stories: stories.slice(0, fallbackLimitCount),
          lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
          hasMore: false
        };
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return {
          stories: [],
          lastDoc: null,
          hasMore: false
        };
      }
    }
  }

  // Get user's stories - simplified to avoid composite index
  async getUserStories(userId, includeDrafts = false) {
    try {
      // Simple query with only where clause to avoid composite index
      const q = query(
        collection(db, 'stories'),
        where('authorId', '==', userId),
        limit(200) // Get more for client-side sorting and filtering
      );

      const snapshot = await getDocs(q);
      const stories = [];
      
      snapshot.forEach(doc => {
        const storyData = { id: doc.id, ...doc.data() };
        
        // Client-side filtering for drafts
        if (includeDrafts || storyData.isDraft !== true) {
          stories.push(storyData);
        }
      });

      // Client-side sorting by createdAt
      stories.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime; // Descending order (newest first)
      });

      return stories;
    } catch (error) {
      console.error('Error getting user stories:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Like/Unlike story
  async toggleLike(storyId, userId) {
    try {
      const batch = writeBatch(db);
      const storyRef = doc(db, 'stories', storyId);
      const userLikeRef = doc(db, 'userLikes', `${userId}_${storyId}`);
      
      const userLikeDoc = await getDoc(userLikeRef);
      const isLiked = userLikeDoc.exists();

      if (isLiked) {
        // Unlike
        batch.delete(userLikeRef);
        batch.update(storyRef, {
          'stats.likeCount': increment(-1),
          score: increment(-1)
        });
      } else {
        // Like
        batch.set(userLikeRef, {
          userId,
          storyId,
          createdAt: serverTimestamp()
        });
        batch.update(storyRef, {
          'stats.likeCount': increment(1),
          score: increment(1)
        });
      }

      await batch.commit();
      return !isLiked;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Bookmark/Unbookmark story
  async toggleBookmark(storyId, userId) {
    try {
      const batch = writeBatch(db);
      const storyRef = doc(db, 'stories', storyId);
      const userBookmarkRef = doc(db, 'userBookmarks', `${userId}_${storyId}`);
      
      const userBookmarkDoc = await getDoc(userBookmarkRef);
      const isBookmarked = userBookmarkDoc.exists();

      if (isBookmarked) {
        // Remove bookmark
        batch.delete(userBookmarkRef);
        batch.update(storyRef, {
          'stats.bookmarksCount': increment(-1)
        });
      } else {
        // Add bookmark
        batch.set(userBookmarkRef, {
          userId,
          storyId,
          createdAt: serverTimestamp()
        });
        batch.update(storyRef, {
          'stats.bookmarksCount': increment(1)
        });
      }

      await batch.commit();
      return !isBookmarked;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  }

  // Increment view count
  async incrementViewCount(storyId) {
    try {
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        'stats.viewsCount': increment(1)
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  // Upload media file
  async uploadMedia(file, userId, storyId) {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const storagePath = `users/${userId}/stories/${storyId}/media/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        url: downloadURL,
        storagePath,
        fileName,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Real-time listener for stories - simplified
  subscribeToStories(callback, options = {}) {
    try {
      const {
        orderType = 'latest',
        limitCount = 10,
        authorId = null
      } = options;

      let q;
      
      if (authorId) {
        // Query by author only
        q = query(
          collection(db, 'stories'),
          where('authorId', '==', authorId),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 2)
        );
      } else {
        // Simple query without compound filters
        q = query(
          collection(db, 'stories'),
          orderBy('createdAt', 'desc'),
          limit(limitCount * 2)
        );
      }

      return onSnapshot(q, (snapshot) => {
        const allStories = [];
        snapshot.forEach(doc => {
          allStories.push({ id: doc.id, ...doc.data() });
        });
        
        // Client-side filtering for non-draft stories
        const filteredStories = allStories
          .filter(story => story.isDraft !== true)
          .slice(0, limitCount);
        
        callback(filteredStories);
      });
    } catch (error) {
      console.error('Error setting up stories listener:', error);
      throw error;
    }
  }

  // Get user's liked stories - simplified to avoid index
  async getUserLikedStories(userId) {
    try {
      // Simple query without orderBy to avoid composite index
      const q = query(
        collection(db, 'userLikes'),
        where('userId', '==', userId),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const likes = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        likes.push({
          storyId: data.storyId,
          createdAt: data.createdAt
        });
      });

      if (likes.length === 0) return [];

      // Sort client-side by createdAt
      likes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // Get the actual stories (in batches to avoid too many requests)
      const stories = [];
      for (const like of likes.slice(0, 50)) {
        try {
          const story = await this.getStory(like.storyId);
          if (story && story.isDraft !== true) {
            stories.push(story);
          }
        } catch (error) {
          // Skip stories that no longer exist
          console.warn(`Story ${like.storyId} not found:`, error);
        }
      }
      
      return stories;
    } catch (error) {
      console.error('Error getting user liked stories:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  // Get user's bookmarked stories - simplified to avoid index
  async getUserBookmarkedStories(userId) {
    try {
      // Simple query without orderBy to avoid composite index
      const q = query(
        collection(db, 'userBookmarks'),
        where('userId', '==', userId),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const bookmarks = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        bookmarks.push({
          storyId: data.storyId,
          createdAt: data.createdAt
        });
      });

      if (bookmarks.length === 0) return [];

      // Sort client-side by createdAt
      bookmarks.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // Get the actual stories (in batches to avoid too many requests)
      const stories = [];
      for (const bookmark of bookmarks.slice(0, 50)) {
        try {
          const story = await this.getStory(bookmark.storyId);
          if (story && story.isDraft !== true) {
            stories.push(story);
          }
        } catch (error) {
          // Skip stories that no longer exist
          console.warn(`Story ${bookmark.storyId} not found:`, error);
        }
      }
      
      return stories;
    } catch (error) {
      console.error('Error getting user bookmarked stories:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  // Calculate trending score for a story
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

  // Check if user has liked a story
  async checkUserLike(storyId, userId) {
    try {
      const userLikeRef = doc(db, 'userLikes', `${userId}_${storyId}`);
      const likeDoc = await getDoc(userLikeRef);
      return likeDoc.exists();
    } catch (error) {
      console.error('Error checking user like:', error);
      return false;
    }
  }

  // Check if user has bookmarked a story
  async checkUserBookmark(storyId, userId) {
    try {
      const userBookmarkRef = doc(db, 'userBookmarks', `${userId}_${storyId}`);
      const bookmarkDoc = await getDoc(userBookmarkRef);
      return bookmarkDoc.exists();
    } catch (error) {
      console.error('Error checking user bookmark:', error);
      return false;
    }
  }

  // Get stories by geohash range - simplified to avoid composite indexes
  async getStoriesByGeohash(startHash, endHash) {
    try {
      // Simple query without compound filters
      const q = query(
        collection(db, 'stories'),
        orderBy('createdAt', 'desc'),
        limit(100) // Get more for client-side filtering
      );

      const snapshot = await getDocs(q);
      const stories = [];
      
      snapshot.forEach(doc => {
        const storyData = { id: doc.id, ...doc.data() };
        
        // Client-side filtering
        if (storyData.isDraft !== true && 
            storyData.geohash && 
            storyData.geohash >= startHash && 
            storyData.geohash <= endHash) {
          stories.push(storyData);
        }
      });

      return stories.slice(0, 50); // Limit results
    } catch (error) {
      console.error('Error getting stories by geohash:', error);
      return []; // Return empty array on error
    }
  }
}

export default new StoryService();