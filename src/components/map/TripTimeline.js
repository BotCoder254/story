import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import {
  FiMapPin,
  FiCalendar,
  FiClock,
  FiHeart,
  FiMessageCircle,
  FiEye,
  FiNavigation,
  FiChevronDown,
  FiChevronUp,
  FiShare2,
  FiBookmark
} from 'react-icons/fi';
import TravelMap from './TravelMap';

const TripTimeline = ({
  stories = [],
  title = "My Travel Journey",
  onStorySelect,
  onLocationSelect,
  className = ''
}) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [expandedStories, setExpandedStories] = useState(new Set());
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]);
  const [mapZoom, setMapZoom] = useState(10);

  // Sort stories by date and calculate trip bounds
  const sortedStories = React.useMemo(() => {
    const storiesWithLocation = stories.filter(story => 
      story.location && story.location.lat && story.location.lng
    );

    const sorted = storiesWithLocation.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return aTime - bTime;
    });

    // Calculate map bounds
    if (sorted.length > 0) {
      const lats = sorted.map(s => s.location.lat);
      const lngs = sorted.map(s => s.location.lng);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      setMapCenter([centerLat, centerLng]);
      
      // Calculate appropriate zoom level
      const latDiff = Math.max(...lats) - Math.min(...lats);
      const lngDiff = Math.max(...lngs) - Math.min(...lngs);
      const maxDiff = Math.max(latDiff, lngDiff);
      const zoom = maxDiff > 10 ? 3 : maxDiff > 5 ? 5 : maxDiff > 1 ? 8 : 10;
      setMapZoom(zoom);
    }

    return sorted;
  }, [stories]);

  const toggleStoryExpansion = (storyId) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  };

  const handleStorySelect = (story) => {
    setSelectedStory(story);
    if (onStorySelect) {
      onStorySelect(story);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, yyyy');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'HH:mm');
  };

  const calculateTripStats = () => {
    const totalStories = sortedStories.length;
    const totalLikes = sortedStories.reduce((sum, story) => sum + (story.stats?.likeCount || 0), 0);
    const totalComments = sortedStories.reduce((sum, story) => sum + (story.stats?.commentsCount || 0), 0);
    
    const countries = new Set();
    const cities = new Set();
    
    sortedStories.forEach(story => {
      if (story.location?.country) countries.add(story.location.country);
      if (story.location?.city) cities.add(story.location.city);
    });

    return {
      totalStories,
      totalLikes,
      totalComments,
      countries: countries.size,
      cities: cities.size
    };
  };

  const stats = calculateTripStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Trip Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
              {title}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {sortedStories.length} stories across your journey
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="btn-ghost">
              <FiShare2 className="mr-2" />
              Share Trip
            </button>
            <button className="btn-outline">
              <FiBookmark className="mr-2" />
              Save Trip
            </button>
          </div>
        </div>

        {/* Trip Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{stats.totalStories}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Stories</div>
          </div>
          <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="text-2xl font-bold text-red-500">{stats.totalLikes}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Likes</div>
          </div>
          <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{stats.totalComments}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Comments</div>
          </div>
          <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="text-2xl font-bold text-accent-600">{stats.countries}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Countries</div>
          </div>
          <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="text-2xl font-bold text-secondary-600">{stats.cities}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Cities</div>
          </div>
        </div>

        {/* Trip Map */}
        <div className="h-80 rounded-lg overflow-hidden">
          <TravelMap
            stories={sortedStories}
            center={mapCenter}
            zoom={mapZoom}
            height="100%"
            onStorySelect={handleStorySelect}
            onLocationSelect={onLocationSelect}
            showControls={true}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-semibold text-neutral-900 dark:text-white">
          Journey Timeline
        </h3>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-600 via-secondary-600 to-accent-600"></div>

          {/* Timeline Items */}
          <div className="space-y-6">
            {sortedStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start space-x-4"
              >
                {/* Timeline Dot */}
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white font-bold shadow-medium">
                  {index + 1}
                </div>

                {/* Story Card */}
                <div className="flex-1 card card-hover">
                  <div className="flex items-start space-x-4">
                    {/* Story Image */}
                    {story.media && story.media.length > 0 && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={story.media[0].url}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Story Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-neutral-900 dark:text-white line-clamp-2">
                            {story.title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            <div className="flex items-center space-x-1">
                              <FiCalendar className="text-xs" />
                              <span>{formatDate(story.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FiClock className="text-xs" />
                              <span>{formatTime(story.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleStoryExpansion(story.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          {expandedStories.has(story.id) ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>

                      {/* Location */}
                      {story.location && (
                        <div className="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                          <FiMapPin className="text-xs text-primary-600" />
                          <span className="truncate">
                            {story.location.name || story.location.address}
                          </span>
                        </div>
                      )}

                      {/* Story Preview */}
                      <p className="text-neutral-700 dark:text-neutral-300 line-clamp-2 mb-3">
                        {story.excerpt || story.content?.substring(0, 150) + '...'}
                      </p>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {expandedStories.has(story.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 mb-3"
                          >
                            {/* Full Content */}
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <p>{story.content}</p>
                            </div>

                            {/* Tags */}
                            {story.tags && story.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {story.tags.slice(0, 5).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-lg"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Additional Media */}
                            {story.media && story.media.length > 1 && (
                              <div className="grid grid-cols-3 gap-2">
                                {story.media.slice(1, 4).map((media, mediaIndex) => (
                                  <div key={mediaIndex} className="aspect-square rounded-lg overflow-hidden">
                                    <img
                                      src={media.url}
                                      alt={`${story.title} ${mediaIndex + 2}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Story Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                          <div className="flex items-center space-x-1">
                            <FiHeart className="text-red-500" />
                            <span>{story.stats?.likeCount || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiMessageCircle />
                            <span>{story.stats?.commentsCount || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiEye />
                            <span>{story.stats?.viewsCount || 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStorySelect(story)}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                          >
                            View on Map
                          </button>
                          <button className="btn-ghost text-sm px-3 py-1">
                            Read Full Story
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {sortedStories.length === 0 && (
            <div className="text-center py-12">
              <FiNavigation className="text-4xl text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                No Journey Yet
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Start sharing your travel stories to build your journey timeline
              </p>
              <button className="btn-primary">
                Create Your First Story
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripTimeline;