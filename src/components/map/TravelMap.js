import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiMapPin,
  FiNavigation,
  FiZoomIn,
  FiZoomOut,
  FiLayers,
  FiMaximize2,
  FiMinimize2
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import geolocationService from '../../services/geolocationService';
import toast from 'react-hot-toast';

const TravelMap = ({ 
  stories = [], 
  userLocation = null, 
  onLocationSelect = null,
  height = '400px',
  showControls = true,
  interactive = true,
  className = ''
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const { currentUser } = useAuth();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');

  // Initialize Mapbox map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Check if Mapbox GL JS is loaded
    if (typeof window !== 'undefined' && window.mapboxgl) {
      const mapboxgl = window.mapboxgl;
      
      // Set access token (you'll need to add this to your environment variables)
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoidHJhdmVsc3RvcmllcyIsImEiOiJjbHNkZjEyM3QwMDFjMmxwYzJ4eGZxdGVyIn0.example';

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: userLocation ? [userLocation.lng, userLocation.lat] : [-74.5, 40],
        zoom: userLocation ? 12 : 2,
        interactive: interactive
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        addStoryMarkers();
        if (userLocation) {
          addUserLocationMarker();
        }
      });

      // Add navigation controls if interactive
      if (interactive && showControls) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      }

      // Add click handler for location selection
      if (onLocationSelect) {
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          onLocationSelect({ lat, lng });
        });
      }
    } else {
      // Load Mapbox GL JS dynamically
      loadMapboxScript();
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update map when stories or user location changes
  useEffect(() => {
    if (mapLoaded && map.current) {
      addStoryMarkers();
      if (userLocation) {
        addUserLocationMarker();
        map.current.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 12,
          duration: 1000
        });
      }
    }
  }, [stories, userLocation, mapLoaded]);

  // Update map style
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle, mapLoaded]);

  const loadMapboxScript = () => {
    if (document.querySelector('script[src*="mapbox-gl"]')) return;

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      // Reinitialize map after script loads
      setTimeout(() => {
        if (mapContainer.current && !map.current) {
          const mapboxgl = window.mapboxgl;
          mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoidHJhdmVsc3RvcmllcyIsImEiOiJjbHNkZjEyM3QwMDFjMmxwYzJ4eGZxdGVyIn0.example';

          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: userLocation ? [userLocation.lng, userLocation.lat] : [-74.5, 40],
            zoom: userLocation ? 12 : 2,
            interactive: interactive
          });

          map.current.on('load', () => {
            setMapLoaded(true);
            addStoryMarkers();
            if (userLocation) {
              addUserLocationMarker();
            }
          });

          if (interactive && showControls) {
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          }

          if (onLocationSelect) {
            map.current.on('click', (e) => {
              const { lng, lat } = e.lngLat;
              onLocationSelect({ lat, lng });
            });
          }
        }
      }, 100);
    };
    document.head.appendChild(script);
  };

  const addStoryMarkers = () => {
    if (!map.current || !mapLoaded) return;

    // Remove existing story markers
    const existingMarkers = document.querySelectorAll('.story-marker');
    existingMarkers.forEach(marker => marker.remove());

    stories.forEach((story, index) => {
      if (story.location && story.location.lat && story.location.lng) {
        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'story-marker';
        markerElement.innerHTML = `
          <div class="w-10 h-10 bg-primary-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
          </div>
        `;

        // Create popup content
        const popupContent = `
          <div class="p-3 max-w-xs">
            ${story.media && story.media[0] ? `
              <img src="${story.media[0].url}" alt="${story.title}" class="w-full h-24 object-cover rounded-lg mb-2" />
            ` : ''}
            <h3 class="font-semibold text-sm mb-1">${story.title}</h3>
            <p class="text-xs text-gray-600 mb-2">${story.content ? story.content.substring(0, 100) + '...' : ''}</p>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>By ${story.authorName}</span>
              <span>${story.stats?.likeCount || 0} likes</span>
            </div>
          </div>
        `;

        // Create popup
        const popup = new window.mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(popupContent);

        // Create marker
        new window.mapboxgl.Marker(markerElement)
          .setLngLat([story.location.lng, story.location.lat])
          .setPopup(popup)
          .addTo(map.current);

        // Add click handler to marker
        markerElement.addEventListener('click', () => {
          // Scroll to story card if it exists
          const storyCard = document.querySelector(`[data-story-id="${story.id}"]`);
          if (storyCard) {
            storyCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    });
  };

  const addUserLocationMarker = () => {
    if (!map.current || !mapLoaded || !userLocation) return;

    // Remove existing user marker
    const existingUserMarker = document.querySelector('.user-location-marker');
    if (existingUserMarker) existingUserMarker.remove();

    // Create user location marker
    const userMarkerElement = document.createElement('div');
    userMarkerElement.className = 'user-location-marker';
    userMarkerElement.innerHTML = `
      <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
      <div class="w-8 h-8 bg-blue-500 rounded-full opacity-30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
    `;

    new window.mapboxgl.Marker(userMarkerElement)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
  };

  const getCurrentLocation = async () => {
    try {
      const location = await geolocationService.getCurrentLocation();
      if (map.current) {
        map.current.flyTo({
          center: [location.lng, location.lat],
          zoom: 14,
          duration: 1000
        });
      }
      toast.success('Location updated!');
    } catch (error) {
      toast.error('Failed to get location');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const zoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  const mapStyles = [
    { id: 'mapbox://styles/mapbox/streets-v12', name: 'Streets' },
    { id: 'mapbox://styles/mapbox/satellite-v9', name: 'Satellite' },
    { id: 'mapbox://styles/mapbox/outdoors-v12', name: 'Outdoors' },
    { id: 'mapbox://styles/mapbox/light-v11', name: 'Light' },
    { id: 'mapbox://styles/mapbox/dark-v11', name: 'Dark' }
  ];

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapContainer}
        className={`rounded-xl overflow-hidden ${
          isFullscreen 
            ? 'fixed inset-0 z-50 rounded-none' 
            : ''
        }`}
        style={{ height: isFullscreen ? '100vh' : height }}
      />

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 space-y-2">
          {/* Style Selector */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2">
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              className="text-sm border-none bg-transparent focus:outline-none"
            >
              {mapStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zoom Controls */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
            <button
              onClick={zoomIn}
              className="block w-full p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <FiZoomIn />
            </button>
            <div className="border-t border-neutral-200 dark:border-neutral-700"></div>
            <button
              onClick={zoomOut}
              className="block w-full p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <FiZoomOut />
            </button>
          </div>

          {/* Location Button */}
          <button
            onClick={getCurrentLocation}
            className="block w-full p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <FiNavigation />
          </button>
        </div>
      )}

      {/* Fullscreen Toggle */}
      {showControls && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
        </button>
      )}

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelMap;