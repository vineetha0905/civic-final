import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getMyProfile();
        setProfile(data.data?.user || data.user || null);
      } catch (e) {
        try {
          const cached = JSON.parse(localStorage.getItem('civicconnect_user'));
          setProfile(cached || null);
        } catch (_) {}
        setError('Could not fetch profile from server');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-xl rounded-2xl px-8 py-6 animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow-xl rounded-2xl px-8 py-6">No profile found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex justify-center py-12 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl p-8 transition-transform hover:scale-[1.01]">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
            <p className="text-sm text-gray-500">Citizen information</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Profile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
            <label className="text-xs text-gray-500">Name</label>
            <div className="text-lg font-medium text-gray-800 mt-1">
              {profile.name || '-'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
            <label className="text-xs text-gray-500">Aadhaar Number</label>
            <div className="text-lg font-medium text-gray-800 mt-1">
              {profile.aadhaarNumber || '-'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
            <label className="text-xs text-gray-500">Mobile</label>
            <div className="text-lg font-medium text-gray-800 mt-1">
              {profile.mobile || '-'}
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/citizen')}
            className="px-6 py-2 rounded-full bg-indigo-600 text-white font-medium shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
