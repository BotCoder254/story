import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  FiTrendingUp,
  FiClock,
  FiHeart,
  FiMapPin,
  FiUsers,
  FiRefreshCw
} from 'react-icons/fi';
import StoryCard from './StoryCard';
import StoryCardSkeleton from './StoryCardSkeleton';
import storyService from '../../services/storyService';
import { useAuth } from '../../contexts/AuthContext';

const Feed = () => {
  const { currentUser } = useAuth();
  const [feedType, setFeedType] = useState('latest');
  const [realTimeStories, setRealTimeStories] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const feedTypes = [
    { id: 'latest', label: 'Latest', icon: FiClock },
    { id: 'trending', label: 'Trending', icon: FiTrendingUp },
    { id: 'forYou', label: 'For You', icon: FiHeart },
    { id: 'nearby', label: 'Nearby', icon: FiMapPin },
    { id: 'following', label: 'Following', icon: FiUsers }
  ];

  // Infinite query for stories
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['stories', feedType],
    queryFn: async ({ pageParam = null }) => {
      return await storyService.getStories({
        orderType: feedType,
        lastDoc: pageParam,
        limitCount: 10,
        userId: currentUser?.uid
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.lastDoc : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  // Real-time listener for top stories
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = storyService.subscribeToStories(
      (stories) => {
        setRealTimeStories(stories.slice(0, 5)); // Top 5 for real-time updates
      },
      {
        orderType: feedType,
        limitCount: 5
      }
    );

    return () => unsubscribe && unsubscribe();
  }, [feedType, currentUser]);

  // Merge real-time stories with paginated data
  const allStories = React.useMemo(() => {
    if (!data?.pages) return [];
    
    const paginatedStories = data.pages.flatMap(page => page.stories);
    
    // Merge real-time updates with paginated data, avoiding duplicates
    const mergedStories = [...realTimeStories];
    
    paginatedStories.forEach(story => {
      if (!mergedStories.find(s => s.id === story.id)) {
        mergedStories.push(story);
      }
    });

    return mergedStories;
  }, [data, realTimeStories]);

  // Virtualization setup
  const parentRef = React.useRef();
  const virtualizer = useVirtualizer({
    count: allStories.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated story card height
    overscan: 5,
  });

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <StoryCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-500 dark:text-neutral-400 mb-4">
          Failed to load stories
        </div>
        <button
          onClick={handleRefresh}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Type Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
          {feedTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setFeedType(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  feedType === type.id
                    ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className="text-sm" />
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <FiRefreshCw className={`text-lg ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stories Feed */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-200px)] overflow-auto custom-scrollbar"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <AnimatePresence mode="popLayout">
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const story = allStories[virtualItem.index];
              if (!story) return null;

              return (
                <motion.div
                  key={story.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="px-1 pb-6">
                    <StoryCard story={story} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-8">
            <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading more stories...</span>
            </div>
          </div>
        )}

        {/* End of feed */}
        {!hasNextPage && allStories.length > 0 && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            You've reached the end of the feed
          </div>
        )}

        {/* Empty state */}
        {allStories.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-neutral-500 dark:text-neutral-400 mb-4">
              No stories found
            </div>
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              Be the first to share your travel adventure!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;