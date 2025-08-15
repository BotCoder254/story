import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  FiMapPin,
  FiNavigation,
  FiSliders,
  FiRefreshCw,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';
import StoryCard from '../feed/StoryCard';
import StoryCardSkeleton from '../feed/StoryCardSkeleton';
import TravelMap from './TravelMap';
import geolocationService from '../../services/geolocationService';
import storyService from '../../services/storyService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const NearbyStories = ({ className = '' }) => {
  const { currentUser } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(5); // km
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Get nearby stories query
  const {
    data: nearbyStories = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['nearbyStories', userLocation, radius],
    queryFn: async () => {
      if (!userLocation) return [];
      
      // Get geohash query bounds for the radius
      const bounds = geolocationService.getGeohashQueryBounds(userLocation, radius);
      
      // Query stories within the geohash bounds
      const promises = bounds.map(bound => 
        storyService.getStoriesByGeohash(bound[0], bound[1])
      );
      
      const results = await Promise.all(promises);
      const allStories = results.flat();
      
      // Filter by actual distance and remove duplicates
      const uniqueStories = new Map();
      allStories.forEach(story => {
        if (story.location && story.location.lat && story.location.lng) {
          const distance = geolocationService.calculateDistance(
            userLocation,
            story.location
          );
          
          if (distance <= radius * 1000) { // Convert km to meters
            if (!uniqueStories.has(story.id)) {
              uniqueStories.set(story.id, {
                ...story,
                distance: distance / 1000 // Convert to km
              });
            }
          }
        }
      });
      
      // Sort by distance
      return Array.from(uniqueStories.values()).sort((a, b) => a.distance - b.distance);
    },
    enabled: !!userLocation,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
  });

  // Get user location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      const location = await geolocationService.getCurrentLocation();
      setUserLocation(location);
      toast.success('Location found!');
    } catch (error) {
      setLocationError(error.message);
      toast.error(error.message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const radiusOptions = [
    { value: 1, label: '1 km' },
    { value: 2, label: '2 km' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
            Stories Near You
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Discover travel stories from your area
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
          >
            <FiSliders />
          </button>
          
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <FiRefreshCw className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card"
        >
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
            Search Settings
          </h3>
          
          <div className="space-y-4">
            {/* Location Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiMapPin className="text-primary-600" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {userLocation ? 'Location detected' : 'No location'}
                </span>
              </div>
              
              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="btn-ghost text-sm"
              >
                {isGettingLocation ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <FiNavigation className="mr-2" />
                    Update Location
                  </>
                )}
              </button>
            </div>

            {/* Radius Selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Search Radius: {radius} km
              </label>
              
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs text-neutral-500">1km</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={radius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-neutral-500">50km</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {radiusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleRadiusChange(option.value)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      radius === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Location Error */}
      {locationError && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-red-500 mt-1" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                Location Access Required
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {locationError}
              </p>
              <button
                onClick={getCurrentLocation}
                className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Location State */}
      {!userLocation && !locationError && !isGettingLocation && (
        <div className="text-center py-12">
          <FiNavigation className="text-4xl text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Enable Location Access
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Allow location access to discover stories near you
          </p>
          <button
            onClick={getCurrentLocation}
            className="btn-primary"
          >
            <FiNavigation className="mr-2" />
            Get My Location
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && userLocation && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <StoryCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-12">
          <FiAlertCircle className="text-4xl text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Failed to Load Stories
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {error?.message || 'Something went wrong while loading nearby stories'}
          </p>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Map View */}
      {nearbyStories.length > 0 && userLocation && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Stories on Map
          </h3>
          <TravelMap
            stories={nearbyStories}
            userLocation={userLocation}
            height="400px"
            showControls={true}
            interactive={true}
          />
        </div>
      )}

      {/* Stories List */}
      {nearbyStories.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Found {nearbyStories.length} stories within {radius}km
            </p>
          </div>

          <div className="space-y-6">
            {nearbyStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <StoryCard story={story} />
                
                {/* Distance Badge */}
                <div className="absolute top-4 right-4 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                  {formatDistance(story.distance)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {nearbyStories.length === 0 && userLocation && !isLoading && !isError && (
        <div className="text-center py-12">
          <FiMapPin className="text-4xl text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No Stories Found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            No travel stories found within {radius}km of your location.
            Try increasing the search radius.
          </p>
          <button
            onClick={() => handleRadiusChange(Math.min(radius * 2, 50))}
            className="btn-outline"
          >
            Expand Search to {Math.min(radius * 2, 50)}km
          </button>
        </div>
      )}
    </div>
  );
};

export default NearbyStories;