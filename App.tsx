import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import AuthPage from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import PostDetail from './pages/PostDetail';
import MapPage from './pages/MapPage';
import Chat from './pages/Chat';
import Inbox from './pages/Inbox';
import Layout from './components/Layout';
import LocationGuard from './components/LocationGuard';
import { Loader2 } from 'lucide-react';

// Guard component to protect routes and check profile existence
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, status } = useAuth();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        try {
          const profile = await api.profile.get(user.uid);
          // A profile is considered "complete" (onboarded) if it exists AND has interests selected.
          // Signup creates a skeletal profile with empty interests.
          const isOnboarded = !!profile && Array.isArray(profile.interests) && profile.interests.length > 0;
          setHasProfile(isOnboarded);
        } catch (e) {
          console.error("Error checking profile", e);
          setHasProfile(false);
        } finally {
          setProfileChecked(true);
        }
      } else {
        setProfileChecked(true);
      }
    };

    if (status === 'authenticated') {
      checkProfile();
    } else if (status === 'unauthenticated') {
      setProfileChecked(true);
    }
  }, [user, status]);

  if (status === 'loading' || (status === 'authenticated' && !profileChecked)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/auth" />;
  }

  // Force Onboarding if profile is incomplete
  if (status === 'authenticated' && !hasProfile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Prevent accessing Onboarding if profile is already completed
  if (status === 'authenticated' && hasProfile && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { status } = useAuth();
  
  return (
    <div className="antialiased text-slate-900">
      <Routes>
        <Route path="/auth" element={status === 'authenticated' ? <Navigate to="/" /> : <AuthPage />} />
        
        {/* Onboarding - Isolated */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />

        {/* Chat - Isolated (No Bottom Menu) */}
        <Route path="/chat/:uid" element={
          <ProtectedRoute>
            <LocationGuard>
               <Chat />
            </LocationGuard>
          </ProtectedRoute>
        } />
        
        {/* Main App - Protected by Location & Layout */}
        <Route element={
          <ProtectedRoute>
            <LocationGuard>
               <Layout />
            </LocationGuard>
          </ProtectedRoute>
        }>
            <Route path="/" element={<Feed />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/profile/:uid?" element={<Profile />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/edit-post/:id" element={<EditPost />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/edit-profile" element={<EditProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;