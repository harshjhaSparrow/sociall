import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusSquare, User, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    // Exact match for home, startsWith for others
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const profilePath = user ? `/profile/${user.uid}` : '/auth';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Main Content Area */}
      <div className="flex-1 pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 pb-[env(safe-area-inset-bottom)] z-[2000] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
          
          {/* Feed Tab */}
          <button 
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Home className={`w-6 h-6 ${isActive('/') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Map Tab */}
          <button 
            onClick={() => navigate('/map')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/map') ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Map className={`w-6 h-6 ${isActive('/map') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Map</span>
          </button>

          {/* Create Post Tab */}
          <button 
             onClick={() => navigate('/create-post')}
             className="relative -top-5"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-500 to-primary-600 shadow-lg shadow-primary-500/40 flex items-center justify-center text-white transform transition-transform active:scale-95">
               <PlusSquare className="w-7 h-7" />
            </div>
          </button>

          {/* Profile Tab */}
          <button 
            onClick={() => navigate(profilePath)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/profile') ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User className={`w-6 h-6 ${isActive('/profile') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Layout;