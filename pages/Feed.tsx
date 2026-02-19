import { Bell, Check, Heart, Loader2, MessageCircle, RefreshCw, Settings, UserPlus, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserLocation } from '../components/LocationGuard';
import PostItem from '../components/PostItem';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Notification, Post, UserProfile } from '../types';

const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const PostSkeleton = () => (
  <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-sm animate-pulse">
    <div className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-800" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-24 bg-slate-800 rounded" />
        <div className="h-3 w-16 bg-slate-800 rounded" />
      </div>
    </div>
    <div className="w-full h-64 bg-slate-800" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-3/4 bg-slate-800 rounded" />
      <div className="h-4 w-1/2 bg-slate-800 rounded" />
    </div>
  </div>
);

const Feed: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { location: myLocation } = useUserLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const fetchPosts = async () => {
    try {
      if (!user) return;
      
      const [allPosts, profile] = await Promise.all([
          api.posts.getAll(user.uid),
          api.profile.get(user.uid)
      ]);
      
      setUserProfile(profile);

      // Filter based on discovery radius if location is available
      let filteredPosts = allPosts;
      if (myLocation && profile && profile.discoveryRadius) {
          const maxDistMeters = profile.discoveryRadius * 1000;
          filteredPosts = allPosts.filter((p:any) => {
              // Always show own posts
              if (p.uid === user.uid) return true;
              
              // If post has no location, we might choose to show or hide. 
              // Assuming global posts without location should show? Or hide?
              // Let's hide if we are strictly filtering by radius, but show if it's a friend?
              // For simplicity, if post has location, we filter. If not, we show (e.g. global/remote posts).
              if (p.location) {
                  const dist = getDistanceMeters(
                      myLocation.lat, myLocation.lng,
                      p.location.lat, p.location.lng
                  );
                  return dist <= maxDistMeters;
              }
              return true; 
          });
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
      if (user) {
          try {
              const data = await api.notifications.get(user.uid);
              setNotifications(data);
              setUnreadCount(data.filter(n => !n.read).length);
          } catch (e) {
              console.error("Failed to load notifications", e);
          }
      }
  };

  useEffect(() => {
    fetchPosts();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, myLocation]); // Re-fetch/filter if location changes

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(), fetchNotifications()]);
    setRefreshing(false);
    setPullY(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    if (window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0) {
        const damped = Math.min(diff * 0.4, 150);
        setPullY(damped);
      }
    } else {
      isDragging.current = false;
      setPullY(0);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (pullY > 60) {
      handleRefresh();
    } else {
      setPullY(0);
    }
  };

  const handleLike = async (post: Post) => {
    if (!user || !post._id) return;
    const isLiked = post.likedBy?.includes(user.uid);
    const newLikes = isLiked ? post.likes - 1 : post.likes + 1;
    const newLikedBy = isLiked 
      ? post.likedBy?.filter(id => id !== user.uid) || []
      : [...(post.likedBy || []), user.uid];

    setPosts(currentPosts => currentPosts.map(p => 
      p._id === post._id 
        ? { ...p, likes: newLikes, likedBy: newLikedBy }
        : p
    ));

    try {
      const updatedData = await api.posts.toggleLike(post._id, user.uid);
      setPosts(currentPosts => currentPosts.map(p => 
        p._id === post._id 
          ? { ...p, likes: updatedData.likes, likedBy: updatedData.likedBy }
          : p
      ));
    } catch (error) {
      setPosts(currentPosts => currentPosts.map(p => 
        p._id === post._id ? post : p
      ));
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!user) return;
    try {
      const newComment = await api.posts.addComment(postId, user.uid, text);
      setPosts(currentPosts => currentPosts.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));
    } catch (error) {
      console.error("Failed to add comment", error);
      throw error;
    }
  };

  const handleNotificationClick = async (n: Notification) => {
      setShowNotifications(false);
      if (n.type === 'friend_request') {
          navigate(`/profile/${n.fromUid}`);
      } else if (n.type === 'friend_accept') {
          navigate(`/profile/${n.fromUid}`);
      } else if ((n.type === 'like' || n.type === 'comment') && n.postId) {
          navigate(`/post/${n.postId}`);
      }
  };

  const openNotifications = async () => {
      setShowNotifications(true);
      if (unreadCount > 0) {
          const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
          if (unreadIds.length > 0) {
              await api.notifications.markRead(unreadIds);
              setUnreadCount(0);
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          }
      }
  };

  const getNotificationIcon = (type: string) => {
      switch(type) {
          case 'friend_request': return <UserPlus className="w-4 h-4 text-white" />;
          case 'friend_accept': return <Check className="w-4 h-4 text-white" />;
          case 'like': return <Heart className="w-4 h-4 text-white fill-current" />;
          case 'comment': return <MessageCircle className="w-4 h-4 text-white" />;
          default: return <Bell className="w-4 h-4 text-white" />;
      }
  };

  const getNotificationColor = (type: string) => {
      switch(type) {
          case 'friend_request': return 'bg-blue-500 shadow-lg shadow-blue-500/30';
          case 'friend_accept': return 'bg-green-500 shadow-lg shadow-green-500/30';
          case 'like': return 'bg-red-500 shadow-lg shadow-red-500/30';
          case 'comment': return 'bg-indigo-500 shadow-lg shadow-indigo-500/30';
          default: return 'bg-slate-500';
      }
  };

  const getNotificationText = (n: Notification) => {
      switch(n.type) {
          case 'friend_request': return <>sent you a <span className="font-bold text-slate-100">friend request</span></>;
          case 'friend_accept': return <>accepted your <span className="font-bold text-slate-100">friend request</span></>;
          case 'like': return <>liked your <span className="font-bold text-slate-100">post</span></>;
          case 'comment': return <>commented on your <span className="font-bold text-slate-100">post</span></>;
          default: return 'New notification';
      }
  };

  return (
    <div 
      className="max-w-md mx-auto bg-slate-950 min-h-screen relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Spinner Indicator */}
      <div 
        className="absolute left-0 right-0 top-4 flex justify-center z-20 pointer-events-none transition-opacity duration-200"
        style={{ opacity: pullY > 20 ? 1 : 0 }}
      >
        <div 
          className="bg-slate-900 rounded-full p-2 shadow-md border border-slate-800"
          style={{ transform: `rotate(${pullY * 2}deg)` }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 text-primary-500" />
          )}
        </div>
      </div>

      {/* Header */}
      <div 
        className="bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 px-4 py-3 border-b border-slate-800 flex justify-between items-center transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${pullY * 0.5}px)` }}
      >
        <h1 className="text-xl font-bold text-white tracking-tight">Socially</h1>
        
        <div className="flex items-center gap-2">
             {/* Settings Button */}
             <button 
               onClick={() => navigate('/settings')}
               className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
             >
                 <Settings className="w-6 h-6" />
             </button>

             {/* Notification Bell */}
             <button 
               onClick={openNotifications}
               className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
             >
                 <Bell className="w-6 h-6 text-slate-400" />
                 {unreadCount > 0 && (
                     <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                         {unreadCount > 9 ? '9+' : unreadCount}
                     </div>
                 )}
             </button>

             {/* User Avatar */}
             <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700 ml-1">
                {user && <div className="w-full h-full bg-slate-800 flex items-center justify-center text-primary-500 font-bold text-xs">{user.email?.[0]?.toUpperCase()}</div>}
             </div> 
        </div>
      </div>

      {/* Content Container */}
      <div 
        className="p-4 space-y-6 pb-24 transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${pullY}px)` }}
      >
        {loading ? (
          <div className="space-y-6 animate-fade-in">
             <PostSkeleton />
             <PostSkeleton />
             <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-500 animate-fade-in">
            <p>No posts found nearby. Try increasing your discovery radius in settings!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <div 
              key={post._id} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PostItem 
                post={post}
                currentUserId={user?.uid}
                onLike={handleLike}
                onAddComment={handleAddComment}
              />
            </div>
          ))
        )}
      </div>

      {/* Notifications Modal */}
      {showNotifications && (
         <div className="fixed inset-0 z-[2000] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-fade-in">
            <div 
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={() => setShowNotifications(false)}
            />
            <div className="bg-slate-900 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black relative z-10 flex flex-col max-h-[80vh] animate-slide-up overflow-hidden border border-slate-800">
               <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <h3 className="font-bold text-white text-lg">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="p-2 -mr-2 text-slate-400 hover:text-white">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                   {notifications.length === 0 ? (
                       <div className="text-center py-12 text-slate-500 text-sm">
                           No notifications yet.
                       </div>
                   ) : (
                       <div className="space-y-1">
                           {notifications.map(n => (
                               <div 
                                 key={n._id}
                                 onClick={() => handleNotificationClick(n)}
                                 className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${n.read ? 'bg-transparent hover:bg-slate-800' : 'bg-slate-800/60 hover:bg-slate-800'}`}
                               >
                                   <div className="relative">
                                       <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                           {n.fromPhoto ? (
                                               <img src={n.fromPhoto} alt={n.fromName} className="w-full h-full object-cover" />
                                           ) : (
                                               <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{n.fromName[0]}</div>
                                           )}
                                       </div>
                                       <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center ${getNotificationColor(n.type)}`}>
                                           {getNotificationIcon(n.type)}
                                       </div>
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <p className="text-sm text-slate-400 leading-snug">
                                           <span className="font-bold text-slate-200 mr-1">{n.fromName}</span>
                                           {getNotificationText(n)}
                                       </p>
                                       <span className="text-[10px] text-slate-600 font-medium">
                                           {new Date(n.createdAt).toLocaleDateString()}
                                       </span>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Feed;