'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Download, Trash2, X, RefreshCw, FolderOpen, Calendar, User, HardDrive, AlertCircle, Filter } from 'lucide-react';

interface Video {
  id: number;
  filename: string;
  file_size: number;
  room_id: number;
  uploaded_by: number;
  user_username: string;
  created_at: string;
  original_filename?: string;
  upload_date?: string;
  user?: { username: string };
  room?: { room_number: string };
}

interface FileManagementProps {
  onBack?: () => void;
}

const FileManagement: React.FC<FileManagementProps> = ({ onBack }) => {
  const { token, user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Check if user has permission to access File Management
  const hasPermission = user?.role === 'manager' || user?.role === 'supervisor';

  // Dynamic API URL
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

  useEffect(() => {
    if (hasPermission) {
      loadVideos();
    }
  }, [hasPermission]);

  // Filter videos based on room and date range
  useEffect(() => {
    let filtered = videos;

    // Filter by selected rooms
    if (selectedRooms.length > 0) {
      filtered = filtered.filter(video => 
        video.room?.room_number && selectedRooms.includes(video.room.room_number)
      );
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(video => {
        const videoDate = new Date(video.upload_date || video.created_at);
        const videoDateOnly = videoDate.toISOString().split('T')[0];
        
        if (startDate && endDate) {
          return videoDateOnly >= startDate && videoDateOnly <= endDate;
        } else if (startDate) {
          return videoDateOnly >= startDate;
        } else if (endDate) {
          return videoDateOnly <= endDate;
        }
        return true;
      });
    }

    setFilteredVideos(filtered);
  }, [videos, selectedRooms, startDate, endDate]);

  // If user doesn't have permission, show access denied
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access File Management. This feature is only available for Manager and Supervisor roles.
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm font-medium mx-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/videos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        setError('Failed to load videos');
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setError('Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
    setShowModal(true);
  };

  const handleDownloadVideo = async (video: Video) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/videos/${video.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = video.original_filename || video.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download video');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download video');
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setVideos(videos.filter(video => video.id !== videoId));
      } else {
        setError('Failed to delete video');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete video');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get unique rooms for filter
  const uniqueRooms = [...new Set(videos.map(video => video.room?.room_number).filter((room): room is string => Boolean(room)))];

  const handleRoomToggle = (roomNumber: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomNumber) 
        ? prev.filter(room => room !== roomNumber)
        : [...prev, roomNumber]
    );
  };

  const clearFilters = () => {
    setSelectedRooms([]);
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">File Management</h1>
                <p className="text-sm text-gray-600">Browse and manage uploaded videos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadVideos}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h3>
            {(selectedRooms.length > 0 || startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Room Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filter by Room
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uniqueRooms.map(room => (
                  <label key={room} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room)}
                      onChange={() => handleRoomToggle(room)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">Room {room}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filter by Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>
              </div>
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

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading videos...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-600">
              {selectedRooms.length > 0 || startDate || endDate
                ? 'No videos match your filter criteria. Try adjusting your filters.'
                : 'Start recording videos to see them here'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                      {video.original_filename || video.filename}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Size:</span> {formatFileSize(video.file_size)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Room:</span> {video.room?.room_number || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">By:</span> {video.user?.username || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span> {formatDate(video.upload_date || video.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-2">
                    <button
                      onClick={() => handlePlayVideo(video)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-sm font-medium text-sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </button>
                    <button
                      onClick={() => handleDownloadVideo(video)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm font-medium text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Modal */}
        {showModal && selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedVideo.original_filename || selectedVideo.filename}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <video
                  controls
                  crossOrigin="anonymous"
                  className="w-full h-auto max-h-[70vh] rounded-xl"
                  src={`${API_BASE_URL}/api/videos/${selectedVideo.id}/stream`}
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    alert('Failed to load video');
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManagement; 