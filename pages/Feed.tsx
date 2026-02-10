import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { Loader2, RefreshCw } from 'lucide-react';
import PostItem from '../components/PostItem';

const PostSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
    <div className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
      </div>
    </div>
    <div className="w-full h-64 bg-slate-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-3/4 bg-slate-200 rounded" />
      <div className="h-4 w-1/2 bg-slate-200 rounded" />
    </div>
  </div>
);

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const fetchPosts = async () => {
    try {
      const data = await api.posts.getAll();
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
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
        // Add resistance to the pull
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
    
    // Optimistic Update
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
      console.error("Failed to like post", error);
      // Revert optimistic update on error
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

  return (
    <div 
      className="max-w-md mx-auto bg-slate-50 min-h-screen relative"
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
          className="bg-white rounded-full p-2 shadow-md border border-slate-100"
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
        className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 border-b border-slate-100 flex justify-between items-center transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${pullY * 0.5}px)` }}
      >
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Socially</h1>
        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
           {/* Placeholder for user avatar or small icon */}
           {user && <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">{user.email?.[0]?.toUpperCase()}</div>}
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
          <div className="text-center py-20 text-slate-400 animate-fade-in">
            <p>No posts yet. Be the first to share something!</p>
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
    </div>
  );
};

export default Feed;