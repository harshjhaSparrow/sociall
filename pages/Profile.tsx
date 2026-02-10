import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile, POPULAR_INTERESTS, Post } from '../types';
import { LogOut, Instagram, MapPin, Edit2, Loader2, Sparkles, Navigation } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import PostItem from '../components/PostItem';
import { useUserLocation } from '@/components/LocationGaurd';
import { calculateDistance } from '@/components/util/location';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { location: myLocation } = useUserLocation();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState<Post[]>([]);

  // Determine if we are viewing our own profile
  const isOwnProfile = !uid || (user && user.uid === uid);
  const targetUid = uid || user?.uid;

  useEffect(() => {
    const fetchData = async () => {
      if (targetUid) {
        try {
          // Fetch Profile
          const userProfile = await api.profile.get(targetUid);
          if (userProfile) {
            setProfile(userProfile);
          } else if (isOwnProfile) {
            navigate('/onboarding');
            return;
          }

          // Fetch Posts for this user
          const posts = await api.posts.getUserPosts(targetUid);
          setMyPosts(posts);

        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [targetUid, isOwnProfile, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // --- Post Interactions ---

  const handleLike = async (post: Post) => {
    if (!user || !post._id) return;
    
    // Optimistic Update
    const isLiked = post.likedBy?.includes(user.uid);
    const newLikes = isLiked ? post.likes - 1 : post.likes + 1;
    const newLikedBy = isLiked 
      ? post.likedBy?.filter(id => id !== user.uid) || []
      : [...(post.likedBy || []), user.uid];

    setMyPosts(currentPosts => currentPosts.map(p => 
      p._id === post._id 
        ? { ...p, likes: newLikes, likedBy: newLikedBy }
        : p
    ));

    try {
      const updatedData = await api.posts.toggleLike(post._id, user.uid);
      setMyPosts(currentPosts => currentPosts.map(p => 
        p._id === post._id 
          ? { ...p, likes: updatedData.likes, likedBy: updatedData.likedBy }
          : p
      ));
    } catch (error) {
      console.error("Failed to like post", error);
      // Revert
      setMyPosts(currentPosts => currentPosts.map(p => 
        p._id === post._id ? post : p
      ));
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!user) return;
    try {
      const newComment = await api.posts.addComment(postId, user.uid, text);
      setMyPosts(currentPosts => currentPosts.map(p => {
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

  const handleDeletePost = async (postId: string) => {
    if (!user || !confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await api.posts.deletePost(postId, user.uid);
      setMyPosts(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      alert("Failed to delete post");
    }
  };

  const handleEditPost = (postId: string) => {
    navigate(`/edit-post/${postId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!profile) return (
    <div className="p-8 text-center text-slate-500">User not found</div>
  );

  const distance = (profile.lastLocation && myLocation) 
    ? calculateDistance(myLocation.lat, myLocation.lng, profile.lastLocation.lat, profile.lastLocation.lng)
    : null;

  return (
    <div className="bg-slate-100 min-h-screen">
      {/* Dynamic Header */}
      <div className="h-64 bg-gradient-to-br from-primary-600 via-primary-500 to-rose-400 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-black opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        
        {isOwnProfile && (
          <div className="absolute top-0 inset-x-0 p-4 flex justify-end z-10">
             <button 
               onClick={handleLogout}
               className="p-3 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/30 transition-all active:scale-95 shadow-lg"
               title="Logout"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        )}
      </div>

      {/* Main Content Container */}
      <div className="px-4 -mt-20 max-w-md mx-auto relative z-10 pb-6">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100/50">
          
          {/* Header Info */}
          <div className="pt-20 pb-8 px-6 relative text-center">
            {/* Floating Avatar */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2">
              <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-xl bg-slate-50 overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-500 text-3xl font-bold">
                     {profile.displayName.charAt(0).toUpperCase()}
                   </div>
                )}
              </div>
              {/* Online Indicator (Fake for now or based on recent activity if we had it) */}
              <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{profile.displayName}</h1>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-500 font-medium">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span>{profile.lastLocation?.name || "Unknown Location"}</span>
            </div>
            
            {!isOwnProfile && distance && (
              <div className="flex items-center justify-center gap-1.5 mt-1 text-primary-600 font-bold text-sm bg-primary-50 inline-flex px-3 py-1 rounded-full mx-auto mt-3">
                <Navigation className="w-3 h-3 fill-current" />
                <span>{distance} away</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center mt-6">
              {profile.instagramHandle && (
                <a 
                  href={`https://instagram.com/${profile.instagramHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-pink-50 text-pink-600 rounded-2xl font-semibold text-sm hover:bg-pink-100 transition-colors active:scale-95"
                >
                  <Instagram className="w-5 h-5" />
                  Instagram
                </a>
              )}
              {isOwnProfile && (
                <button 
                  onClick={() => navigate('/edit-profile')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-colors active:scale-95"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 mx-6" />

          {/* Bio Section */}
          <div className="p-6">
             <div className="flex items-center gap-2 mb-3">
               <Sparkles className="w-5 h-5 text-yellow-500" />
               <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">About Me</h2>
             </div>
             <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap font-medium">
               {profile.bio || "No bio yet."}
             </p>
          </div>

          <div className="h-px bg-slate-100 mx-6" />

          {/* Interests Section */}
          <div className="p-6 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2.5">
              {(profile.interests || []).map(interestId => {
                const tagInfo = POPULAR_INTERESTS.find(i => i.id === interestId);
                return (
                  <span 
                    key={interestId} 
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-200 shadow-sm"
                  >
                    {tagInfo ? (
                      <>
                        <span className="mr-2 text-lg">{tagInfo.emoji}</span>
                        {tagInfo.label}
                      </>
                    ) : (
                      interestId
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* POSTS SECTION */}
        <div className="mt-8 mb-4">
           <h2 className="text-xl font-bold text-slate-900 px-2 mb-4">{isOwnProfile ? "My Posts" : "Posts"}</h2>
           {myPosts.length === 0 ? (
             <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                   <Edit2 className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">No posts yet.</p>
                {isOwnProfile && (
                  <button 
                    onClick={() => navigate('/create-post')}
                    className="mt-4 text-primary-500 font-bold text-sm hover:underline"
                  >
                    Create your first post
                  </button>
                )}
             </div>
           ) : (
             <div className="space-y-6">
               {myPosts.map((post) => (
                 <PostItem
                   key={post._id}
                   post={post}
                   currentUserId={user?.uid}
                   onLike={handleLike}
                   onAddComment={handleAddComment}
                   onDelete={isOwnProfile ? handleDeletePost : undefined}
                   onEdit={isOwnProfile ? handleEditPost : undefined}
                 />
               ))}
             </div>
           )}
        </div>

        <div className="text-center mt-12 pb-6">
           <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Socially v1.1</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;