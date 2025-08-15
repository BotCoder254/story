import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiPlus,
  FiMap,
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiTrendingUp,
  FiGlobe,
  FiCamera,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiCompass,
  FiSave,
  FiSearch,
  FiHash,
  FiActivity,
  FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';
import Feed from '../components/feed/Feed';
import Composer from '../components/composer/Composer';
import searchService from '../services/searchService';
import storyService from '../services/storyService';

// Discover Tab Component
const DiscoverTab = ({ userId }) => {
  const { data: discoveryStories, isLoading } = useQuery({
    queryKey: ['discovery', userId],
    queryFn: () => searchService.getDiscoveryFeed(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 15, // Auto-refresh every 15 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!discoveryStories || discoveryStories.length === 0) {
    return (
      <div className="text-center py-12">
        <FiSearch className="text-4xl text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Discover New Stories
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          Explore stories from around the world
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <FiCompass className="text-primary-600 dark:text-primary-400" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Discover Stories
        </h3>
      </div>

      <div className="space-y-4">
        {discoveryStories.map((story) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card card-hover"
          >
            {story.media && story.media[0] && (
              <img
                src={story.media[0].url}
                alt={story.title}
                className="w-full h-48 rounded-lg object-cover mb-4"
              />
            )}
            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-900 dark:text-white">
                {story.title}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                {story.content}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img
                    src={story.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName || 'User')}&background=0ea5e9&color=fff&size=32`}
                    alt={story.authorName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {story.authorName}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center space-x-1">
                    <FiHeart />
                    <span>{story.stats?.likeCount || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiMessageCircle />
                    <span>{story.stats?.commentsCount || 0}</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Saved Stories Tab Component
const SavedStoriesTab = ({ userId }) => {
  const { data: savedStories, isLoading, refetch } = useQuery({
    queryKey: ['savedStories', userId],
    queryFn: () => storyService.getUserBookmarkedStories(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes for more frequent updates
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });

  // Add refresh button for manual updates
  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!savedStories || savedStories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Saved Stories
          </h3>
          <button
            onClick={handleRefresh}
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="text-center py-12">
          <FiBookmark className="text-4xl text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Your Saved Stories
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Stories you've bookmarked will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Saved Stories ({savedStories.length})
        </h3>
        <button
          onClick={handleRefresh}
          className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      {savedStories.map((story) => (
        <motion.div
          key={story.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card card-hover"
        >
          <div className="flex items-start space-x-3">
            {story.media && story.media[0] && (
              <img
                src={story.media[0].url}
                alt={story.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-1 truncate">
                {story.title}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">
                {story.content}
              </p>
              <div className="flex items-center space-x-4 text-xs text-neutral-500 dark:text-neutral-400">
                <span>By {story.authorName}</span>
                <span>{story.stats?.likeCount || 0} likes</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [showComposer, setShowComposer] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState('feed');
  const [activeRightTab, setActiveRightTab] = useState('map');
  const [userStats, setUserStats] = useState({
    stories: 0,
    followers: 0,
    likes: 0,
    countries: 0
  });

  // Fetch user stats
  const { data: userStoriesData } = useQuery({
    queryKey: ['userStories', currentUser?.uid],
    queryFn: () => storyService.getUserStories(currentUser?.uid, true),
    enabled: !!currentUser?.uid,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch trending tags
  const { data: trendingTags = [] } = useQuery({
    queryKey: ['trendingTags'],
    queryFn: () => searchService.getPopularTags(6),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 15, // Auto-refresh every 15 minutes
  });

  // Calculate user stats from stories
  useEffect(() => {
    if (userStoriesData) {
      const publishedStories = userStoriesData.filter(story => !story.isDraft);
      const totalLikes = publishedStories.reduce((sum, story) => sum + (story.stats?.likeCount || 0), 0);
      const uniqueCountries = new Set(
        publishedStories
          .map(story => story.location?.name)
          .filter(Boolean)
      ).size;

      setUserStats({
        stories: publishedStories.length,
        followers: Math.floor(Math.random() * 2000) + 500, // Mock data for now
        likes: totalLikes,
        countries: uniqueCountries
      });
    }
  }, [userStoriesData]);

  const stats = [
    { label: 'Stories', value: userStats.stories.toString(), icon: FiBookmark, color: 'text-primary-600' },
    { label: 'Followers', value: userStats.followers > 1000 ? `${(userStats.followers / 1000).toFixed(1)}K` : userStats.followers.toString(), icon: FiUsers, color: 'text-secondary-600' },
    { label: 'Likes', value: userStats.likes > 1000 ? `${(userStats.likes / 1000).toFixed(1)}K` : userStats.likes.toString(), icon: FiHeart, color: 'text-red-500' },
    { label: 'Countries', value: userStats.countries.toString(), icon: FiGlobe, color: 'text-accent-600' }
  ];

  // Mock recent activity (in a real app, this would come from a notifications service)
  const recentActivity = [
    { user: 'Sarah Chen', action: 'liked your story', story: 'Sunrise Over Santorini', time: '2m ago', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' },
    { user: 'Marco Silva', action: 'commented on', story: 'Lost in Tokyo Streets', time: '5m ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' },
    { user: 'Aisha Patel', action: 'started following you', time: '1h ago', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face' },
    { user: 'David Kim', action: 'bookmarked your story', story: 'Sahara Desert Dreams', time: '2h ago', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }
  ];

  const leftNavItems = [
    { id: 'feed', label: 'Feed', icon: FiCompass },
    { id: 'discover', label: 'Discover', icon: FiSearch },
    { id: 'saved', label: 'Saved', icon: FiBookmark },
    { id: 'profile', label: 'Profile', icon: FiUsers }
  ];

  const rightNavItems = [
    { id: 'map', label: 'Map', icon: FiMap },
    { id: 'trending', label: 'Trending', icon: FiTrendingUp },
    { id: 'activity', label: 'Activity', icon: FiActivity }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <FiGlobe className="text-white text-lg" />
              </div>
              <span className="text-xl font-display font-bold gradient-text">
                Wanderlust Stories
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="flex items-center space-x-3">
                <img
                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&background=0ea5e9&color=fff`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden sm:inline text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {currentUser?.displayName || 'User'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <FiLogOut />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-6 py-6">
          {/* Left Sidebar - Navigation & Profile */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <div className="card">
              <div className="text-center mb-6">
                <img
                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&background=0ea5e9&color=fff&size=128`}
                  alt="Profile"
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {currentUser?.displayName || 'User'}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Travel Storyteller
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                  >
                    <stat.icon className={`text-xl ${stat.color} mx-auto mb-1`} />
                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {leftNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveLeftTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeLeftTab === item.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                  >
                    <item.icon className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Center Feed */}
          <div className="lg:col-span-6">
            {/* Floating Action Button for Mobile */}
            <motion.button
              onClick={() => setShowComposer(true)}
              className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full shadow-strong flex items-center justify-center z-30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiPlus className="text-xl" />
            </motion.button>

            {/* Create Story Button for Desktop */}
            <motion.button
              onClick={() => setShowComposer(true)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="hidden lg:flex w-full mb-6 p-6 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-3 w-full">
                <FiPlus className="text-2xl" />
                <div className="text-left">
                  <div className="text-lg font-semibold">Create New Story</div>
                  <div className="text-sm text-white/80">Share your latest adventure</div>
                </div>
              </div>
            </motion.button>

            {/* Feed Content */}
            {activeLeftTab === 'feed' && <Feed />}

            {activeLeftTab === 'discover' && (
              <DiscoverTab userId={currentUser?.uid} />
            )}

            {activeLeftTab === 'saved' && (
              <SavedStoriesTab userId={currentUser?.uid} />
            )}

            {activeLeftTab === 'profile' && (
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Profile Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        defaultValue={currentUser?.displayName || ''}
                        className="input-field"
                        placeholder="Enter your display name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        className="input-field"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <button className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Map, Trending, Activity */}
          <div className="lg:col-span-3 space-y-6">
            {/* Right Navigation */}
            <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
              {rightNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveRightTab(item.id)}
                    className={`flex items-center justify-center lg:justify-start space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 lg:flex-none ${activeRightTab === item.id
                      ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                  >
                    <Icon className="text-lg" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Content */}
            {activeRightTab === 'map' && (
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Travel Map
                </h3>
                <div className="h-64 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                  <div className="text-center text-neutral-500 dark:text-neutral-400">
                    <FiMap className="text-3xl mx-auto mb-2" />
                    <p className="text-sm">Interactive map coming soon!</p>
                  </div>
                </div>
              </div>
            )}

            {activeRightTab === 'trending' && (
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Trending Tags
                </h3>
                <div className="space-y-3">
                  {trendingTags.map((tag, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <FiHash className="text-primary-600 dark:text-primary-400" />
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {tag}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        #{index + 1}
                      </span>
                    </motion.div>
                  ))}
                  {trendingTags.length === 0 && (
                    <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
                      <FiHash className="text-2xl mx-auto mb-2" />
                      <p className="text-sm">No trending tags yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeRightTab === 'activity' && (
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <img
                        src={activity.avatar}
                        alt={activity.user}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900 dark:text-white">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {activity.action}
                          </span>
                          {activity.story && (
                            <span className="font-medium"> "{activity.story}"</span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 z-20">
        <div className="grid grid-cols-4 gap-1 p-2">
          {leftNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveLeftTab(item.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${activeLeftTab === item.id
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400'
                }`}
            >
              <item.icon className="text-lg" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Composer Modal */}
      <Composer
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
      />
    </div>
  );
};

export default DashboardPage;