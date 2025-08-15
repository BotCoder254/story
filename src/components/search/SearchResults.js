import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiClock,
  FiTrendingUp,
  FiGrid,
  FiList,
  FiMapPin,
  FiHash,
  FiUser,
  FiCalendar
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import StoryCard from '../feed/StoryCard';
import StoryCardSkeleton from '../feed/StoryCardSkeleton';

const SearchResults = ({
  results = [],
  isLoading = false,
  isError = false,
  error = null,
  searchQuery = '',
  totalResults = 0,
  searchTime = 0,
  onLoadMore,
  hasMore = false,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const terms = query.split(' ').filter(term => term.length > 0);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  const formatSearchTime = (time) => {
    if (!time) return '';
    return `${(time / 1000).toFixed(2)}s`;
  };

  const getSearchResultType = (story) => {
    if (!searchQuery) return null;
    
    const query = searchQuery.toLowerCase();
    const title = (story.title || '').toLowerCase();
    const content = (story.content || '').toLowerCase();
    const author = (story.authorName || '').toLowerCase();
    const location = (story.location?.name || '').toLowerCase();
    const tags = (story.tags || []).join(' ').toLowerCase();

    if (title.includes(query)) return 'title';
    if (author.includes(query)) return 'author';
    if (location.includes(query)) return 'location';
    if (tags.includes(query)) return 'tag';
    if (content.includes(query)) return 'content';
    return 'other';
  };

  const getResultTypeIcon = (type) => {
    switch (type) {
      case 'title': return FiSearch;
      case 'author': return FiUser;
      case 'location': return FiMapPin;
      case 'tag': return FiHash;
      case 'content': return FiSearch;
      default: return FiSearch;
    }
  };

  const getResultTypeLabel = (type) => {
    switch (type) {
      case 'title': return 'Title match';
      case 'author': return 'Author match';
      case 'location': return 'Location match';
      case 'tag': return 'Tag match';
      case 'content': return 'Content match';
      default: return 'Match';
    }
  };

  if (isLoading && results.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
          </div>
        </div>
        
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <StoryCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FiSearch className="text-4xl text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Search Error
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {error?.message || 'Something went wrong while searching'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!searchQuery && results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FiSearch className="text-4xl text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Start Your Search
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          Search for stories, places, authors, or tags to discover amazing travel experiences
        </p>
      </div>
    );
  }

  if (searchQuery && results.length === 0 && !isLoading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FiSearch className="text-4xl text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          No Results Found
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          No stories found for "<span className="font-medium">{searchQuery}</span>"
        </p>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          <p>Try:</p>
          <ul className="mt-2 space-y-1">
            <li>• Using different keywords</li>
            <li>• Checking your spelling</li>
            <li>• Using more general terms</li>
            <li>• Searching for locations or tags</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {searchQuery ? (
              <>
                Search results for "
                <span 
                  className="text-primary-600 dark:text-primary-400"
                  dangerouslySetInnerHTML={{ __html: highlightText(searchQuery, searchQuery) }}
                />
                "
              </>
            ) : (
              'All Stories'
            )}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {totalResults > 0 && (
              <>
                {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''}
                {searchTime > 0 && (
                  <span className="ml-2">
                    ({formatSearchTime(searchTime)})
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <FiList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <FiGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'space-y-6'
      }>
        <AnimatePresence>
          {results.map((story, index) => {
            const resultType = getSearchResultType(story);
            const ResultTypeIcon = getResultTypeIcon(resultType);
            
            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Search Result Type Badge */}
                {searchQuery && resultType && (
                  <div className="absolute top-4 right-4 z-10 bg-primary-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                    <ResultTypeIcon className="h-3 w-3" />
                    <span>{getResultTypeLabel(resultType)}</span>
                  </div>
                )}

                {/* Story Card with Highlighted Content */}
                <div className="story-card-wrapper">
                  <StoryCard 
                    story={{
                      ...story,
                      title: searchQuery ? highlightText(story.title, searchQuery) : story.title,
                      content: searchQuery ? highlightText(story.content?.substring(0, 200) + '...', searchQuery) : story.content
                    }}
                    showHighlights={!!searchQuery}
                  />
                </div>

                {/* Search Relevance Score (for debugging) */}
                {process.env.NODE_ENV === 'development' && story.searchRelevance && (
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Score: {story.searchRelevance}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Loading More */}
      {isLoading && results.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading more results...</span>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="text-center py-8">
          <button
            onClick={onLoadMore}
            className="btn-outline"
          >
            Load More Results
          </button>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && results.length > 0 && !isLoading && (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          <p className="text-sm">
            You've reached the end of the search results
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;