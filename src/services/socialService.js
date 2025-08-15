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
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';

class SocialService {
  // ==================== LIKES/VOTES ====================
  
  async toggleLike(storyId, userId) {
    try {
      return await runTransaction(db, async (transaction) => {
        const storyRef = doc(db, 'stories', storyId);
        const voteRef = doc(db, 'stories', storyId, 'votes', userId);
        
        const storyDoc = await transaction.get(storyRef);
        const voteDoc = await transaction.get(voteRef);
        
        if (!storyDoc.exists()) {
          throw new Error('Story not found');
        }
        
        const isLiked = voteDoc.exists();
        const currentLikes = storyDoc.data().stats?.likeCount || 0;
        
        if (isLiked) {
          // Remove like
          transaction.delete(voteRef);
          transaction.update(storyRef, {
            'stats.likeCount': Math.max(0, currentLikes - 1),
            'stats.lastActivity': serverTimestamp()
          });
          return false;
        } else {
          // Add like
          transaction.set(voteRef, {
            userId,
            storyId,
            createdAt: serverTimestamp()
          });
          transaction.update(storyRef, {
            'stats.likeCount': currentLikes + 1,
            'stats.lastActivity': serverTimestamp()
          });
          return true;
        }
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  async getUserLikedStories(userId, limitCount = 20) {
    try {
      const votesQuery = query(
        collection(db, 'stories'),
        where('votes.' + userId, '!=', null),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(votesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user liked stories:', error);
      throw error;
    }
  }

  async checkIfUserLiked(storyId, userId) {
    try {
      const voteDoc = await getDoc(doc(db, 'stories', storyId, 'votes', userId));
      return voteDoc.exists();
    } catch (error) {
      console.error('Error checking if user liked:', error);
      return false;
    }
  }

  // ==================== COMMENTS ====================
  
  async addComment(storyId, userId, content, parentCommentId = null) {
    try {
      return await runTransaction(db, async (transaction) => {
        const storyRef = doc(db, 'stories', storyId);
        const commentsRef = collection(db, 'stories', storyId, 'comments');
        
        const storyDoc = await transaction.get(storyRef);
        if (!storyDoc.exists()) {
          throw new Error('Story not found');
        }
        
        const commentData = {
          userId,
          content,
          parentCommentId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likesCount: 0,
          repliesCount: 0,
          isEdited: false
        };
        
        const commentRef = doc(commentsRef);
        transaction.set(commentRef, commentData);
        
        // Update story comment count
        const currentComments = storyDoc.data().stats?.commentsCount || 0;
        transaction.update(storyRef, {
          'stats.commentsCount': currentComments + 1,
          'stats.lastActivity': serverTimestamp()
        });
        
        // If it's a reply, update parent comment reply count
        if (parentCommentId) {
          const parentRef = doc(db, 'stories', storyId, 'comments', parentCommentId);
          const parentDoc = await transaction.get(parentRef);
          if (parentDoc.exists()) {
            const currentReplies = parentDoc.data().repliesCount || 0;
            transaction.update(parentRef, {
              repliesCount: currentReplies + 1
            });
          }
        }
        
        return { id: commentRef.id, ...commentData };
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async getComments(storyId, limitCount = 20, lastDoc = null, parentCommentId = null) {
    try {
      let commentsQuery = query(
        collection(db, 'stories', storyId, 'comments'),
        where('parentCommentId', '==', parentCommentId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (lastDoc) {
        commentsQuery = query(commentsQuery, startAfter(lastDoc));
      }
      
      const snapshot = await getDocs(commentsQuery);
      const comments = [];
      
      snapshot.forEach(doc => {
        comments.push({ id: doc.id, ...doc.data() });
      });
      
      return {
        comments,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  async updateComment(storyId, commentId, content, userId) {
    try {
      const commentRef = doc(db, 'stories', storyId, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }
      
      if (commentDoc.data().userId !== userId) {
        throw new Error('Unauthorized to edit this comment');
      }
      
      await updateDoc(commentRef, {
        content,
        updatedAt: serverTimestamp(),
        isEdited: true
      });
      
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(storyId, commentId, userId) {
    try {
      return await runTransaction(db, async (transaction) => {
        const storyRef = doc(db, 'stories', storyId);
        const commentRef = doc(db, 'stories', storyId, 'comments', commentId);
        
        const storyDoc = await transaction.get(storyRef);
        const commentDoc = await transaction.get(commentRef);
        
        if (!commentDoc.exists()) {
          throw new Error('Comment not found');
        }
        
        if (commentDoc.data().userId !== userId) {
          throw new Error('Unauthorized to delete this comment');
        }
        
        transaction.delete(commentRef);
        
        // Update story comment count
        if (storyDoc.exists()) {
          const currentComments = storyDoc.data().stats?.commentsCount || 0;
          transaction.update(storyRef, {
            'stats.commentsCount': Math.max(0, currentComments - 1)
          });
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  subscribeToComments(storyId, callback, parentCommentId = null) {
    const commentsQuery = query(
      collection(db, 'stories', storyId, 'comments'),
      where('parentCommentId', '==', parentCommentId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    return onSnapshot(commentsQuery, (snapshot) => {
      const comments = [];
      snapshot.forEach(doc => {
        comments.push({ id: doc.id, ...doc.data() });
      });
      callback(comments);
    });
  }

  // ==================== FOLLOWS ====================
  
  async followUser(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }
    
    try {
      return await runTransaction(db, async (transaction) => {
        const followerRef = doc(db, 'users', followerId);
        const followingRef = doc(db, 'users', followingId);
        const followRelationRef = doc(db, 'follows', `${followerId}_${followingId}`);
        
        const followRelationDoc = await transaction.get(followRelationRef);
        
        if (followRelationDoc.exists()) {
          throw new Error('Already following this user');
        }
        
        // Create follow relationship
        transaction.set(followRelationRef, {
          followerId,
          followingId,
          createdAt: serverTimestamp()
        });
        
        // Update follower's following count
        const followerDoc = await transaction.get(followerRef);
        if (followerDoc.exists()) {
          const currentFollowing = followerDoc.data().stats?.followingCount || 0;
          transaction.update(followerRef, {
            'stats.followingCount': currentFollowing + 1
          });
        }
        
        // Update following's followers count
        const followingDoc = await transaction.get(followingRef);
        if (followingDoc.exists()) {
          const currentFollowers = followingDoc.data().stats?.followersCount || 0;
          transaction.update(followingRef, {
            'stats.followersCount': currentFollowers + 1
          });
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(followerId, followingId) {
    try {
      return await runTransaction(db, async (transaction) => {
        const followerRef = doc(db, 'users', followerId);
        const followingRef = doc(db, 'users', followingId);
        const followRelationRef = doc(db, 'follows', `${followerId}_${followingId}`);
        
        const followRelationDoc = await transaction.get(followRelationRef);
        
        if (!followRelationDoc.exists()) {
          throw new Error('Not following this user');
        }
        
        // Delete follow relationship
        transaction.delete(followRelationRef);
        
        // Update follower's following count
        const followerDoc = await transaction.get(followerRef);
        if (followerDoc.exists()) {
          const currentFollowing = followerDoc.data().stats?.followingCount || 0;
          transaction.update(followerRef, {
            'stats.followingCount': Math.max(0, currentFollowing - 1)
          });
        }
        
        // Update following's followers count
        const followingDoc = await transaction.get(followingRef);
        if (followingDoc.exists()) {
          const currentFollowers = followingDoc.data().stats?.followersCount || 0;
          transaction.update(followingRef, {
            'stats.followersCount': Math.max(0, currentFollowers - 1)
          });
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  async checkIfFollowing(followerId, followingId) {
    try {
      const followDoc = await getDoc(doc(db, 'follows', `${followerId}_${followingId}`));
      return followDoc.exists();
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  async getFollowers(userId, limitCount = 20) {
    try {
      const followsQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(followsQuery);
      const followerIds = snapshot.docs.map(doc => doc.data().followerId);
      
      // Get user details for followers
      const followers = [];
      for (const followerId of followerIds) {
        const userDoc = await getDoc(doc(db, 'users', followerId));
        if (userDoc.exists()) {
          followers.push({ id: userDoc.id, ...userDoc.data() });
        }
      }
      
      return followers;
    } catch (error) {
      console.error('Error getting followers:', error);
      throw error;
    }
  }

  async getFollowing(userId, limitCount = 20) {
    try {
      const followsQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(followsQuery);
      const followingIds = snapshot.docs.map(doc => doc.data().followingId);
      
      // Get user details for following
      const following = [];
      for (const followingId of followingIds) {
        const userDoc = await getDoc(doc(db, 'users', followingId));
        if (userDoc.exists()) {
          following.push({ id: userDoc.id, ...userDoc.data() });
        }
      }
      
      return following;
    } catch (error) {
      console.error('Error getting following:', error);
      throw error;
    }
  }

  // ==================== BOOKMARKS ====================
  
  async toggleBookmark(storyId, userId) {
    try {
      return await runTransaction(db, async (transaction) => {
        const bookmarkRef = doc(db, 'users', userId, 'bookmarks', storyId);
        const storyRef = doc(db, 'stories', storyId);
        
        const bookmarkDoc = await transaction.get(bookmarkRef);
        const storyDoc = await transaction.get(storyRef);
        
        if (!storyDoc.exists()) {
          throw new Error('Story not found');
        }
        
        const isBookmarked = bookmarkDoc.exists();
        const currentBookmarks = storyDoc.data().stats?.bookmarksCount || 0;
        
        if (isBookmarked) {
          // Remove bookmark
          transaction.delete(bookmarkRef);
          transaction.update(storyRef, {
            'stats.bookmarksCount': Math.max(0, currentBookmarks - 1)
          });
          return false;
        } else {
          // Add bookmark
          transaction.set(bookmarkRef, {
            storyId,
            userId,
            createdAt: serverTimestamp()
          });
          transaction.update(storyRef, {
            'stats.bookmarksCount': currentBookmarks + 1
          });
          return true;
        }
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  }

  async getUserBookmarks(userId, limitCount = 20) {
    try {
      const bookmarksQuery = query(
        collection(db, 'users', userId, 'bookmarks'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(bookmarksQuery);
      const storyIds = snapshot.docs.map(doc => doc.data().storyId);
      
      // Get story details for bookmarks
      const stories = [];
      for (const storyId of storyIds) {
        const storyDoc = await getDoc(doc(db, 'stories', storyId));
        if (storyDoc.exists()) {
          stories.push({ id: storyDoc.id, ...storyDoc.data() });
        }
      }
      
      return stories;
    } catch (error) {
      console.error('Error getting user bookmarks:', error);
      throw error;
    }
  }

  async checkIfBookmarked(storyId, userId) {
    try {
      const bookmarkDoc = await getDoc(doc(db, 'users', userId, 'bookmarks', storyId));
      return bookmarkDoc.exists();
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  // ==================== SHARING ====================
  
  async shareStory(storyId, userId, platform = 'link') {
    try {
      // Track share analytics
      const shareRef = doc(collection(db, 'stories', storyId, 'shares'));
      await addDoc(collection(db, 'stories', storyId, 'shares'), {
        userId,
        platform,
        createdAt: serverTimestamp()
      });
      
      // Update story share count
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        'stats.sharesCount': increment(1),
        'stats.lastActivity': serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error tracking share:', error);
      throw error;
    }
  }

  // ==================== ACTIVITY FEED ====================
  
  async getUserActivity(userId, limitCount = 20) {
    try {
      // Get recent likes
      const likesQuery = query(
        collection(db, 'stories'),
        where('votes.' + userId, '!=', null),
        orderBy('stats.lastActivity', 'desc'),
        limit(limitCount)
      );
      
      const likesSnapshot = await getDocs(likesQuery);
      const activities = [];
      
      likesSnapshot.forEach(doc => {
        activities.push({
          type: 'like',
          storyId: doc.id,
          story: doc.data(),
          timestamp: doc.data().stats?.lastActivity || doc.data().createdAt
        });
      });
      
      // Sort by timestamp
      activities.sort((a, b) => {
        const aTime = a.timestamp?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || 0;
        return bTime - aTime;
      });
      
      return activities.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting user activity:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATIONS ====================
  
  async createNotification(userId, type, data) {
    try {
      await addDoc(collection(db, 'users', userId, 'notifications'), {
        type, // 'like', 'comment', 'follow', 'mention'
        data,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async markNotificationAsRead(userId, notificationId) {
    try {
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, limitCount = 20) {
    try {
      const notificationsQuery = query(
        collection(db, 'users', userId, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  subscribeToNotifications(userId, callback) {
    const notificationsQuery = query(
      collection(db, 'users', userId, 'notifications'),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      callback(notifications);
    });
  }
}

export default new SocialService();