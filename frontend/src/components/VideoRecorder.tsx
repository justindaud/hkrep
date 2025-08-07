'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Square, Upload, Play, Pause, RotateCcw, RotateCw, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Room {
  id: number;
  room_number: string;
}

const VideoRecorder: React.FC = () => {
  const { token } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentMimeType, setCurrentMimeType] = useState<string>('video/webm');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isSafari, setIsSafari] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();

  // Dynamic API URL - will work for both localhost and network access
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // If frontend is HTTPS, backend should also be HTTPS
      if (protocol === 'https:') {
        return `https://${hostname}:8080`;
      }
      
      // For localhost or 127.0.0.1, use localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8080';
      }
      
      // For network access (IP addresses), use the same hostname with backend port
      if (hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        return `http://${hostname}:8080`;
      }
      
      // For other hosts (like domain names), use HTTP
      return `http://${hostname}:8080`;
    }
    return 'http://localhost:8080';
  };

  const API_BASE_URL = getApiUrl();

  // Detect Safari browser
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    // More accurate Safari detection
    const isSafariBrowser = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('firefox');
    setIsSafari(isSafariBrowser);
    console.log('User Agent:', navigator.userAgent);
    console.log('Is Safari:', isSafariBrowser);
  }, []);

  // Load rooms on component mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  // Cleanup camera when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        console.log('Cleaning up camera stream on unmount');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsCameraOn(false);
      }
    };
  }, [stream]);

  // Cleanup camera when user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stream) {
        console.log('Cleaning up camera stream on page unload');
        stream.getTracks().forEach(track => track.stop());
      }
      // Stop recording if active
      if (isRecording && mediaRecorder) {
        console.log('Stopping recording on page unload');
        mediaRecorder.stop();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (stream) {
          console.log('Cleaning up camera stream on page visibility change');
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
          setIsCameraOn(false);
        }
        // Stop recording if active
        if (isRecording && mediaRecorder) {
          console.log('Stopping recording on page visibility change');
          mediaRecorder.stop();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stream, isRecording, mediaRecorder]);

  const loadRooms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const getSupportedMimeType = () => {
    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      console.log('MediaRecorder not supported');
      return '';
    }

    // List of MIME types to try, in order of preference
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
      'video/ogg;codecs=theora',
      'video/ogg'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('Supported MIME type:', mimeType);
        return mimeType;
      }
    }

    console.log('No supported MIME type found');
    return '';
  };

  const startCamera = async () => {
    try {
      setError(null);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      console.log('Attempting to access camera...');
      console.log('Current location:', window.location.href);
      console.log('Protocol:', window.location.protocol);
      console.log('Hostname:', window.location.hostname);
      console.log('Port:', window.location.port);
      
      // Check if we're in a secure context or local network
      const hostname = window.location.hostname;
      const isLocalOrDevelopment = hostname === 'localhost' || 
                                  hostname === '127.0.0.1' ||
                                  hostname.startsWith('192.168.') ||
                                  hostname.startsWith('10.') ||
                                  hostname.startsWith('172.') ||
                                  window.location.port === '3000' ||
                                  window.location.port === '3001' ||
                                  process.env.NODE_ENV === 'development';

      // For local network IPs, we need to handle this differently
      if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        console.log('Detected local network IP, attempting camera access...');
        // For local network, we'll try to access camera anyway
        // Browser might still block it, but we'll give it a try
      }
      
      // First try to enumerate devices to see what's available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Available video devices:', videoDevices);
        
        if (videoDevices.length === 0) {
          setError('No camera devices found. Please check if your device has a camera.');
          return;
        }
      } catch (deviceError) {
        console.warn('Could not enumerate devices:', deviceError);
      }
      
      // Try with simpler constraints first
      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      console.log('Requesting camera with constraints:', constraints);
      
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstError) {
        console.log('First attempt failed, trying with minimal constraints:', firstError);
        // Try with minimal constraints
        constraints = {
          video: true,
          audio: true
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      console.log('Camera access granted:', mediaStream);
      
      setStream(mediaStream);
      setIsCameraOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Set MIME type for recording
      const mimeType = getSupportedMimeType();
      if (mimeType) {
        setCurrentMimeType(mimeType);
      }

    } catch (err: any) {
      console.error('Error starting camera:', err);
      if (err.name === 'NotAllowedError') {
        if (window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.hostname.startsWith('172.')) {
          setError('Camera access denied for local network IP. This is a browser security restriction. Please:\n1. Access the application via localhost (http://localhost:3000)\n2. Or use HTTPS for local network access\n3. Or check browser settings for camera permissions');
        } else {
          setError('Camera access denied. Please follow these steps:\n1. Click "Allow" when browser asks for camera permission\n2. If no prompt appears, check browser settings\n3. Make sure camera is not blocked in browser settings\n4. Try refreshing the page and try again');
        }
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please check if your device has a camera and it is not being used by another application.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported. Please use a different browser or device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application. Please close other camera applications (Zoom, Teams, etc.) and try again.');
      } else if (err.name === 'SecurityError') {
        setError('Camera access blocked due to security restrictions. Please try accessing via localhost or HTTPS.');
      } else {
        setError(`Failed to start camera: ${err.message || 'Unknown error'}. Please check camera permissions and try again.`);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const flipCamera = async () => {
    if (stream) {
      stopCamera();
      setFacingMode(facingMode === 'user' ? 'environment' : 'user');
      // Small delay to ensure camera is stopped before starting new one
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  const startRecording = async () => {
    if (!stream) {
      setError('Camera not started. Please start camera first.');
      return;
    }

    try {
      setError(null);
      setRecordedChunks([]);
      setPreviewUrl(null);
      setRecordingTime(0);

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        setError('No supported video format found for recording.');
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedChunks(chunks);
        setPreviewUrl(url);
        setIsRecording(false);
        setIsPaused(false);
      };

      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to start recording.');
    }
  };

  const togglePause = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
    } else if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const resetRecording = () => {
    // Stop camera first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Reset all recording states
    setRecordedChunks([]);
    setPreviewUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    // Clear any existing media recorder
    if (mediaRecorder) {
      setMediaRecorder(null);
    }
  };

  const uploadVideo = async () => {
    if (!selectedRoom) {
      setError('Please select a room before uploading.');
      return;
    }

    if (recordedChunks.length === 0) {
      setError('No video recorded. Please record a video first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const blob = new Blob(recordedChunks, { type: currentMimeType });
      const formData = new FormData();
      formData.append('video', blob, `video_${Date.now()}.webm`);
      formData.append('room_number', selectedRoom);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setError(null);
          // Reset after successful upload
          resetRecording();
          setSelectedRoom('');
          setIsUploading(false);
          setUploadProgress(0);
        } else {
          throw new Error(`Upload failed: ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Upload failed. Please check your connection.');
      });

      xhr.open('POST', `${API_BASE_URL}/api/videos/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Video Recorder</h1>
                <p className="text-sm text-gray-600">Capture and upload videos</p>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isCameraOn && (
                <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-700">Camera On</span>
                </div>
              )}
              {isRecording && (
                <div className="flex items-center space-x-2 bg-red-100 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-red-700">
                    {isPaused ? 'PAUSED' : `REC ${formatTime(recordingTime)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Video Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
            {!recordedChunks.length ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                key={previewUrl}
                src={previewUrl || undefined}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                {isPaused ? 'PAUSED' : `REC ${formatTime(recordingTime)}`}
              </div>
            )}

            {/* Camera Flip Button */}
            {!recordedChunks.length && isCameraOn && (
              <button
                onClick={flipCamera}
                className="absolute top-3 right-3 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                title="Flip Camera"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Room Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Room
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
            disabled={isRecording}
          >
            <option value="">Choose a room...</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.room_number}>
                Room {room.room_number}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {!isCameraOn && (
              <button
                onClick={startCamera}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm font-medium"
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </button>
            )}

            {isCameraOn && !isRecording && !recordedChunks.length && (
              <button
                onClick={startRecording}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm font-medium"
              >
                <div className="mr-2 w-4 h-4 bg-white rounded-full"></div>
                Start Recording
              </button>
            )}

            {isRecording && (
              <>
                <button
                  onClick={togglePause}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-sm font-medium"
                >
                  {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  onClick={stopRecording}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm font-medium"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </button>
              </>
            )}

            {recordedChunks.length > 0 && (
              <>
                <button
                  onClick={uploadVideo}
                  disabled={isUploading || !selectedRoom}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? `Uploading ${Math.round(uploadProgress)}%` : 'Upload'}
                </button>

                <button
                  onClick={resetRecording}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm font-medium"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Record Again
                </button>
              </>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm font-medium text-gray-700">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Instructions
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Tap "Start Camera" to turn on camera
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Tap "Start Recording" to begin recording
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Select a room before uploading
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Use pause/resume if needed
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Tap camera icon to flip camera
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Preview before uploading
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VideoRecorder; 