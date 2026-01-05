import React, { useState, useContext, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { ArrowLeft, Camera, Mic, Type, MapPin, Upload } from 'lucide-react';
import apiService from '../services/api';

const ReportIssue = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    location: '',
    coordinates: null
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [recordingType, setRecordingType] = useState('text'); // 'photo', 'text'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const targetRef = useRef('description');
  const lastTranscriptTitleRef = useRef('');
  const lastTranscriptDescRef = useRef('');

  // Translation function using Google Translate free endpoint
  const translateToEnglish = async (text) => {
    if (!text || !text.trim()) return text;
    
    try {
      // First try with auto-detect (works best for most languages including Telugu)
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract translated text from the response
      if (data && data[0] && Array.isArray(data[0]) && data[0].length > 0) {
        let translatedText = '';
        for (let i = 0; i < data[0].length; i++) {
          if (data[0][i] && data[0][i][0]) {
            translatedText += data[0][i][0];
          }
        }
        translatedText = translatedText.trim();
        
        // Always return the translated text (even if same, as it might already be English)
        if (translatedText) {
          console.log('Translation result:', { original: text, translated: translatedText });
          return translatedText;
        }
      }
      
      // If extraction failed, try alternative parsing
      console.warn('Primary translation parsing failed, trying alternative...');
      if (data && data[0]) {
        const altText = String(data[0]).trim();
        if (altText && altText !== text) {
          console.log('Alternative translation result:', { original: text, translated: altText });
          return altText;
        }
      }
      
      // Fallback: return original text
      console.warn('Translation extraction failed, returning original text:', text);
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      toast.warning('Translation unavailable. Using recognized text as-is.');
      return text;
    }
  };

  const ensureSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser. Try Chrome.');
      return null;
    }
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      // Support multiple languages - try Telugu first, fallback to auto-detect
      // Telugu (te-IN) ensures proper recognition of Telugu speech
      recognition.lang = 'te-IN,hi-IN,en-IN'; // Support Telugu, Hindi, English (India)
      recognition.interimResults = false; // only final results to avoid repetition
      recognition.continuous = true;
      recognition.onresult = async (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        transcript = transcript.trim();
        if (!transcript) return;
        
        console.log('Recognized text (before translation):', transcript);
        
        // Translate to English immediately after recognition
        const translatedText = await translateToEnglish(transcript);
        
        console.log('Translated text (after translation):', translatedText);
        
        // Only store and display the English translated text
        if (targetRef.current === 'title') {
          if (translatedText === lastTranscriptTitleRef.current) return;
          lastTranscriptTitleRef.current = translatedText;
          setReportData(prev => ({
            ...prev,
            title: (prev.title ? (prev.title.trim() + ' ') : '') + translatedText
          }));
        } else {
          if (translatedText === lastTranscriptDescRef.current) return;
          lastTranscriptDescRef.current = translatedText;
          setReportData(prev => ({
            ...prev,
            description: (prev.description ? (prev.description.trim() + ' ') : '') + translatedText
          }));
        }
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.onerror = (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        if (error.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow microphone access.');
        } else if (error.error === 'no-speech') {
          toast.warning('No speech detected. Please try again.');
        } else {
          toast.error('Speech recognition error. Please try again.');
        }
      };
      recognitionRef.current = recognition;
    }
    return recognitionRef.current;
  };

  const toggleListening = () => {
    const recognition = ensureSpeechRecognition();
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      if (targetRef.current === 'title') {
        lastTranscriptTitleRef.current = '';
      } else {
        lastTranscriptDescRef.current = '';
      }
      recognition.start();
      setIsListening(true);
    }
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // For demonstration, we'll just store the file name
      // In a real app, you'd upload this to a server
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    // Reset the file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setReportData(prev => ({
        ...prev,
        coordinates: [23.2599, 77.4126],
        location: 'MG Road, Bhopal (Default Location)'
      }));
      return;
    }
    
    toast.info('Requesting your location...');
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setReportData(prev => ({
          ...prev,
          coordinates: [latitude, longitude],
          location: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
        }));
        toast.success('Location obtained successfully');
        navigator.geolocation.clearWatch(watchId);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMsg = 'Unable to get your location';
        if (error.code === 1) {
          errorMsg = 'Location permission denied. Please allow location access.';
        } else if (error.code === 2) {
          errorMsg = 'Location unavailable. Please check your device settings.';
        } else if (error.code === 3) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        toast.error(errorMsg);
        
        // Fallback: try with less strict options
        setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setReportData(prev => ({
                ...prev,
                coordinates: [latitude, longitude],
                location: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
              }));
              toast.success('Location obtained successfully');
            },
            () => {
              // Final fallback
              setReportData(prev => ({
                ...prev,
                coordinates: [23.2599, 77.4126],
                location: 'MG Road, Bhopal (Default Location)'
              }));
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
          );
        }, 1000);
        navigator.geolocation.clearWatch(watchId);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 300000 }
    );
    
    // Clear watch after 20 seconds
    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
    }, 20000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let issueData = null; // Declare issueData in the outer scope

    try {
      // Validate required fields
      if (!reportData.coordinates || !reportData.coordinates[0] || !reportData.coordinates[1]) {
        toast.error('Please get your location first');
        setIsSubmitting(false);
        return;
      }

      // Validate field lengths
      if (reportData.title.length < 5) {
        toast.warning('Title must be at least 5 characters long');
        setIsSubmitting(false);
        return;
      }

      if (reportData.description.length < 10) {
        toast.warning('Description must be at least 10 characters long');
        setIsSubmitting(false);
        return;
      }

      // Debug: Log the data being sent
      console.log('User data:', user);
      
      // 1) Validate with ML backend first (category will be auto-detected)
      // Send image file directly to ML backend (NOT uploaded to Cloudinary yet)
      const mlPayload = {
        report_id: `${Date.now()}`,
        description: reportData.description,
        user_id: user?._id || user?.id || 'anon',
        latitude: reportData.coordinates[0],
        longitude: reportData.coordinates[1]
      };

      // ML validation is now completely non-blocking with 45 second timeout and retries
      // If it times out or fails after retries, we proceed with default category
      let mlResult = null;
      try {
        // 45 second timeout with 2 retries to handle Render cold starts
        // Pass selectedFile directly to ML backend
        mlResult = await apiService.validateReportWithML(mlPayload, selectedFile, 45000, 2);
        console.log('ML validation result:', mlResult);
      } catch (mlError) {
        // This should rarely happen now since validateReportWithML returns null instead of throwing
        console.warn('ML validation error (non-blocking):', mlError.message);
        mlResult = null;
      }
      
      // Only check for explicit rejections from ML backend
      if (mlResult && mlResult.accept === false && mlResult.status === 'rejected') {
        setIsSubmitting(false);
        const reason = mlResult.reason || 'Report rejected by validator';
        toast.error(`Report rejected: ${reason}`);
        return;
      }
      
      // 2) Upload image to Cloudinary ONLY IF ML accepted the report
      let imageUrl = null;
      let uploadedPublicId = null;
      
      if (selectedFile && mlResult && mlResult.accept === true) {
        try {
          const uploadResponse = await apiService.uploadImage(selectedFile);
          // Support both our backend shape { success, data: { url, publicId } }
          // and any direct shape { url, secure_url, public_id }
          const uploaded = uploadResponse?.data || uploadResponse || {};
          imageUrl = uploaded.url || uploaded.secure_url || null;
          uploadedPublicId = uploaded.publicId || uploaded.public_id || null;
        } catch (uploadError) {
          console.warn('Image upload failed, continuing without image:', uploadError);
          // Continue without image if upload fails
        }
      }

      // Prepare issue data (category will be auto-detected by ML backend)
      issueData = {
        title: reportData.title,
        description: reportData.description,
        location: {
          name: reportData.location,
          coordinates: {
            latitude: reportData.coordinates[0],
            longitude: reportData.coordinates[1]
          }
        },
        images: imageUrl ? [{
          url: imageUrl,
          publicId: uploadedPublicId || imageUrl.split('/').pop(),
          caption: 'Issue image'
        }] : []
      };

      // Use ML-detected category if available, otherwise use default
      if (mlResult && mlResult.category) {
        issueData.category = mlResult.category;
        console.log('Using ML-detected category:', mlResult.category);
      } else {
        // Default category if ML validation failed or timed out
        if (!issueData.category) {
          issueData.category = 'Other';
        }
        // Only show warning if ML was attempted but failed (not if it was skipped)
        if (mlResult === null) {
          console.log('ML validation skipped (timeout/unavailable), using default category');
        }
      }

      // Optionally map ML priority to backend priority if provided
      if (mlResult && mlResult.priority) {
        issueData.priority = mlResult.priority === 'urgent' ? 'urgent' : 'medium';
      }

      // Ensure priority is set if not provided
      if (!issueData.priority) {
        issueData.priority = 'medium'; // Default priority
      }

      // 3) Submit to backend only if accepted
      const response = await apiService.createIssue(issueData);
      
      setIsSubmitting(false);
      toast.success('Issue reported successfully!');
      navigate('/citizen');
    } catch (error) {
      setIsSubmitting(false);
      console.error('Issue creation error:', error);
      console.error('Issue data sent:', issueData);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen max-w-full bg-[#f8fafc] px-4 py-6 sm:px-6 sm:py-8 flex justify-center items-start">
      <div className="bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-lg">
        <div className="flex items-center mb-6 sm:mb-8">
          <button 
            onClick={() => navigate('/citizen')}
            className="bg-none border-none text-[#1e4359] cursor-pointer mr-3 sm:mr-4 p-1 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            {t('reportIssue')}
          </h1>
        </div>

        {/* Evidence Capture Section */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Capture Evidence
          </h3>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <button
              type="button"
              onClick={() => setRecordingType('photo')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                recordingType === 'photo' 
                  ? 'bg-[#1e4359] text-white border-[#1e4359]' 
                  : 'bg-transparent text-[#1e4359] border-[#1e4359] hover:bg-[#1e4359]/10'
              }`}
            >
              <Camera size={20} />
              <span className="font-medium">Photo</span>
            </button>
          </div>

          {/* File Upload for Photo */}
          {recordingType === 'photo' && (
            <div 
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 ${
                selectedFile 
                  ? 'border-[#1e4359] border-solid bg-[#1e4359]/5' 
                  : 'border-gray-300 hover:border-[#1e4359] hover:bg-[#1e4359]/5'
              }`}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="relative">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview"
                    className="w-full max-w-xs h-auto rounded-lg mx-auto mt-2"
                  />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-3">
                    <p className="text-gray-600 font-medium text-sm sm:text-base">
                      Click to change image
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white border-none rounded px-3 py-1.5 text-xs sm:text-sm cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 font-medium text-sm sm:text-base">
                    Click to take photo or upload image
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-800 text-sm sm:text-base">
              Issue Title
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <input
                type="text"
                className="flex-1 px-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl text-base sm:text-lg transition-all duration-300 focus:outline-none focus:border-[#1e4359] focus:ring-4 focus:ring-[#1e4359]/10 font-['Fredoka',sans-serif]"
                placeholder="Brief title for the issue"
                value={reportData.title}
                onChange={(e) => setReportData(prev => ({...prev, title: e.target.value}))}
                required
              />
              <button
                type="button"
                className="bg-transparent text-[#1e4359] border-2 border-[#1e4359] px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium cursor-pointer transition-all duration-300 hover:bg-[#1e4359] hover:text-white font-['Fredoka',sans-serif] min-w-[120px] flex items-center justify-center"
                onClick={() => {
                  targetRef.current = 'title';
                  toggleListening();
                }}
                title="Dictate title with your voice"
              >
                {isListening && targetRef.current === 'title' ? 'Stop' : 'Speak'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-800 text-sm sm:text-base">
              Description
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-start">
              <textarea
                className="flex-1 px-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl text-base sm:text-lg transition-all duration-300 focus:outline-none focus:border-[#1e4359] focus:ring-4 focus:ring-[#1e4359]/10 font-['Fredoka',sans-serif] resize-none"
                rows="4"
                placeholder="Describe the issue in detail or use the mic to dictate"
                value={reportData.description}
                onChange={(e) => setReportData(prev => ({...prev, description: e.target.value}))}
                required
              />
              <button
                type="button"
                className="bg-transparent text-[#1e4359] border-2 border-[#1e4359] px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium cursor-pointer transition-all duration-300 hover:bg-[#1e4359] hover:text-white font-['Fredoka',sans-serif] min-w-[120px] flex items-center justify-center"
                onClick={() => { targetRef.current = 'description'; toggleListening(); }}
                title="Dictate with your voice"
              >
                {isListening ? 'Stop' : 'Speak'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-800 text-sm sm:text-base">
              Location
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-end">
              <input
                type="text"
                className="flex-1 px-4 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl text-base sm:text-lg transition-all duration-300 focus:outline-none focus:border-[#1e4359] focus:ring-4 focus:ring-[#1e4359]/10 font-['Fredoka',sans-serif]"
                placeholder="Enter location or use GPS"
                value={reportData.location}
                onChange={(e) => setReportData(prev => ({...prev, location: e.target.value}))}
                required
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="bg-transparent text-[#1e4359] border-2 border-[#1e4359] px-4 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-medium cursor-pointer transition-all duration-300 hover:bg-[#1e4359] hover:text-white font-['Fredoka',sans-serif] flex items-center justify-center gap-2 min-w-[100px]"
              >
                <MapPin size={16} />
                GPS
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="bg-gradient-to-r from-[#1e4359] to-[#3f6177] text-white border-none px-4 py-3 sm:py-3.5 rounded-xl text-base sm:text-lg font-semibold cursor-pointer transition-all duration-300 hover:shadow-lg hover:transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-['Fredoka',sans-serif]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;