// Extended methods for StoryService - to be merged with main service
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import geolocationService from './geolocationService';

// Get stories by geohash range (for nearby queries)
export async function getStoriesByGeohash(startHash, endHash) {
  try {
    const q = query(
      collection(db, 'stories'),
      where('isDraft', '==', false),
      where('geohash', '>=', startHash),
      where('geohash', '<=', endHash),
      orderBy('geohash'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const stories = [];
    
    snapshot.forEach(doc => {
      stories.push({ id: doc.id, ...doc.data() });
    });

    return stories;
  } catch (error) {
    console.error('Error getting stories by geohash:', error);
    throw error;
  }
}

// Get nearby stories within radius
export async function getNearbyStories(center, radiusInKm, limitCount = 20) {
  try {
    const bounds = geolocationService.getGeohashQueryBounds(center, radiusInKm);
    
    const promises = bounds.map(bound => 
      getStoriesByGeohash(bound[0], bound[1])
    );
    
    const results = await Promise.all(promises);
    const allStories = results.flat();
    
    // Filter by actual distance and remove duplicates
    const uniqueStories = new Map();
    allStories.forEach(story => {
      if (story.location && story.location.lat && story.location.lng) {
        const distance = geolocationService.calculateDistance(center, story.location);
        
        if (distance <= radiusInKm * 1000) { // Convert km to meters
          if (!uniqueStories.has(story.id)) {
            uniqueStories.set(story.id, {
              ...story,
              distance: distance / 1000 // Convert to km
            });
          }
        }
      }
    });
    
    // Sort by distance and limit results
    return Array.from(uniqueStories.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error getting nearby stories:', error);
    throw error;
  }
}

// Get stories for trip timeline (by user, ordered by date)
export async function getTripStories(userId, startDate = null, endDate = null) {
  try {
    let q = query(
      collection(db, 'stories'),
      where('authorId', '==', userId),
      where('isDraft', '==', false),
      where('location', '!=', null),
      orderBy('location'),
      orderBy('createdAt', 'asc')
    );

    if (startDate) {
      q = query(q, where('createdAt', '>=', startDate));
    }
    
    if (endDate) {
      q = query(q, where('createdAt', '<=', endDate));
    }

    const snapshot = await getDocs(q);
    const stories = [];
    
    snapshot.forEach(doc => {
      const story = { id: doc.id, ...doc.data() };
      if (story.location && story.location.lat && story.location.lng) {
        stories.push(story);
      }
    });

    return stories;
  } catch (error) {
    console.error('Error getting trip stories:', error);
    throw error;
  }
}

// Update story stats (likes, comments, etc.)
export async function updateStoryStats(storyId, statType, incrementValue = 1) {
  try {
    const storyRef = doc(db, 'stories', storyId);
    const updateData = {
      [`stats.${statType}`]: increment(incrementValue),
      'stats.lastActivity': serverTimestamp()
    };

    await updateDoc(storyRef, updateData);
  } catch (error) {
    console.error('Error updating story stats:', error);
    throw error;
  }
}