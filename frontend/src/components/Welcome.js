import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#123244] via-[#1e4359] via-[#3f6177] to-[#d8c7bd] flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 text-white text-center">
      
      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-sm">
          Welcome to CivicConnect
        </h1>
        <p className="text-sm sm:text-base md:text-lg opacity-90">
          Report and track civic issues in your community
        </p>
      </div>

      {/* Logo */}
      <img 
        src="./images/logo.png"
        alt="CivicConnect Logo"
        className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain mb-8 sm:mb-10"
      />

      {/* Employee & Admin Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto justify-center items-stretch mb-6">
        <button 
          className="flex-1 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-6 py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 hover:-translate-y-0.5"
          onClick={() => navigate('/employee-login')}
        >
          Employee Login
        </button>

        <button 
          className="flex-1 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-6 py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 hover:-translate-y-0.5"
          onClick={() => navigate('/admin-login')}
        >
          Admin Login
        </button>
      </div>

      {/* Citizen Login */}
      <button 
        className="bg-gradient-to-r from-[#1e4359] to-[#3f6177] text-white px-8 py-4 rounded-full text-base sm:text-lg md:text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        onClick={handleGetStarted}
      >
        Citizen Login
      </button>

    </div>
  );
};

export default Welcome;
