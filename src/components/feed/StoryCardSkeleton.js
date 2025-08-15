import React from 'react';

const StoryCardSkeleton = () => {
  return (
    <div className="card bg-white dark:bg-neutral-800 overflow-hidden animate-pulse">
      {/* Author Header Skeleton */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-1" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
          <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
        </div>
      </div>

      {/* Title Skeleton */}
      <div className="px-4 pb-3">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
      </div>

      {/* Media Skeleton */}
      <div className="aspect-video bg-neutral-200 dark:bg-neutral-700" />

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4/6" />
        </div>

        {/* Tags Skeleton */}
        <div className="flex space-x-2 mt-4">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-16" />
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-20" />
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-14" />
        </div>
      </div>

      {/* Engagement Bar Skeleton */}
      <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-8" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-8" />
            </div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
            <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryCardSkeleton;