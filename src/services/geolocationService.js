import { encode, decode, neighbors } from 'ngeohash';
import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

class GeolocationService {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
  }

  // Get current user location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          this.currentPosition = location;
          resolve(location);
        },
        (error) => {
          let message = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Watch user location changes
  watchLocation(callback, errorCallback) {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation is not supported'));
      return null;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        this.currentPosition = location;
        callback(location);
      },
      errorCallback,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      }
    );

    return this.watchId;
  }

  // Stop watching location
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Generate geohash for a location
  generateGeohash(lat, lng, precision = 9) {
    return geohashForLocation([lat, lng], precision);
  }

  // Get geohash query bounds for radius search
  getGeohashQueryBounds(center, radiusInKm) {
    return geohashQueryBounds([center.lat, center.lng], radiusInKm * 1000);
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    return distanceBetween([point1.lat, point1.lng], [point2.lat, point2.lng]);
  }

  // Check if point is within radius
  isWithinRadius(center, point, radiusInKm) {
    const distance = this.calculateDistance(center, point);
    return distance <= radiusInKm * 1000; // Convert km to meters
  }

  // Geocode address to coordinates (using a free service)
  async geocodeAddress(address) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].display_name,
          address: data[0].display_name
        };
      }
      
      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        return {
          name: data.name || data.display_name,
          address: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.village,
          country: data.address?.country,
          countryCode: data.address?.country_code
        };
      }
      
      throw new Error('Location not found');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  // Get nearby places (POIs)
  async getNearbyPlaces(lat, lng, radius = 1000, type = 'tourism') {
    try {
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];(node["${type}"]["name"](around:${radius},${lat},${lng}););out;`
      );
      const data = await response.json();
      
      return data.elements.map(element => ({
        id: element.id,
        name: element.tags.name,
        type: element.tags[type],
        lat: element.lat,
        lng: element.lon,
        tags: element.tags
      }));
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  }

  // Cluster nearby points
  clusterPoints(points, radiusInKm = 0.1) {
    const clusters = [];
    const processed = new Set();

    points.forEach((point, index) => {
      if (processed.has(index)) return;

      const cluster = {
        center: { lat: point.lat, lng: point.lng },
        points: [point],
        count: 1
      };

      // Find nearby points
      points.forEach((otherPoint, otherIndex) => {
        if (index === otherIndex || processed.has(otherIndex)) return;

        const distance = this.calculateDistance(point, otherPoint);
        if (distance <= radiusInKm * 1000) {
          cluster.points.push(otherPoint);
          cluster.count++;
          processed.add(otherIndex);
        }
      });

      // Calculate cluster center
      if (cluster.points.length > 1) {
        const avgLat = cluster.points.reduce((sum, p) => sum + p.lat, 0) / cluster.points.length;
        const avgLng = cluster.points.reduce((sum, p) => sum + p.lng, 0) / cluster.points.length;
        cluster.center = { lat: avgLat, lng: avgLng };
      }

      clusters.push(cluster);
      processed.add(index);
    });

    return clusters;
  }

  // Format location for display
  formatLocation(location) {
    if (!location) return '';
    
    if (location.name) return location.name;
    if (location.address) return location.address;
    if (location.lat && location.lng) {
      return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    
    return 'Unknown location';
  }

  // Check if location services are available
  isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }

  // Request location permission
  async requestLocationPermission() {
    if (!this.isGeolocationAvailable()) {
      throw new Error('Geolocation is not supported');
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      // Fallback: try to get location to check permission
      try {
        await this.getCurrentLocation();
        return 'granted';
      } catch (locationError) {
        return 'denied';
      }
    }
  }
}

export default new GeolocationService();