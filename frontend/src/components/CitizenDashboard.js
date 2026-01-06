import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { Camera, FileText, MapPin, Home, Bell, User, LogOut, Trophy } from 'lucide-react';
import IssueMap from './IssueMap';
import apiService from '../services/api';

const CitizenDashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [stats, setStats] = useState({
    totalIssues: 0,
    myIssues: 0,
    nearbyIssues: 0
  });
  const [issues, setIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [userCenter, setUserCenter] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | requesting | granted | denied | error
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (user && user.id) {
      fetchDashboardData();
      fetchAndMapIssues();
    }
    requestLocation();
  }, [user]);

  const requestLocation = async () => {
    try {
      setGeoError('');
      if (!('geolocation' in navigator)) {
        setGeoStatus('error');
        setGeoError('Geolocation is not supported by this browser.');
        setUserCenter([16.0716, 77.9053]);
        return;
      }

      // Try to check permission status if supported
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') {
            setGeoStatus('denied');
            setUserCenter([16.0716, 77.9053]);
            return;
          }
        }
      } catch (_) { /* ignore permission API errors */ }

      setGeoStatus('requesting');
      
      // Use watchPosition with timeout for better reliability
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
          
          // Fallback: try getCurrentPosition with less strict options
          setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserCenter([latitude, longitude]);
                setGeoStatus('granted');
                setGeoError('');
              },
              () => {}, // Silent fail on fallback
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
            );
          }, 1000);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 20000, 
          maximumAge: 300000 // 5 minutes
        }
      );
      
      // Clear watch after 20 seconds if still running
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

  const fetchDashboardData = async () => {
    try {
      if (!user || !user.id) return;
      const [issuesResponse, myIssuesResponse] = await Promise.all([
        apiService.getIssues({ limit: 10 }),
        apiService.getIssues({ userId: user.id })
      ]);
      
      setStats({
        totalIssues: issuesResponse.total || 0,
        myIssues: myIssuesResponse.total || 0,
        nearbyIssues: issuesResponse.total || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAndMapIssues = async () => {
    try {
      const response = await apiService.getIssues({ limit: 100 });
      const mappedIssues = (response.data?.issues || response.issues || []).map(issue => ({
        id: issue._id || issue.id,
        title: issue.title,
        description: issue.description,
        location: issue.location?.name || 'Location not specified',
        coordinates: issue.location?.coordinates ?
          [issue.location.coordinates.latitude, issue.location.coordinates.longitude] :
          [16.0716, 77.9053],
        status: issue.status || 'reported',
        upvotes: issue.upvotedBy?.length || 0
      }));
      setAllIssues(mappedIssues);
      setIssues(filterByRadius(mappedIssues, radiusKm));
    } catch (error) {
      console.error('Error fetching issues for map:', error);
    }
  };

  const toRad = (value) => (value * Math.PI) / 180;
  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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

  useEffect(() => {
    if (allIssues.length > 0) {
      setIssues(filterByRadius(allIssues, radiusKm));
    }
  }, [radiusKm, allIssues, userCenter]);

  const handleLogout = () => {
    localStorage.removeItem('civicconnect_user');
    localStorage.removeItem('civicconnect_token');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#eef2f5] pb-20 sm:pb-24">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#102a38] via-[#1e4359] to-[#3f6177] text-white relative overflow-hidden">
        <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 pb-14 sm:pb-16 md:pb-20">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex-1 text-left pr-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 sm:mb-3">
                Hello, {user.name}!
              </h1>
              <p className="text-sm sm:text-base md:text-lg opacity-90 font-normal">
                Welcome back to CivicConnect
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 border-none text-white p-2 rounded-lg cursor-pointer transition-all duration-200 flex-shrink-0"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        {/* Curved bottom edge - positioned to create smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 md:h-20 bg-[#eef2f5] rounded-t-[2.5rem] sm:rounded-t-[3rem] md:rounded-t-[4rem]"></div>
      </div>

      {/* Action Cards Section */}
      <div className="px-4 sm:px-6 md:px-8 -mt-6 sm:-mt-8 md:-mt-10 relative z-20">
        <div className="flex flex-col gap-3 sm:gap-4 max-w-2xl mx-auto">
          <div 
            className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md cursor-pointer transition-all duration-300 border border-black/5 hover:shadow-xl hover:-translate-y-1 flex items-center gap-3 sm:gap-4"
            onClick={() => navigate('/report-issue')}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#1e4359] to-[#3f6177] rounded-2xl flex items-center justify-center text-white flex-shrink-0">
              <Camera size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-1">
                {t('reportIssue')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-normal">
                Report a new civic issue in your area
              </p>
            </div>
          </div>

          <div 
            className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md cursor-pointer transition-all duration-300 border border-black/5 hover:shadow-xl hover:-translate-y-1 flex items-center gap-3 sm:gap-4"
            onClick={() => navigate('/my-reports')}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#1e4359] to-[#3f6177] rounded-2xl flex items-center justify-center text-white flex-shrink-0">
              <FileText size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-1">
                {t('myReports')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-normal">
                Track your reported issues
              </p>
            </div>
          </div>

          <div 
            className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md cursor-pointer transition-all duration-300 border border-black/5 hover:shadow-xl hover:-translate-y-1 flex items-center gap-3 sm:gap-4"
            onClick={() => navigate('/nearby-issues')}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#1e4359] to-[#3f6177] rounded-2xl flex items-center justify-center text-white flex-shrink-0">
              <MapPin size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-1">
                {t('nearbyIssues')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-normal">
                View and support community issues
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="px-4 sm:px-6 md:px-8 mt-6 sm:mt-8 max-w-full box-border">
        <div>
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-4">
            Issues Near You
          </h3>
          {geoStatus !== 'granted' && (
            <div className="bg-[#fff7ed] border border-[#fed7aa] text-[#9a3412] p-3 sm:p-4 rounded-lg mb-3 w-full box-border">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm flex-1">
                  {geoStatus === 'requesting' ? 'Requesting your location…' :
                   geoStatus === 'denied' ? 'Location permission denied. Please allow access to show nearby issues.' :
                   geoStatus === 'error' ? (geoError || 'Unable to determine your location.') :
                   'We use your location to show nearby issues.'}
                </span>
                <button 
                  onClick={requestLocation} 
                  className="bg-[#fb923c] hover:bg-[#f97316] text-white border-none px-3 py-2 sm:px-4 sm:py-2.5 rounded-md cursor-pointer text-xs sm:text-sm whitespace-nowrap transition-colors"
                >
                  Use my location
                </button>
              </div>
              {geoStatus === 'denied' && (
                <div className="mt-2 text-xs sm:text-sm">
                  Tip: In your browser address bar, click the location icon and allow access for this site.
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 w-full">
            <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
              Radius: {radiusKm} km
            </span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1" 
              value={radiusKm} 
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="flex-1 min-w-0 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1e4359]"
            />
            <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
              {issues.length} issues
            </span>
          </div>
          <div className="w-full h-[280px] sm:h-[350px] md:h-[400px] rounded-xl overflow-hidden shadow-sm">
            <IssueMap issues={issues} center={userCenter || [16.0716, 77.9053]} />
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile-first responsive */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#f8fafb] border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[1000]">
        <div className="flex justify-around items-center max-w-2xl mx-auto">
          <div className="flex flex-col items-center gap-1 text-gray-500 text-[#1e4359] text-xs sm:text-sm font-medium cursor-pointer min-w-0 flex-1 transition-all duration-300 hover:text-[#1e4359] hover:-translate-y-0.5">
            <Home size={18} className="sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">Home</span>
          </div>
          <div 
            className="flex flex-col items-center gap-1 text-gray-500 text-xs sm:text-sm font-medium cursor-pointer min-w-0 flex-1 transition-all duration-300 hover:text-[#1e4359] hover:-translate-y-0.5"
            onClick={() => navigate('/nearby-issues')}
          >
            <MapPin size={18} className="sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">Map</span>
          </div>
         
          <div 
            className="flex flex-col items-center gap-1 text-gray-500 text-xs sm:text-sm font-medium cursor-pointer min-w-0 flex-1 transition-all duration-300 hover:text-[#1e4359] hover:-translate-y-0.5"
            onClick={() => navigate('/profile')}
          >
            <User size={18} className="sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">Profile</span>
          </div>
          <div 
            className="flex flex-col items-center gap-1 text-gray-500 text-xs sm:text-sm font-medium cursor-pointer min-w-0 flex-1 transition-all duration-300 hover:text-[#1e4359] hover:-translate-y-0.5"
            onClick={() => navigate('/leaderboard')}
          >
            <Trophy size={18} className="sm:w-5 sm:h-5" />
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">Leaderboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;