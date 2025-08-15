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

      return onSnapshot(q, 
        async (snapshot) => {
          try {
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
          } catch (error) {
            console.error('Error processing notifications:', error);
          }
        },
        (error) => {
          console.error('Notifications listener error:', error);
          // Return a no-op function to prevent further errors
          return () => {};
        }
      );
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      // Return a no-op function to prevent crashes
      return () => {};
    }
  }

  subscribeToActivity(userId, callback) {
    try {
      return this.subscribeToNotifications(userId, (notifications) => {
        try {
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
        } catch (error) {
          console.error('Error processing activities:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up activity listener:', error);
      // Return a no-op function to prevent crashes
      return () => {};
    }
  }

  // ==================== COMMENTS ====================

  async addComment(storyId, userId, content, parentCommentId = null) {
    try {
      const batch = writeBatch(db);
      
      // Get user profile for comment author
      const userProfile = await this.getUserProfile(userId);
      
      // Create comment document
      const commentRef = doc(collection(db, 'stories', storyId, 'comments'));
      const commentData = {
        storyId, // Add storyId for easier querying
        userId,
        userName: userProfile?.displayName || 'Anonymous',
        userAvatar: userProfile?.photoURL || null,
        content,
        parentCommentId: parentCommentId || null, // Ensure null instead of undefined
        level: parentCommentId ? 1 : 0, // Will be updated for deeper nesting
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likesCount: 0,
        repliesCount: 0,
        isDeleted: false,
        isEdited: false
      };

      // If this is a reply, update parent comment's reply count and level
      if (parentCommentId) {
        const parentCommentRef = doc(db, 'stories', storyId, 'comments', parentCommentId);
        const parentCommentDoc = await getDoc(parentCommentRef);
        
        if (parentCommentDoc.exists()) {
          const parentData = parentCommentDoc.data();
          commentData.level = Math.min((parentData.level || 0) + 1, 6); // Max depth of 6
          
          batch.update(parentCommentRef, {
            repliesCount: increment(1)
          });
        }
      }

      batch.set(commentRef, commentData);

      // Update story comments count
      const storyRef = doc(db, 'stories', storyId);
      batch.update(storyRef, {
        'stats.commentsCount': increment(1)
      });

      await batch.commit();

      // Create notification for story author (and parent comment author if reply)
      const storyDoc = await getDoc(storyRef);
      if (storyDoc.exists()) {
        const story = storyDoc.data();
        
        // Notify story author
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

        // Notify parent comment author if this is a reply
        if (parentCommentId) {
          const parentCommentRef = doc(db, 'stories', storyId, 'comments', parentCommentId);
          const parentCommentDoc = await getDoc(parentCommentRef);
          
          if (parentCommentDoc.exists()) {
            const parentComment = parentCommentDoc.data();
            if (parentComment.userId !== userId && parentComment.userId !== story.authorId) {
              await addDoc(collection(db, 'notifications'), {
                userId: parentComment.userId,
                type: 'reply',
                fromUserId: userId,
                storyId,
                storyTitle: story.title,
                commentId: commentRef.id,
                parentCommentId,
                createdAt: serverTimestamp(),
                read: false
              });
            }
          }
        }
      }

      return {
        id: commentRef.id,
        ...commentData,
        createdAt: new Date() // Return current date for optimistic updates
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async getComments(storyId, limitCount = 20, cursor = null, sortBy = 'newest') {
    try {
      
      // Simple query without complex indexes - get all comments and filter client-side
      let q = query(
        collection(db, 'stories', storyId, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(limitCount * 2) // Get more to account for filtering
      );

      // Apply cursor for pagination
      if (cursor) {
        const cursorDoc = await getDoc(doc(db, 'stories', storyId, 'comments', cursor));
        if (cursorDoc.exists()) {
          q = query(q, startAfter(cursorDoc));
        }
      }

      const snapshot = await getDocs(q);
      let allComments = [];
      
      // Get all comments and filter client-side
      for (const docSnap of snapshot.docs) {
        const comment = { id: docSnap.id, ...docSnap.data() };
        allComments.push(comment);
      }

      // Filter for top-level comments only (no parentCommentId)
      const topLevelComments = allComments.filter(comment => !comment.parentCommentId);
      
      // Apply client-side sorting
      switch (sortBy) {
        case 'oldest':
          topLevelComments.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return aTime - bTime;
          });
          break;
        case 'popular':
          topLevelComments.sort((a, b) => {
            const aScore = (a.likesCount || 0);
            const bScore = (b.likesCount || 0);
            if (aScore === bScore) {
              const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return bTime - aTime;
            }
            return bScore - aScore;
          });
          break;
        default: // newest
          topLevelComments.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return bTime - aTime;
          });
      }

      // Limit to requested count
      const comments = topLevelComments.slice(0, limitCount);
      let nextCursor = null;
      
      // Set next cursor for pagination
      if (comments.length === limitCount && topLevelComments.length > limitCount) {
        nextCursor = comments[comments.length - 1].id;
      }

      const total = await this.getCommentsCount(storyId);

      return {
        comments,
        nextCursor,
        hasMore: comments.length === limitCount && topLevelComments.length > limitCount,
        total
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      return { comments: [], nextCursor: null, hasMore: false, total: 0 };
    }
  }

  async getCommentReplies(storyId, parentCommentId, limitCount = 20) {
    try {
      // Get all comments and filter client-side to avoid index requirements
      const q = query(
        collection(db, 'stories', storyId, 'comments'),
        orderBy('createdAt', 'asc'),
        limit(100) // Get more comments to filter from
      );

      const snapshot = await getDocs(q);
      const allComments = [];
      
      snapshot.forEach(doc => {
        allComments.push({ id: doc.id, ...doc.data() });
      });

      // Filter for replies to this specific comment
      const replies = allComments
        .filter(comment => comment.parentCommentId === parentCommentId)
        .slice(0, limitCount);

      return { replies };
    } catch (error) {
      console.error('Error getting comment replies:', error);
      return { replies: [] };
    }
  }

  async getCommentsCount(storyId) {
    try {
      const storyDoc = await getDoc(doc(db, 'stories', storyId));
      if (storyDoc.exists()) {
        return storyDoc.data().stats?.commentsCount || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting comments count:', error);
      return 0;
    }
  }

  async updateComment(storyId, commentId, content, userId) {
    try {
      const commentRef = doc(db, 'stories', storyId, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentDoc.data();
      if (comment.userId !== userId) {
        throw new Error('Unauthorized to edit this comment');
      }

      await updateDoc(commentRef, {
        content,
        updatedAt: serverTimestamp(),
        isEdited: true
      });

      return {
        id: commentId,
        ...comment,
        content,
        isEdited: true,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(storyId, commentId, userId) {
    try {
      const batch = writeBatch(db);
      const commentRef = doc(db, 'stories', storyId, 'comments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const comment = commentDoc.data();
      if (comment.userId !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }

      // Check if comment has replies
      const repliesQuery = query(
        collection(db, 'stories', storyId, 'comments'),
        where('parentCommentId', '==', commentId),
        limit(1)
      );
      const repliesSnapshot = await getDocs(repliesQuery);

      if (repliesSnapshot.empty) {
        // No replies, safe to delete completely
        batch.delete(commentRef);
        
        // Update parent comment's reply count if this is a reply
        if (comment.parentCommentId) {
          const parentCommentRef = doc(db, 'stories', storyId, 'comments', comment.parentCommentId);
          batch.update(parentCommentRef, {
            repliesCount: increment(-1)
          });
        }
      } else {
        // Has replies, mark as deleted instead
        batch.update(commentRef, {
          content: '[deleted]',
          isDeleted: true,
          deletedAt: serverTimestamp()
        });
      }

      // Update story comments count
      const storyRef = doc(db, 'stories', storyId);
      batch.update(storyRef, {
        'stats.commentsCount': increment(-1)
      });

      await batch.commit();
      return commentId;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  async toggleCommentLike(storyId, commentId, userId) {
    try {
      const batch = writeBatch(db);
      const likeRef = doc(db, 'commentLikes', `${userId}_${commentId}`);
      const likeDoc = await getDoc(likeRef);
      const commentRef = doc(db, 'stories', storyId, 'comments', commentId);

      if (likeDoc.exists()) {
        // Unlike
        batch.delete(likeRef);
        batch.update(commentRef, {
          likesCount: increment(-1)
        });
        await batch.commit();
        return false;
      } else {
        // Like
        batch.set(likeRef, {
          userId,
          commentId,
          storyId,
          createdAt: serverTimestamp()
        });
        batch.update(commentRef, {
          likesCount: increment(1)
        });
        await batch.commit();
        return true;
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  // Real-time listener for comments
  subscribeToComments(storyId, callback) {
    try {
      // Use a simpler query to avoid complex index requirements
      const q = query(
        collection(db, 'stories', storyId, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(5) // Only listen to top 5 newest comments for real-time updates
      );

      return onSnapshot(q, 
        (snapshot) => {
          try {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const commentData = change.doc.data();
                // Only process top-level comments (no parentCommentId)
                if (!commentData.parentCommentId) {
                  const newComment = { id: change.doc.id, ...commentData };
                  callback(newComment);
                }
              }
            });
          } catch (error) {
            console.error('Error processing comment changes:', error);
          }
        },
        (error) => {
          console.error('Comments listener error:', error);
          // Return a no-op function to prevent further errors
          return () => {};
        }
      );
    } catch (error) {
      console.error('Error setting up comments listener:', error);
      // Return a no-op function to prevent crashes
      return () => {};
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