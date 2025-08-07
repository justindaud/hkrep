'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Shield, Video, Upload, ArrowLeft, Camera, FolderOpen, Users, Building, Home, Settings } from 'lucide-react';
import VideoRecorder from './VideoRecorder';
import RoomManagement from './RoomManagement';
import UserManagement from './UserManagement';
import FileManagement from './FileManagement';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'videoRecording' | 'roomManagement' | 'userManagement' | 'fileManagement' | null>(null);

  const handleLogout = () => {
    logout();
  };

  const handleStartRecording = () => {
    setCurrentView('videoRecording');
  };

  const handleBackToDashboard = () => {
    setCurrentView(null);
  };

  const handleRoomManagement = () => {
    if (user?.role === 'manager' || user?.role === 'supervisor') {
      setCurrentView('roomManagement');
    } else {
      // This shouldn't happen since the button is already hidden for non-manager/supervisor users
      console.warn('User does not have permission to access Room Management');
    }
  };

  const handleUserManagement = () => {
    if (user?.role === 'manager' || user?.role === 'supervisor') {
      setCurrentView('userManagement');
    } else {
      // This shouldn't happen since the button is already hidden for non-manager/supervisor users
      console.warn('User does not have permission to access User Management');
    }
  };

  const handleFileManagement = () => {
    if (user?.role === 'manager' || user?.role === 'supervisor') {
      setCurrentView('fileManagement');
    } else {
      // This shouldn't happen since the button is already hidden for non-manager/supervisor users
      console.warn('User does not have permission to access File Management');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Bar - Mobile Responsive */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  RA Room Report
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Video Upload & Management System
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                </div>
                <div className="flex items-center space-x-1 bg-blue-100 rounded-full px-2 py-1">
                  <Shield className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-700 font-medium capitalize">{user?.role}</span>
                </div>
              </div>
              
              {/* Mobile User Info */}
              <div className="sm:hidden flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        {currentView && currentView !== 'dashboard' && (
          <div className="mb-6">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Dashboard Grid */}
        {!currentView && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.username}!
                  </h2>
                  <p className="text-gray-600">
                    What would you like to do today?
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Video Recording Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer" onClick={handleStartRecording}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Video className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Record Video
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Capture and upload videos directly from your device
                  </p>
                </div>
              </div>

              {/* File Management Card */}
              {(user?.role === 'manager' || user?.role === 'supervisor') && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer" onClick={handleFileManagement}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Upload className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      File Management
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Browse, search, and manage uploaded videos
                    </p>
                  </div>
                </div>
              )}

              {/* Room Management Card */}
              {(user?.role === 'manager' || user?.role === 'supervisor') && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer" onClick={handleRoomManagement}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Settings className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Room Management
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Manage rooms and organize video content
                    </p>
                  </div>
                </div>
              )}

              {/* User Management Card */}
              {(user?.role === 'manager' || user?.role === 'supervisor') && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer" onClick={handleUserManagement}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-orange-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      User Management
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Manage users and their permissions
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Views */}
        {currentView === 'videoRecording' && <VideoRecorder />}
        {currentView === 'roomManagement' && <RoomManagement onBack={handleBackToDashboard} />}
        {currentView === 'userManagement' && <UserManagement onBack={handleBackToDashboard} />}
        {currentView === 'fileManagement' && <FileManagement onBack={handleBackToDashboard} />}
      </div>
    </div>
  );
};

export default Dashboard; 