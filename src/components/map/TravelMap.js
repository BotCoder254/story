import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import {
  FiMapPin,
  FiHeart,
  FiMessageCircle,
  FiEye,
  FiNavigation,
  FiZoomIn,
  FiZoomOut,
  FiLayers,
  FiX
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import geolocationService from '../../services/geolocationService';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom story marker icon
const createStoryIcon = (count = 1, isCluster = false) => {
  const size = isCluster ? Math.min(40 + count * 2, 60) : 30;
  const color = isCluster ? '#f37316' : '#0ea5e9';
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isCluster ? '14px' : '12px'};
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ">
        ${isCluster ? count : '📍'}
      </div>
    `,
    className: 'custom-story-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Map event handlers
const MapEvents = ({ onLocationSelect, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
    locationfound: (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng);
      }
    }
  });
  return null;
};

// Map controls component
const MapControls = ({ onLocateUser, onZoomIn, onZoomOut, onToggleLayer, currentLayer }) => {
  const map = useMap();

  const handleLocateUser = async () => {
    try {
      const location = await geolocationService.getCurrentLocation();
      map.setView([location.lat, location.lng], 15);
      if (onLocateUser) onLocateUser(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
      <button
        onClick={handleLocateUser}
        className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-lg shadow-medium flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        title="Find my location"
      >
        <FiNavigation className="text-lg" />
      </button>
      
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-lg shadow-medium flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        title="Zoom in"
      >
        <FiZoomIn className="text-lg" />
      </button>
      
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-lg shadow-medium flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        title="Zoom out"
      >
        <FiZoomOut className="text-lg" />
      </button>
      
      <button
        onClick={onToggleLayer}
        className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-lg shadow-medium flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        title="Toggle map layer"
      >
        <FiLayers className="text-lg" />
      </button>
    </div>
  );
};

// Story popup component
const StoryPopup = ({ story, onClose, onViewStory }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-strong overflow-hidden"
    >
      {/* Story Image */}
      {story.media && story.media.length > 0 && (
        <div className="relative h-40">
          <img
            src={story.media[0].url}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <FiX className="text-sm" />
          </button>
        </div>
      )}

      {/* Story Content */}
      <div className="p-4">
        <div className="flex items-start space-x-3 mb-3">
          <img
            src={story.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName || 'User')}&background=0ea5e9&color=fff`}
            alt={story.authorName}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm line-clamp-2">
              {story.title}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {story.authorName} • {formatDate(story.createdAt)}
            </p>
          </div>
        </div>

        {/* Location */}
        {story.location && (
          <div className="flex items-center space-x-1 text-xs text-neutral-600 dark:text-neutral-400 mb-3">
            <FiMapPin className="text-xs" />
            <span className="truncate">{story.location.name || story.location.address}</span>
          </div>
        )}

        {/* Story Excerpt */}
        <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3 mb-3">
          {story.excerpt || story.content?.substring(0, 120) + '...'}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          <div className="flex items-center space-x-4">
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
        </div>

        {/* Action Button */}
        <button
          onClick={() => onViewStory(story)}
          className="w-full btn-primary text-sm py-2"
        >
          Read Story
        </button>
      </div>
    </motion.div>
  );
};

const TravelMap = ({
  stories = [],
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 10,
  height = '400px',
  onStorySelect,
  onLocationSelect,
  showControls = true,
  interactive = true,
  className = ''
}) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [mapLayer, setMapLayer] = useState('streets');
  const [userLocation, setUserLocation] = useState(null);
  const [clusteredStories, setClusteredStories] = useState([]);
  const mapRef = useRef();

  // Map layer configurations
  const mapLayers = {
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap contributors'
    }
  };

  // Cluster stories by proximity
  useEffect(() => {
    if (stories.length === 0) {
      setClusteredStories([]);
      return;
    }

    const storiesWithLocation = stories.filter(story => 
      story.location && story.location.lat && story.location.lng
    );

    const clusters = geolocationService.clusterPoints(
      storiesWithLocation.map(story => ({
        ...story.location,
        story
      })),
      0.5 // 500m clustering radius
    );

    setClusteredStories(clusters);
  }, [stories]);

  const handleStoryClick = (story) => {
    setSelectedStory(story);
    if (onStorySelect) {
      onStorySelect(story);
    }
  };

  const handleLocationSelect = (location) => {
    setUserLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const toggleMapLayer = () => {
    const layers = Object.keys(mapLayers);
    const currentIndex = layers.indexOf(mapLayer);
    const nextIndex = (currentIndex + 1) % layers.length;
    setMapLayer(layers[nextIndex]);
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg overflow-hidden"
        zoomControl={false}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
      >
        <TileLayer
          url={mapLayers[mapLayer].url}
          attribution={mapLayers[mapLayer].attribution}
        />

        <MapEvents
          onLocationSelect={handleLocationSelect}
          onMapClick={onLocationSelect}
        />

        {/* Story Markers */}
        {clusteredStories.map((cluster, index) => (
          <Marker
            key={index}
            position={[cluster.center.lat, cluster.center.lng]}
            icon={createStoryIcon(cluster.count, cluster.count > 1)}
            eventHandlers={{
              click: () => {
                if (cluster.count === 1) {
                  handleStoryClick(cluster.points[0].story);
                } else {
                  // Handle cluster click - could show list of stories
                  console.log('Cluster clicked:', cluster.points);
                }
              }
            }}
          >
            {cluster.count === 1 && (
              <Popup closeButton={false} className="custom-popup">
                <StoryPopup
                  story={cluster.points[0].story}
                  onClose={() => setSelectedStory(null)}
                  onViewStory={handleStoryClick}
                />
              </Popup>
            )}
          </Marker>
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  width: 20px;
                  height: 20px;
                  background: #22c55e;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                "></div>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          />
        )}

        {/* Map Controls */}
        {showControls && (
          <MapControls
            onLocateUser={handleLocationSelect}
            onToggleLayer={toggleMapLayer}
            currentLayer={mapLayer}
          />
        )}
      </MapContainer>

      {/* Selected Story Modal */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4"
            onClick={() => setSelectedStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <StoryPopup
                story={selectedStory}
                onClose={() => setSelectedStory(null)}
                onViewStory={(story) => {
                  setSelectedStory(null);
                  if (onStorySelect) onStorySelect(story);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-neutral-800 rounded-lg shadow-medium p-3 text-xs">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-4 h-4 bg-primary-600 rounded-full"></div>
          <span className="text-neutral-700 dark:text-neutral-300">Stories</span>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-4 h-4 bg-secondary-600 rounded-full"></div>
          <span className="text-neutral-700 dark:text-neutral-300">Clusters</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-accent-600 rounded-full"></div>
          <span className="text-neutral-700 dark:text-neutral-300">Your Location</span>
        </div>
      </div>
    </div>
  );
};

export default TravelMap;