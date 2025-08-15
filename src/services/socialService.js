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
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

class SocialService {
  // ==================== USER PROFILES ====================

  async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, profileData) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async createUserProfile(userId, profileData) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          followersCount: 0,
          followingCount: 0,
          storiesCount: 0,
          likesReceived: 0
        }
      });
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // ==================== FOLLOW SYSTEM ====================

  async followUser(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    try {
      const batch = writeBatch(db);
      
      // Create follow relationship
      const followRef = doc(db, 'follows', `${followerId}_${followingId}`);
      batch.set(followRef, {
        followerId,
        followingId,
        createdAt: serverTimestamp()
      });

      // Update follower's following count
      const followerRef = doc(db, 'users', followerId);
      batch.update(followerRef, {
        'stats.followingCount': increment(1)
      });

      // Update following user's followers count
      const followingRef = doc(db, 'users', followingId);
      batch.update(followingRef, {
        'stats.followersCount': increment(1)
      });

      // Create notification
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        userId: followingId,
        type: 'follow',
        fromUserId: followerId,
        createdAt: serverTimestamp(),
        read: false
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(followerId, followingId) {
    try {
      const batch = writeBatch(db);
      
      // Remove follow relationship
      const followRef = doc(db, 'follows', `${followerId}_${followingId}`);
      batch.delete(followRef);

      // Update follower's following count
      const followerRef = doc(db, 'users', followerId);
      batch.update(followerRef, {
        'stats.followingCount': increment(-1)
      });

      // Update following user's followers count
      const followingRef = doc(db, 'users', followingId);
      batch.update(followingRef, {
        'stats.followersCount': increment(-1)
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  async checkFollowStatus(followerId, followingId) {
    if (!followerId || !followingId) return { isFollowing: false };
    
    try {
      const followDoc = await getDoc(doc(db, 'follows', `${followerId}_${followingId}`));
      return { isFollowing: followDoc.exists() };
    } catch (error) {
      console.error('Error checking follow status:', error);
      return { isFollowing: false };
    }
  }

  async getFollowers(userId) {
    try {
      const q = query(
        collection(db, 'follows'),
        where('followingId', '==', userId),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const followerIds = [];
      
      snapshot.forEach(doc => {
        followerIds.push(doc.data().followerId);
      });

      // Get user profiles for followers
      const followers = [];
      for (const followerId of followerIds) {
        try {
          const userProfile = await this.getUserProfile(followerId);
          if (userProfile) {
            followers.push(userProfile);
          }
        } catch (error) {
          console.warn(`Failed to get profile for follower ${followerId}:`, error);
        }
      }

      return followers;
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  async getFollowing(userId) {
    try {
      const q = query(
        collection(db, 'follows'),
        where('followerId', '==', userId),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const followingIds = [];
      
      snapshot.forEach(doc => {
        followingIds.push(doc.data().followingId);
      });

      // Get user profiles for following
      const following = [];
      for (const followingId of followingIds) {
        try {
          const userProfile = await this.getUserProfile(followingId);
          if (userProfile) {
            following.push(userProfile);
          }
        } catch (error) {
          console.warn(`Failed to get profile for following ${followingId}:`, error);
        }
      }

      return following;
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(userId, limitCount = 20) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const notifications = [];
      
      for (const docSnap of snapshot.docs) {
        const notification = { id: docSnap.id, ...docSnap.data() };
        
        // Get user profile for the notification sender
        if (notification.fromUserId) {
          try {
            const fromUser = await this.getUserProfile(notification.fromUserId);
            notification.fromUser = fromUser;
          } catch (error) {
            console.warn(`Failed to get profile for notification sender ${notification.fromUserId}:`, error);
          }
        }
        
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // ==================== ACTIVITY FEED ====================

  async getRecentActivity(userId, limitCount = 20) {
    try {
      // Get notifications as activity
      const notifications = await this.getNotifications(userId, limitCount);
      
      // Transform notifications into activity format
      const activities = notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        user: notification.fromUser?.displayName || 'Someone',
        userAvatar: notification.fromUser?.photoURL,
        userId: notification.fromUserId,
        action: this.getActivityAction(notification.type),
        story: notification.storyTitle,
        storyId: notification.storyId,
        time: this.formatTimeAgo(notification.createdAt),
        timestamp: notification.createdAt,
        read: notification.read
      }));

      return activities;
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  getActivityAction(type) {
    const actions = {
      'like': 'liked your story',
      'comment': 'commented on your story',
      'follow': 'started following you',
      'bookmark': 'bookmarked your story',
      'share': 'shared your story'
    };
    return actions[type] || 'interacted with your content';
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return time.toLocaleDateString();
  }

  // ==================== REAL-TIME LISTENERS ====================

  subscribeToNotifications(userId, callback) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      return onSnapshot(q, async (snapshot) => {
        const notifications = [];
        
        for (const docSnap of snapshot.docs) {
          const notification = { id: docSnap.id, ...docSnap.data() };
          
          // Get user profile for the notification sender
          if (notification.fromUserId) {
            try {
              const fromUser = await this.getUserProfile(notification.fromUserId);
              notification.fromUser = fromUser;
            } catch (error) {
              console.warn(`Failed to get profile for notification sender ${notification.fromUserId}:`, error);
            }
          }
          
          notifications.push(notification);
        }
        
        callback(notifications);
      });
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      throw error;
    }
  }

  subscribeToActivity(userId, callback) {
    try {
      return this.subscribeToNotifications(userId, (notifications) => {
        const activities = notifications.map(notification => ({
          id: notification.id,
          type: notification.type,
          user: notification.fromUser?.displayName || 'Someone',
          userAvatar: notification.fromUser?.photoURL,
          userId: notification.fromUserId,
          action: this.getActivityAction(notification.type),
          story: notification.storyTitle,
          storyId: notification.storyId,
          time: this.formatTimeAgo(notification.createdAt),
          timestamp: notification.createdAt,
          read: notification.read
        }));
        
        callback(activities);
      });
    } catch (error) {
      console.error('Error setting up activity listener:', error);
      throw error;
    }
  }

  // ==================== COMMENTS ====================

  async addComment(storyId, userId, content) {
    try {
      const commentRef = await addDoc(collection(db, 'comments'), {
        storyId,
        userId,
        content,
        createdAt: serverTimestamp(),
        likesCount: 0
      });

      // Update story comments count
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        'stats.commentsCount': increment(1)
      });

      // Create notification for story author
      const storyDoc = await getDoc(storyRef);
      if (storyDoc.exists()) {
        const story = storyDoc.data();
        if (story.authorId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: story.authorId,
            type: 'comment',
            fromUserId: userId,
            storyId,
            storyTitle: story.title,
            commentId: commentRef.id,
            createdAt: serverTimestamp(),
            read: false
          });
        }
      }

      return { id: commentRef.id };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async getComments(storyId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'comments'),
        where('storyId', '==', storyId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const comments = [];
      
      for (const docSnap of snapshot.docs) {
        const comment = { id: docSnap.id, ...docSnap.data() };
        
        // Get user profile for comment author
        try {
          const userProfile = await this.getUserProfile(comment.userId);
          comment.author = userProfile;
        } catch (error) {
          console.warn(`Failed to get profile for comment author ${comment.userId}:`, error);
        }
        
        comments.push(comment);
      }

      return comments;
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  // ==================== SEARCH USERS ====================

  async searchUsers(searchQuery, limitCount = 20) {
    try {
      // Simple search by display name
      const q = query(
        collection(db, 'users'),
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const users = [];
      
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}

export default new SocialService();