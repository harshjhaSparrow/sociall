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
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';
import LocationGuard from './components/LocationGaurd';

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
          setHasProfile(!!profile);
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

  // Force Onboarding if no profile exists
  if (status === 'authenticated' && !hasProfile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Prevent accessing Onboarding if profile already exists
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
        
        {/* Main App - Protected by Location & Layout */}
        <Route element={
          <ProtectedRoute>
            <LocationGuard>
               <Layout />
            </LocationGuard>
          </ProtectedRoute>
        }>
            <Route path="/" element={<Feed />} />
            <Route path="/profile/:uid?" element={<Profile />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/edit-post/:id" element={<EditPost />} />
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