import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { MapPin, Camera, Users, AlertTriangle } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { currentLanguage, setCurrentLanguage, t } = useContext(LanguageContext);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🏛️' },
    { code: 'nag', name: 'नागपुरी', flag: '🏞️' }
  ];

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#123244] via-[#1e4359] via-[#3f6177] to-[#d8c7bd] flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 text-white text-center">
      {/* Header Section */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-sm">
          {t('welcome')}
        </h1>
        <p className="text-sm sm:text-base md:text-lg opacity-90 font-normal">
          Report and track civic issues in your community
        </p>
      </div>

      {/* Logo - Responsive sizing */}
      <img 
        src='./images/logo.png' 
        alt="CivicConnect Logo"
        className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain mb-6 sm:mb-8"
      />

      {/* Language Selection Section */}
      <div className="mb-6 sm:mb-8 w-full max-w-xs sm:max-w-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 font-medium">
          {t('selectLanguage')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-sm border-2 ${
                currentLanguage === lang.code
                  ? 'bg-white/25 border-white/80'
                  : 'bg-white/15 border-transparent hover:bg-white/20'
              }`}
              onClick={() => setCurrentLanguage(lang.code)}
            >
              <div className="text-xl sm:text-2xl mb-2">{lang.flag}</div>
              <div className="font-medium text-sm sm:text-base">{lang.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons - Responsive layout */}
      <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-xs sm:max-w-md">
        <button 
          className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5"
          onClick={() => navigate('/employee-login')}
        >
          Employee Login
        </button>
        <button 
          className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 hover:transform hover:-translate-y-0.5"
          onClick={() => navigate('/admin-login')}
        >
          {t('adminLogin')}
        </button>
      </div>
      
      {/* Primary CTA Button */}
      <button 
        className="mt-4 sm:mt-6 bg-gradient-to-r from-[#1e4359] to-[#3f6177] text-white border-none px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-4 rounded-full text-base sm:text-lg md:text-xl font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-0.5 font-['Fredoka',sans-serif]"
        onClick={handleGetStarted}
      >
        Citizen Login
      </button>
    </div>
  );
};

export default Welcome;