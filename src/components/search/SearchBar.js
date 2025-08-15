import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiClock,
  FiTrendingUp,
  FiMapPin,
  FiHash,
  FiFilter,
  FiLoader
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import searchService from '../../services/searchService';
import { useDebounce } from '../../hooks/useDebounce';

const SearchBar = ({
  onSearch,
  onFilterChange,
  placeholder = "Search stories, places, or tags...",
  showFiltersOption = true,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    dateRange: null,
    tripType: '',
    tags: [],
    location: ''
  });

  const searchInputRef = useRef();
  const suggestionsRef = useRef();
  const debouncedQuery = useDebounce(query, 300);

  // Get search suggestions
  const {
    data: suggestions = [],
    isLoading: suggestionsLoading
  } = useQuery({
    queryKey: ['searchSuggestions', debouncedQuery],
    queryFn: () => searchService.getSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && showSuggestions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle search
  useEffect(() => {
    if (debouncedQuery.length >= 2 || debouncedQuery.length === 0) {
      onSearch(debouncedQuery, filters);
    }
  }, [debouncedQuery, filters, onSearch]);

  // Handle filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleClearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'relevance',
      dateRange: null,
      tripType: '',
      tags: [],
      location: ''
    });
  };

  const hasActiveFilters = filters.dateRange || filters.tripType || filters.tags.length > 0 || filters.location;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-neutral-400" />
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
          {query && (
            <button
              onClick={handleClearSearch}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
          
          {showFiltersOption && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-1 transition-colors ${
                hasActiveFilters || showFiltersPanel
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <FiFilter className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-strong border border-neutral-200 dark:border-neutral-700 z-50 max-h-80 overflow-y-auto"
          >
            {suggestionsLoading ? (
              <div className="p-4 text-center">
                <FiLoader className="animate-spin mx-auto mb-2 text-neutral-400" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Loading suggestions...
                </p>
              </div>
            ) : (
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center space-x-3"
                  >
                    {suggestion.startsWith('#') ? (
                      <FiHash className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    ) : suggestion.includes(',') ? (
                      <FiMapPin className="text-accent-600 dark:text-accent-400 flex-shrink-0" />
                    ) : (
                      <FiClock className="text-neutral-400 flex-shrink-0" />
                    )}
                    <span className="text-neutral-900 dark:text-neutral-100 truncate">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Search Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </select>
              </div>

              {/* Trip Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Trip Type
                </label>
                <select
                  value={filters.tripType}
                  onChange={(e) => updateFilter('tripType', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="solo">Solo Travel</option>
                  <option value="couple">Couple</option>
                  <option value="family">Family</option>
                  <option value="friends">Friends</option>
                  <option value="business">Business</option>
                  <option value="adventure">Adventure</option>
                  <option value="relaxation">Relaxation</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  placeholder="City, country..."
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const now = new Date();
                      const ranges = {
                        '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
                        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
                        '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                      };
                      updateFilter('dateRange', { start: ranges[value], end: now });
                    } else {
                      updateFilter('dateRange', null);
                    }
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Time</option>
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last week</option>
                  <option value="30d">Last month</option>
                  <option value="90d">Last 3 months</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-600">
                <div className="flex flex-wrap gap-2">
                  {filters.tripType && (
                    <span className="inline-flex items-center px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-lg">
                      Trip: {filters.tripType}
                      <button
                        onClick={() => updateFilter('tripType', '')}
                        className="ml-1 text-primary-500 hover:text-primary-700"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  
                  {filters.location && (
                    <span className="inline-flex items-center px-2 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs rounded-lg">
                      Location: {filters.location}
                      <button
                        onClick={() => updateFilter('location', '')}
                        className="ml-1 text-accent-500 hover:text-accent-700"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  
                  {filters.dateRange && (
                    <span className="inline-flex items-center px-2 py-1 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 text-xs rounded-lg">
                      Date filtered
                      <button
                        onClick={() => updateFilter('dateRange', null)}
                        className="ml-1 text-secondary-500 hover:text-secondary-700"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;