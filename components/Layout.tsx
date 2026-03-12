import { Home, Map, MessageCircle, PlusSquare, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

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
        setUnreadMessages(count);
      } catch (e) {
        console.error(e);
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation — 5 tabs */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 pb-[max(env(safe-area-inset-bottom),0px)] z-[2000]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-1">

          {/* Home */}
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Home className={`w-5 h-5 ${isActive('/') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Map */}
          <button
            onClick={() => navigate('/map')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/map') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Map className={`w-5 h-5 ${isActive('/map') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Map</span>
          </button>

          {/* Create Post — elevated center */}
          <button
            onClick={() => navigate('/create-post')}
            className="relative -top-5"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center text-white transform transition-transform active:scale-95 border-4 border-slate-950">
              <PlusSquare className="w-6 h-6" />
            </div>
          </button>

          {/* Notifications */}
          {/* <button
            onClick={() => navigate('/notifications')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/notifications') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className="relative">
              <Bell className={`w-5 h-5 ${isActive('/notifications') ? 'fill-current' : ''}`} />
              {notifUnreadCount > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium">Activity</span>
          </button> */}
          <button
            onClick={() => navigate('/inbox')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/inbox') || isActive('/chat') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className="relative">
              <MessageCircle className={`w-5 h-5 ${isActive('/inbox') || isActive('/chat') ? 'fill-current' : ''}`} />
              {unreadMessages > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium">Chat</span>
          </button>



          {/* Profile */}
          <button
            onClick={() => navigate(profilePath)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/profile') ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className="relative">
              <User className={`w-5 h-5 ${isActive('/profile') ? 'fill-current' : ''}`} />
              {/* {unreadMessages > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </div>
              )} */}
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Layout;