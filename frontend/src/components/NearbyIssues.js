import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { ArrowLeft, Map, List, ThumbsUp, MessageCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import IssueMap from './IssueMap';
import apiService from '../services/api';

const NearbyIssues = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [viewMode, setViewMode] = useState('list');
  const [selectedStatus, setSelectedStatus] = useState('resolved');
  const [upvotedIssues, setUpvotedIssues] = useState(new Set());
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(5);
  const [userCenter, setUserCenter] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoError, setGeoError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const getImageUrl = (issue) => {
    try {
      if (!issue) return null;
      if (issue.image) return issue.image;
      if (issue.imageUrl) return issue.imageUrl;
      if (Array.isArray(issue.images) && issue.images.length > 0) {
        const first = issue.images[0];
        return typeof first === 'string' ? first : (first?.url || first?.secure_url || first?.secureUrl || null);
      }
      return null;
    } catch (_e) { return null; }
  };

  useEffect(() => {
    fetchIssues();
  }, [selectedStatus]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchIssues();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      setGeoError('');
      if (!('geolocation' in navigator)) {
        setGeoStatus('error');
        setGeoError('Geolocation is not supported by this browser.');
        setUserCenter([16.0716, 77.9053]);
        return;
      }
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') {
            setGeoStatus('denied');
            setUserCenter([16.0716, 77.9053]);
            return;
          }
        }
      } catch (_) {}
      setGeoStatus('requesting');
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserCenter([latitude, longitude]);
          setGeoStatus('granted');
          setGeoError('');
          navigator.geolocation.clearWatch(watchId);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          let errorMessage = 'Unable to get your location';
          if (err.code === 1) {
            errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
            setGeoStatus('denied');
          } else if (err.code === 2) {
            errorMessage = 'Location unavailable. Please check your device settings.';
            setGeoStatus('error');
          } else if (err.code === 3) {
            errorMessage = 'Location request timed out. Please try again.';
            setGeoStatus('error');
          } else {
            setGeoStatus('error');
          }
          setGeoError(errorMessage);
          setUserCenter([16.0716, 77.9053]);
          navigator.geolocation.clearWatch(watchId);
          setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserCenter([latitude, longitude]);
                setGeoStatus('granted');
                setGeoError('');
              },
              () => {},
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
            );
          }, 1000);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 300000 }
      );
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
      }, 20000);
    } catch (e) {
      console.error('Location request error:', e);
      setGeoStatus('error');
      setGeoError('Unexpected error requesting location. Using default location.');
      setUserCenter([16.0716, 77.9053]);
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      const response = await apiService.getIssues(params);
      const rawIssues = response.data?.issues || response.issues || [];
      const mappedIssues = rawIssues.map(issue => ({
        id: issue._id || issue.id,
        title: issue.title,
        description: issue.description,
        location: issue.location?.name || 'Location not specified',
        coordinates: issue.location?.coordinates ? 
          [issue.location.coordinates.latitude, issue.location.coordinates.longitude] : 
          [16.0716, 77.9053],
        status: issue.status || 'reported',
        priority: issue.priority || 'medium',
        upvotes: issue.upvotedBy?.length || 0,
        category: issue.category,
        timestamp: issue.createdAt || issue.timestamp,
        userId: issue.reportedBy?._id || issue.reportedBy,
        images: issue.images || []
      }));
      setIssues(mappedIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues(mockIssues);
    } finally {
      setLoading(false);
    }
  };

  const mockIssues = [
    {
      id: '1',
      title: 'fire acciedent',
      location: 'Near Your Location',
      coordinates: [17.9825, 83.3215],
      status: 'resolved',
      priority: 'urgent',
      upvotes: 1,
      description: 'fire acciedent fire acciedent',
      category: 'Public Safety',
      timestamp: '2025-12-16T10:30:00Z',
      userId: 'other_user_1',
      images: []
    },
    {
      id: '2',
      title: 'Bloody rascal',
      location: 'Near Your Location',
      coordinates: [17.9825, 83.3215],
      status: 'resolved',
      priority: 'medium',
      upvotes: 0,
      description: 'Bloody rascal Bloody rascal',
      category: 'Garbage & Sanitation',
      timestamp: '2025-12-16T10:30:00Z',
      userId: 'other_user_2',
      images: []
    }
  ];

  const toRad = (value) => (value * Math.PI) / 180;
  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterByRadius = (list, radius) => {
    const [lat, lng] = userCenter || [16.0716, 77.9053];
    return list.filter(item => {
      const [ilat, ilng] = item.coordinates || [];
      if (typeof ilat !== 'number' || typeof ilng !== 'number') return false;
      return distanceKm(lat, lng, ilat, ilng) <= radius;
    });
  };

  const byStatus = selectedStatus === 'all' ? issues : issues.filter(issue => issue.status === selectedStatus);
  const filteredIssues = filterByRadius(byStatus, radiusKm);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'reported': { bg: 'bg-red-50', text: 'text-red-700', label: 'REPORTED' },
      'in-progress': { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'IN PROGRESS' },
      'resolved': { bg: 'bg-green-50', text: 'text-green-700', label: 'RESOLVED' }
    };
    const config = statusConfig[status] || statusConfig['reported'];
    return (
      <span className={`${config.bg} ${config.text} px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'urgent': { bg: 'bg-red-50', text: 'text-red-700', label: 'URGENT' },
      'high': { bg: 'bg-red-50', text: 'text-red-700', label: 'High Priority' },
      'medium': { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Medium Priority' },
      'low': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Low Priority' }
    };
    const config = priorityConfig[priority] || priorityConfig['medium'];
    return (
      <span className={`${config.bg} ${config.text} px-2.5 py-1 rounded-full text-xs font-medium ml-2`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleUpvote = (issueId, e) => {
    e.stopPropagation();
    setUpvotedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const handleMarkerClick = (issue) => {
    navigate(`/issue/${issue.id}`);
  };

  const statusCounts = {
    all: filterByRadius(issues, radiusKm).length,
    reported: filterByRadius(issues.filter(i => i.status === 'reported'), radiusKm).length,
    'in-progress': filterByRadius(issues.filter(i => i.status === 'in-progress'), radiusKm).length,
    resolved: filterByRadius(issues.filter(i => i.status === 'resolved'), radiusKm).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/citizen')}
                className="mr-3 p-1 text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Nearby Issues</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchIssues}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Refresh issues"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all ${
                    viewMode === 'map' 
                      ? 'bg-white text-blue-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Map size={16} />
                  Map
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List size={16} />
                  List
                </button>
              </div>
              <span className="text-sm font-medium text-gray-600 ml-1">
                {filteredIssues.length} issues
              </span>
            </div>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            {[
              { key: 'all', label: 'All Issues' },
              { key: 'reported', label: 'Reported' },
              { key: 'in-progress', label: 'In Progress' },
              { key: 'resolved', label: 'Resolved' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedStatus(filter.key)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedStatus === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({statusCounts[filter.key]})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Radius: {radiusKm} km
            </span>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              {filteredIssues.length} issues
            </span>
          </div>

          {geoStatus !== 'granted' && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-900">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <span className="flex-1">
                  {geoStatus === 'requesting' ? 'Requesting your location…' :
                   geoStatus === 'denied' ? 'Location permission denied. Please allow access to show nearby issues.' :
                   geoStatus === 'error' ? (geoError || 'Unable to determine your location.') :
                   'We use your location to show nearby issues.'}
                </span>
                <button
                  onClick={requestLocation}
                  className="bg-orange-500 text-white px-3.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap hover:bg-orange-600"
                >
                  Use my location
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="w-full h-[calc(100vh-220px)] min-h-[500px] relative z-0 bg-gray-50">
          <IssueMap
            issues={filteredIssues}
            onMarkerClick={handleMarkerClick}
            center={userCenter || [16.0716, 77.9053]}
            showCenterMarker={true}
          />
        </div>
      ) : (
        <div className="px-6 py-4 bg-gray-50 min-h-[calc(100vh-200px)]">
          <div className="flex flex-col gap-4 max-w-full">
            {filteredIssues.map((issue) => {
              const imageUrl = getImageUrl(issue);
              const [lat, lng] = issue.coordinates || [];
              return (
                <div
                  key={issue.id}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/issue/${issue.id}`)}
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {issue.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(issue.status)}
                      {getPriorityBadge(issue.priority)}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-2 flex flex-wrap gap-2 items-center">
                    {lat && lng && (
                      <span>Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</span>
                    )}
                    <span>•</span>
                    <span>{formatDate(issue.timestamp)} - Category: {issue.category || 'General'}</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {issue.description}
                  </p>

                  {imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden h-48 w-full bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={issue.title || 'Issue image'}
                        className="w-full h-full object-cover"
                        onClick={(e) => { e.stopPropagation(); setPreviewUrl(imageUrl); }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end flex-wrap">
                    {imageUrl && (
                      <button
                        className="px-3.5 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(imageUrl);
                        }}
                      >
                        View Image
                      </button>
                    )}
                    <button
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        upvotedIssues.has(issue.id)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={(e) => handleUpvote(issue.id, e)}
                    >
                      <ThumbsUp size={16} />
                      {issue.upvotes + (upvotedIssues.has(issue.id) ? 1 : 0)}
                    </button>
                    <button
                      className="px-3.5 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info('Comment functionality coming soon!');
                      }}
                    >
                      <MessageCircle size={16} />
                      Comment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredIssues.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4 opacity-50">🔍</div>
              <h3 className="text-gray-500 mb-2 font-medium">No Issues Found</h3>
              <p className="text-gray-400">No issues match your current filter. Try changing the status filter.</p>
            </div>
          )}
        </div>
      )}

      {previewUrl && (
        <div
          onClick={() => setPreviewUrl('')}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        >
          <img
            src={previewUrl}
            alt="Issue"
            className="max-w-[90vw] max-h-[90vh] rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default NearbyIssues;
