import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusSquare, User, Map, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const profilePath = user ? `/profile/${user.uid}` : '/auth';

  // Poll for unread messages
  useEffect(() => {
    const checkUnread = async () => {
        if (!user) return;
        try {
            const count = await api.chat.getUnreadCount(user.uid);
            setUnreadCount(count);
        } catch (e) {
            console.error(e);
        }
    };
    
    checkUnread();
    const interval = setInterval(checkUnread, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [user]);

  // Reset count if we are on inbox
  useEffect(() => {
      if (location.pathname === '/inbox') {
          // Ideally we re-fetch after a short delay or let the poller update it eventually
          // but we can't reset to 0 immediately unless we know everything is read.
      }
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 pb-[env(safe-area-inset-bottom)] z-[2000]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-1">
          
          {/* Feed Tab */}
          <button 
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Home className={`w-5 h-5 ${isActive('/') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Map Tab */}
          <button 
            onClick={() => navigate('/map')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/map') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Map className={`w-5 h-5 ${isActive('/map') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Map</span>
          </button>

          {/* Create Post Tab */}
          <button 
             onClick={() => navigate('/create-post')}
             className="relative -top-5"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center text-white transform transition-transform active:scale-95 border-4 border-slate-950">
               <PlusSquare className="w-6 h-6" />
            </div>
          </button>

          {/* Messages Tab */}
          <button 
            onClick={() => navigate('/inbox')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/inbox') || isActive('/chat') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className="relative">
                <MessageCircle className={`w-5 h-5 ${isActive('/inbox') || isActive('/chat') ? 'fill-current' : ''}`} />
                {unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </div>
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          {/* Profile Tab */}
          <button 
            onClick={() => navigate(profilePath)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/profile') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <User className={`w-5 h-5 ${isActive('/profile') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Profile</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Layout;