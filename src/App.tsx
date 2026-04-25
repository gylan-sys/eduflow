/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { StrictMode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Schedule } from './pages/Schedule';
import { Attendance } from './pages/Attendance';
import { Financials } from './pages/Financials';
import { Progress } from './pages/Progress';
import { Login } from './pages/Login';
import { Students } from './pages/Students';
import { Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Announcements } from './pages/Announcements';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="financials" element={<Financials />} />
          <Route path="progress" element={<Progress />} />
          <Route path="users" element={<Users />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}
