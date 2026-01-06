import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different status
const createCustomIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = createCustomIcon('red');
const orangeIcon = createCustomIcon('orange');
const greenIcon = createCustomIcon('green');
const blueIcon = createCustomIcon('blue');

// Component to update map center when location changes
const MapUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
};

// Component to fit bounds to all markers when issues are provided
const FitBounds = ({ issues }) => {
  const map = useMap();
  
  useEffect(() => {
    if (issues && issues.length > 0) {
      const validIssues = issues.filter(issue => 
        issue.coordinates && 
        Array.isArray(issue.coordinates) && 
        issue.coordinates.length === 2 &&
        typeof issue.coordinates[0] === 'number' &&
        typeof issue.coordinates[1] === 'number' &&
        !isNaN(issue.coordinates[0]) &&
        !isNaN(issue.coordinates[1])
      );
      
      if (validIssues.length > 0) {
        const bounds = validIssues.map(issue => issue.coordinates);
        if (bounds.length === 1) {
          // Single marker: center on it with zoom 13
          map.setView(bounds[0], 13);
        } else {
          // Multiple markers: fit bounds with padding
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [issues, map]);
  
  return null;
};

const IssueMap = ({ issues = null, onMarkerClick = null, center = null, showCenterMarker = true }) => {
  const [mapCenter, setMapCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // Calculate center from issues if provided and no center is explicitly set
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && 
        typeof center[0] === 'number' && typeof center[1] === 'number' &&
        !isNaN(center[0]) && !isNaN(center[1])) {
      // Use provided center
      setMapCenter(center);
      setUserLocation(center);
      setIsLoadingLocation(false);
    } else if (issues && issues.length > 0) {
      // Calculate center from issues
      const validIssues = issues.filter(issue => 
        issue.coordinates && 
        Array.isArray(issue.coordinates) && 
        issue.coordinates.length === 2 &&
        typeof issue.coordinates[0] === 'number' &&
        typeof issue.coordinates[1] === 'number' &&
        !isNaN(issue.coordinates[0]) &&
        !isNaN(issue.coordinates[1])
      );
      
      if (validIssues.length > 0) {
        // Calculate average center from all issues
        const sumLat = validIssues.reduce((sum, issue) => sum + issue.coordinates[0], 0);
        const sumLng = validIssues.reduce((sum, issue) => sum + issue.coordinates[1], 0);
        const avgCenter = [sumLat / validIssues.length, sumLng / validIssues.length];
        setMapCenter(avgCenter);
        setIsLoadingLocation(false);
      } else {
        // No valid issue coordinates, try to get user location
        getCurrentLocation();
      }
    } else {
      // No issues and no center, try to get user location
      getCurrentLocation();
    }
  }, [center, issues]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      // Use default fallback only if no issues are available
      if (!issues || issues.length === 0) {
        setMapCenter([16.0716, 77.9053]);
      }
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = [latitude, longitude];
        setUserLocation(newLocation);
        // Only set map center from user location if no issues are provided
        if (!issues || issues.length === 0) {
          setMapCenter(newLocation);
        }
        setIsLoadingLocation(false);
        console.log('User location obtained:', newLocation);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to retrieve your location.');
        // Use default fallback only if no issues are available
        if (!issues || issues.length === 0) {
          setMapCenter([16.0716, 77.9053]);
        }
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Generate nearby issues based on user location
  const generateNearbyIssues = (userLoc) => {
    if (!userLoc) return [];
    
    const baseIssues = [
      {
        id: '1',
        title: 'Broken Street Light',
        location: 'Near Your Location',
        coordinates: [userLoc[0] + 0.001, userLoc[1] + 0.001],
        status: 'reported',
        upvotes: 15,
        description: 'Street light has been broken for 3 days'
      },
      {
        id: '2',
        title: 'Pothole on Main Road',
        location: 'Near Your Location',
        coordinates: [userLoc[0] + 0.002, userLoc[1] - 0.001],
        status: 'in-progress',
        upvotes: 28,
        description: 'Large pothole causing traffic issues'
      },
      {
        id: '3',
        title: 'Garbage Overflow',
        location: 'Near Your Location',
        coordinates: [userLoc[0] - 0.001, userLoc[1] + 0.002],
        status: 'resolved',
        upvotes: 42,
        description: 'Garbage bin overflowing since Monday'
      },
      {
        id: '4',
        title: 'Water Leakage',
        location: 'Near Your Location',
        coordinates: [userLoc[0] + 0.003, userLoc[1] + 0.001],
        status: 'reported',
        upvotes: 8,
        description: 'Water pipe leaking on footpath'
      },
      {
        id: '5',
        title: 'Traffic Signal Malfunction',
        location: 'Near Your Location',
        coordinates: [userLoc[0] - 0.002, userLoc[1] - 0.002],
        status: 'in-progress',
        upvotes: 35,
        description: 'Traffic signal not working properly'
      }
    ];
    
    return baseIssues;
  };

  // Use provided issues or generate nearby issues based on user location
  const displayIssues = issues || (userLocation ? generateNearbyIssues(userLocation) : []);
  console.log('IssueMap displayIssues:', displayIssues);
  console.log('IssueMap displayIssues length:', displayIssues.length);

  const getMarkerIcon = (status) => {
    switch (status) {
      case 'reported':
        return redIcon;
      case 'in-progress':
        return orangeIcon;
      case 'resolved':
        return greenIcon;
      default:
        return redIcon;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'reported':
        return 'Reported';
      case 'in-progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Unknown';
    }
  };

  const handleMarkerClick = (issue) => {
    if (onMarkerClick) {
      onMarkerClick(issue);
    }
  };

  // Don't render map until we have a valid center
  if (!mapCenter || mapCenter.length !== 2) {
    return (
      <div className="map-container" style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f1f5f9'
      }}>
        <p style={{ color: '#64748b' }}>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer
        key={`${mapCenter[0]},${mapCenter[1]}`}
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <MapUpdater center={mapCenter} />
        <FitBounds issues={displayIssues} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User location marker */}
        {userLocation && showCenterMarker && (
          <Marker position={userLocation} icon={blueIcon}>
            <Popup>
              <div style={{ minWidth: '150px', textAlign: 'center' }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  📍 Your Location
                </h4>
                <p style={{ 
                  margin: '4px 0', 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Issue markers */}
        {displayIssues.map((issue) => (
          <Marker
            key={issue.id}
            position={issue.coordinates}
            icon={getMarkerIcon(issue.status)}
            eventHandlers={{
              click: () => handleMarkerClick(issue),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  {issue.title}
                </h4>
                <p style={{ 
                  margin: '4px 0', 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  📍 {issue.location}
                </p>
                <p style={{ 
                  margin: '4px 0', 
                  fontSize: '12px', 
                  color: '#64748b' 
                }}>
                  {issue.description}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '8px'
                }}>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: issue.status === 'reported' ? '#fef3c7' : 
                              issue.status === 'in-progress' ? '#dbeafe' : '#d1fae5',
                    color: issue.status === 'reported' ? '#92400e' : 
                           issue.status === 'in-progress' ? '#1e40af' : '#065f46'
                  }}>
                    {getStatusText(issue.status)}
                  </span>
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#64748b' 
                  }}>
                    👍 {issue.upvotes}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default IssueMap;