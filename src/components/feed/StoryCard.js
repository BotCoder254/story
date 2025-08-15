import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiShare2,
  FiMapPin,
  FiMoreHorizontal,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiMap
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import storyService from '../../services/storyService';
import TravelMap from '../map/TravelMap';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

const StoryCard = ({ story }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(story.stats?.likeCount || 0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);

  // Initialize media items (images + map if location exists)
  useEffect(() => {
    const items = [];
    
    // Add story images
    if (story.media && story.media.length > 0) {
      story.media.forEach((media, index) => {
        items.push({
          type: 'image',
          url: media.url,
          alt: story.title,
          index
        });
      });
    }
    
    // Add map if location exists
    if (story.location && story.location.lat && story.location.lng) {
      items.push({
        type: 'map',
        location: story.location,
        story: story
      });
    }
    
    setMediaItems(items);
  }, [story]);

  // Check if user has liked/bookmarked this story
  useEffect(() => {
    const checkUserInteractions = async () => {
      if (!currentUser || !story.id) return;
      
      try {
        // Check if user has liked this story
        const userLikeRef = doc(db, 'userLikes', `${currentUser.uid}_${story.id}`);
        const likeDoc = await getDoc(userLikeRef);
        setIsLiked(likeDoc.exists());

        // Check if user has bookmarked this story
        const userBookmarkRef = doc(db, 'userBookmarks', `${currentUser.uid}_${story.id}`);
        const bookmarkDoc = await getDoc(userBookmarkRef);
        setIsBookmarked(bookmarkDoc.exists());
      } catch (error) {
        console.error('Error checking user interactions:', error);
        // Set default values on error
        setIsLiked(false);
        setIsBookmarked(false);
      }
    };

    checkUserInteractions();
  }, [story.id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please sign in to like stories');
      return;
    }

    if (isLoading) return; // Prevent multiple clicks

    setIsLoading(true);
    const previousLikedState = isLiked;
    const previousLikesCount = likesCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => !isLiked ? prev + 1 : prev - 1);

    try {
      const newLikedState = await storyService.toggleLike(story.id, currentUser.uid);
      // Update with actual result from server
      setIsLiked(newLikedState);
      setLikesCount(story.stats?.likeCount || (newLikedState ? likesCount + 1 : likesCount - 1));
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousLikedState);
      setLikesCount(previousLikesCount);
      toast.error('Failed to update like');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      toast.error('Please sign in to bookmark stories');
      return;
    }

    if (isLoading) return; // Prevent multiple clicks

    setIsLoading(true);
    const previousBookmarkedState = isBookmarked;

    // Optimistic update
    setIsBookmarked(!isBookmarked);

    try {
      const newBookmarkedState = await storyService.toggleBookmark(story.id, currentUser.uid);
      setIsBookmarked(newBookmarkedState);
      toast.success(newBookmarkedState ? 'Story bookmarked' : 'Bookmark removed');
    } catch (error) {
      // Revert optimistic update on error
      setIsBookmarked(previousBookmarkedState);
      toast.error('Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.excerpt || story.content?.substring(0, 100),
          url: `${window.location.origin}/story/${story.id}`,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/story/${story.id}`);
    toast.success('Link copied to clipboard');
  };

  const nextMedia = () => {
    if (mediaItems.length > 1) {
      setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
    }
  };

  const prevMedia = () => {
    if (mediaItems.length > 1) {
      setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    }
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (story.authorId) {
      navigate(`/profile/${story.authorId}`);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getExcerpt = (content, maxLength = 200) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <motion.article
      layout
      data-story-id={story.id}
      className="card card-hover bg-white dark:bg-neutral-800 overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Author Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <img
            src={story.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName || 'User')}&background=0ea5e9&color=fff`}
            alt={story.authorName}
            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
            onClick={handleProfileClick}
          />
          <div>
            <h4 
              className="font-medium text-neutral-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={handleProfileClick}
            >
              {story.authorName || 'Anonymous'}
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {formatDate(story.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentUser?.uid !== story.authorId && (
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                isFollowing
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
            <FiMoreHorizontal />
          </button>
        </div>
      </div>

      {/* Story Title */}
      <div className="px-4 pb-3">
        <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-white mb-2">
          {story.title}
        </h2>
        
        {/* Location */}
        {story.location && (
          <div className="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            <FiMapPin className="text-xs" />
            <span>{story.location.name || story.location}</span>
          </div>
        )}
      </div>

      {/* Media Carousel */}
      {mediaItems.length > 0 && (
        <div className="relative">
          <div className="aspect-video bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
            {mediaItems[currentMediaIndex]?.type === 'image' ? (
              <img
                src={mediaItems[currentMediaIndex].url}
                alt={mediaItems[currentMediaIndex].alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : mediaItems[currentMediaIndex]?.type === 'map' ? (
              <div className="w-full h-full">
                <TravelMap
                  stories={[story]}
                  userLocation={null}
                  height="100%"
                  showControls={false}
                  interactive={true}
                  className="w-full h-full"
                />
              </div>
            ) : null}
          </div>

          {/* Media Type Indicator */}
          <div className="absolute top-2 left-2">
            {mediaItems[currentMediaIndex]?.type === 'map' && (
              <div className="bg-black/50 text-white px-2 py-1 rounded-lg text-xs flex items-center space-x-1">
                <FiMap />
                <span>Map</span>
              </div>
            )}
          </div>

          {/* Media Navigation */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={nextMedia}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              >
                <FiChevronRight />
              </button>

              {/* Media Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentMediaIndex
                        ? 'bg-white'
                        : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Story Content */}
      <div className="p-4">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {showFullContent 
              ? story.content 
              : getExcerpt(story.content || story.excerpt)
            }
          </p>
          
          {story.content && story.content.length > 200 && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline mt-2"
            >
              {showFullContent ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {story.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-lg"
              >
                #{tag}
              </span>
            ))}
            {story.tags.length > 5 && (
              <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded-lg">
                +{story.tags.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Engagement Bar */}
      <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <motion.button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-red-500'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <FiHeart className={isLiked ? 'fill-current' : ''} />
              </motion.div>
              <span className="text-sm font-medium">{likesCount}</span>
            </motion.button>

            <button className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <FiMessageCircle />
              <span className="text-sm font-medium">{story.commentsCount || 0}</span>
            </button>

            <button className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
              <span className="text-sm font-medium">{story.viewsCount || 0} views</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              onClick={handleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <FiBookmark className={isBookmarked ? 'fill-current' : ''} />
            </motion.button>

            <button
              onClick={handleShare}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <FiShare2 />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default StoryCard;