import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  FiTrendingUp,
  FiClock,
  FiHash,
  FiMapPin,
  FiUsers,
  FiEye,
  FiSearch
} from 'react-icons/fi';
import SearchBar from '../components/search/SearchBar';
import SearchResults from '../components/search/SearchResults';
import searchService from '../services/searchService';
import { useAuth } from '../contexts/AuthContext';

const SearchPage = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [allResults, setAllResults] = useState([]);

  const pageSize = 20;

  // Search query
  const {
    data: searchData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['search', searchQuery, searchFilters, currentPage],
    queryFn: async () => {
      if (!searchQuery.trim() && Object.keys(searchFilters).length === 0) {
        // Return trending stories if no search query
        return {
          stories: await searchService.getTrendingStories('7d', pageSize),
          total: 0,
          hasMore: false,
          searchTime: Date.now()
        };
      }
      
      return await searchService.searchStories(searchQuery, {
        filters: searchFilters,
        limitCount: pageSize,
        offset: currentPage * pageSize
      });
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    keepPreviousData: true,
    onSuccess: (data) => {
      if (currentPage === 0) {
        setAllResults(data.stories || []);
      } else {
        setAllResults(prev => [...prev, ...(data.stories || [])]);
      }
    }
  });

  // Trending tags query with real-time updates
  const {
    data: trendingTags = [],
    refetch: refetchTags
  } = useQuery({
    queryKey: ['trendingTags'],
    queryFn: () => searchService.getPopularTags(20),
    staleTime: 1000 * 60 * 5, // 5 minutes for more frequent updates
    refetchInterval: 1000 * 60 * 10, // Auto-refetch every 10 minutes
    refetchOnWindowFocus: true,
  });

  // Discovery feed query (when no search)
  const {
    data: discoveryStories = []
  } = useQuery({
    queryKey: ['discovery', currentUser?.uid],
    queryFn: () => searchService.getDiscoveryFeed(currentUser?.uid),
    enabled: !searchQuery && Object.keys(searchFilters).length === 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const handleSearch = useCallback((query, filters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    setCurrentPage(0);
    setAllResults([]);
  }, []);

  const handleFilterChange = useCallback((filters) => {
    setSearchFilters(filters);
    setCurrentPage(0);
    setAllResults([]);
  }, []);

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleTagClick = (tag) => {
    setSearchQuery(`#${tag}`);
    setCurrentPage(0);
    setAllResults([]);
  };

  const currentResults = currentPage === 0 ? (searchData?.stories || []) : allResults;
  const hasMore = searchData?.hasMore || false;
  const totalResults = searchData?.total || currentResults.length;
  const searchTime = searchData?.searchTime;

  // Show discovery content when no search
  const showDiscovery = !searchQuery && Object.keys(searchFilters).length === 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Search Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Search Header */}
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-display font-bold text-neutral-900 dark:text-white mb-4"
              >
                Discover Amazing Stories
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto"
              >
                Search through thousands of travel stories, find inspiration, and connect with fellow adventurers
              </motion.p>
            </div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SearchBar
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                placeholder="Search stories, places, authors, or tags..."
                showFilters={true}
              />
            </motion.div>

            {/* Search Results or Discovery Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {showDiscovery ? (
                <div className="space-y-8">
                  {/* Trending Stories */}
                  <div>
                    <div className="flex items-center space-x-2 mb-6">
                      <FiTrendingUp className="text-secondary-600 dark:text-secondary-400" />
                      <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
                        Trending This Week
                      </h2>
                    </div>
                    <SearchResults
                      results={searchData?.stories || []}
                      isLoading={isLoading}
                      isError={isError}
                      error={error}
                      searchQuery=""
                      totalResults={0}
                      onLoadMore={handleLoadMore}
                      hasMore={false}
                    />
                  </div>

                  {/* Discovery Feed */}
                  {discoveryStories.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-6">
                        <FiEye className="text-primary-600 dark:text-primary-400" />
                        <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
                          Discover New Stories
                        </h2>
                      </div>
                      <SearchResults
                        results={discoveryStories}
                        isLoading={false}
                        isError={false}
                        searchQuery=""
                        totalResults={discoveryStories.length}
                        onLoadMore={() => {}}
                        hasMore={false}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <SearchResults
                  results={currentResults}
                  isLoading={isLoading}
                  isError={isError}
                  error={error}
                  searchQuery={searchQuery}
                  totalResults={totalResults}
                  searchTime={searchTime}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                />
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Trending Tags */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center space-x-2 mb-4">
                <FiHash className="text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Trending Tags
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {trendingTags.slice(0, 15).map((tag, index) => (
                  <motion.button
                    key={tag}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    onClick={() => handleTagClick(tag)}
                    className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                  >
                    #{tag}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Search Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center space-x-2 mb-4">
                <FiSearch className="text-accent-600 dark:text-accent-400" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Search Tips
                </h3>
              </div>
              
              <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="flex items-start space-x-2">
                  <FiHash className="text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Use hashtags</span> to find stories by topic
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      Example: #backpacking #foodie
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <FiMapPin className="text-accent-600 dark:text-accent-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Search locations</span> to find stories from specific places
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      Example: Tokyo, Bali, Iceland
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <FiUsers className="text-secondary-600 dark:text-secondary-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Find authors</span> by searching their names
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      Example: Sarah Chen, Marco Silva
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <FiClock className="text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Use filters</span> to narrow down results
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      Filter by date, trip type, and more
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Community Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Stories</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">10,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Active Writers</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">1,456</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Countries Covered</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">195</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">This Week</span>
                  <span className="font-semibold text-accent-600 dark:text-accent-400">+127 stories</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;