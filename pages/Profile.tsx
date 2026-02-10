import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile, POPULAR_INTERESTS, Post } from '../types';
import { LogOut, Instagram, MapPin, Edit2, Loader2, Sparkles, Navigation, UserPlus, Check, X, Clock, UserCheck, Users, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import PostItem from '../components/PostItem';
import { useUserLocation } from '../components/LocationGuard';
import { calculateDistance } from '@/util/location';


const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { location: myLocation } = useUserLocation();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  
  // Friend System State
  const [friendRequests, setFriendRequests] = useState<UserProfile[]>([]);
  const [relationship, setRelationship] = useState<'self' | 'friend' | 'sent' | 'received' | 'none'>('none');
  const [actionLoading, setActionLoading] = useState(false);

  // Friends List Modal State
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState<UserProfile[]>([]);
  const [sentRequestsList, setSentRequestsList] = useState<UserProfile[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  const isOwnProfile = !uid || (user && user.uid === uid);
  const targetUid = uid || user?.uid;

  useEffect(() => {
    const fetchData = async () => {
      if (targetUid) {
        try {
          const userProfile = await api.profile.get(targetUid);
          if (userProfile) {
            setProfile(userProfile);
            
            if (isOwnProfile && userProfile.incomingRequests && userProfile.incomingRequests.length > 0) {
                 const reqs = await api.profile.getBatch(userProfile.incomingRequests);
                 setFriendRequests(reqs);
            }

            if (!isOwnProfile && user) {
                const myUid = user.uid;
                if (userProfile.friends?.includes(myUid)) {
                    setRelationship('friend');
                } else if (userProfile.incomingRequests?.includes(myUid)) {
                    setRelationship('sent');
                } else if (userProfile.outgoingRequests?.includes(myUid)) {
                    setRelationship('received');
                } else {
                    setRelationship('none');
                }
            } else {
                setRelationship('self');
            }

          } else if (isOwnProfile) {
            navigate('/onboarding');
            return;
          }

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
  }, [targetUid, isOwnProfile, navigate, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSendRequest = async () => {
      if (!user || !profile) return;
      setActionLoading(true);
      try {
          await api.friends.sendRequest(user.uid, profile.uid);
          setRelationship('sent');
      } catch (e) { console.error(e); }
      setActionLoading(false);
  };

  const handleAcceptRequest = async (requesterUid: string) => {
      if (!user) return;
      setActionLoading(true);
      try {
          await api.friends.acceptRequest(user.uid, requesterUid);
          if (isOwnProfile) {
              setFriendRequests(prev => prev.filter(r => r.uid !== requesterUid));
              setProfile(prev => prev ? ({
                  ...prev,
                  incomingRequests: prev.incomingRequests?.filter(id => id !== requesterUid),
                  friends: [...(prev.friends || []), requesterUid]
              }) : null);
          } else {
              setRelationship('friend');
          }
      } catch (e) { console.error(e); }
      setActionLoading(false);
  };

  const handleRejectRequest = async (requesterUid: string) => {
      if (!user) return;
      try {
          await api.friends.rejectRequest(user.uid, requesterUid);
          if (isOwnProfile) {
              setFriendRequests(prev => prev.filter(r => r.uid !== requesterUid));
              setProfile(prev => prev ? ({
                  ...prev,
                  incomingRequests: prev.incomingRequests?.filter(id => id !== requesterUid)
              }) : null);
          } else {
              setRelationship('none'); 
          }
      } catch (e) { console.error(e); }
  };

  const handleRemoveFriend = async () => {
      if (!user || !profile || !confirm("Remove friend?")) return;
      setActionLoading(true);
      try {
          await api.friends.removeFriend(user.uid, profile.uid);
          setRelationship('none');
      } catch (e) { console.error(e); }
      setActionLoading(false);
  };

  const handleOpenFriendsList = async () => {
    if (!profile) return;
    setIsFriendsModalOpen(true);
    setFriendsLoading(true);
    try {
      const friendsIds = profile.friends || [];
      const friendsData = await api.profile.getBatch(friendsIds);
      setFriendsList(friendsData);

      if (isOwnProfile) {
        const pendingIds = profile.outgoingRequests || [];
        const pendingData = await api.profile.getBatch(pendingIds);
        setSentRequestsList(pendingData);
      }
    } catch (e) {
      console.error("Failed to load friends", e);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!user || !post._id) return;
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
    <div className="p-8 text-center text-slate-400">User not found</div>
  );

  const distance = (profile.lastLocation && myLocation) 
    ? calculateDistance(myLocation.lat, myLocation.lng, profile.lastLocation.lat, profile.lastLocation.lng)
    : null;

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Dynamic Header */}
      <div className="h-64 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-900/40 via-purple-900/20 to-slate-950 opacity-60"></div>
        
        {isOwnProfile && (
          <div className="absolute top-0 inset-x-0 p-4 flex justify-end z-10">
             <button 
               onClick={handleLogout}
               className="p-3 bg-slate-900/50 backdrop-blur-md text-white rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-lg border border-slate-700"
               title="Logout"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        )}
      </div>

      {/* Main Content Container */}
      <div className="px-4 -mt-20 max-w-md mx-auto relative z-10 pb-6">
        <div className="bg-slate-900 rounded-[2rem] shadow-2xl shadow-black/50 overflow-hidden border border-slate-800">
          
          {/* Header Info */}
          <div className="pt-20 pb-8 px-6 relative text-center">
            {/* Floating Avatar */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2">
              <div className="w-32 h-32 rounded-full border-[6px] border-slate-900 shadow-xl bg-slate-800 overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-slate-800 text-primary-500 text-3xl font-bold">
                     {profile.displayName.charAt(0).toUpperCase()}
                   </div>
                )}
              </div>
              {/* Online Indicator */}
              <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-slate-900"></div>
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight">{profile.displayName}</h1>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-400 font-medium">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span>{profile.lastLocation?.name || "Unknown Location"}</span>
            </div>
            
            {!isOwnProfile && distance && (
              <div className="flex items-center justify-center gap-1.5 mt-1 text-primary-400 font-bold text-sm bg-primary-500/10 inline-flex px-3 py-1 rounded-full mx-auto mt-3 border border-primary-500/20">
                <Navigation className="w-3 h-3 fill-current" />
                <span>{distance} away</span>
              </div>
            )}
            
            {/* Friend Stats (Clickable) */}
            <div className="flex justify-center mt-4">
                <button 
                    onClick={handleOpenFriendsList}
                    className="bg-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700 hover:bg-slate-700 transition-colors active:scale-95 group"
                >
                    <Users className="w-4 h-4 text-slate-400 group-hover:text-primary-400 transition-colors" />
                    <span className="font-bold text-white">{profile.friends?.length || 0}</span>
                    <span className="text-slate-400 text-sm">Friends</span>
                </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              {profile.instagramHandle && (
                <a 
                  href={`https://instagram.com/${profile.instagramHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-pink-500/10 text-pink-400 rounded-2xl font-semibold text-sm hover:bg-pink-500/20 transition-colors active:scale-95 border border-pink-500/20"
                >
                  <Instagram className="w-5 h-5" />
                  Instagram
                </a>
              )}
              
              {isOwnProfile ? (
                <button 
                  onClick={() => navigate('/edit-profile')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 text-slate-200 rounded-2xl font-semibold text-sm hover:bg-slate-700 transition-colors active:scale-95 border border-slate-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                 <>
                   {relationship === 'none' && (
                       <button 
                         onClick={handleSendRequest}
                         disabled={actionLoading}
                         className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-semibold text-sm hover:bg-primary-500 transition-colors active:scale-95 shadow-lg shadow-primary-500/20"
                       >
                         {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                         Add Friend
                       </button>
                   )}
                   {relationship === 'sent' && (
                       <button disabled className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 text-slate-500 rounded-2xl font-semibold text-sm border border-slate-700">
                         <Clock className="w-5 h-5" />
                         Request Sent
                       </button>
                   )}
                   {relationship === 'received' && (
                        <button 
                          onClick={() => handleAcceptRequest(profile.uid)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-2xl font-semibold text-sm hover:bg-green-500 transition-colors active:scale-95 shadow-lg shadow-green-500/20"
                        >
                          {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                          Accept Request
                        </button>
                   )}
                   {relationship === 'friend' && (
                       <button 
                         onClick={handleRemoveFriend}
                         disabled={actionLoading}
                         className="inline-flex items-center gap-2 px-5 py-3 bg-transparent border-2 border-primary-500 text-primary-400 rounded-2xl font-semibold text-sm hover:bg-primary-500/10 transition-colors"
                       >
                         <Check className="w-5 h-5" />
                         Friends
                       </button>
                   )}
                 </>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-800 mx-6" />

          {/* Friend Requests (Only visible on own profile) */}
          {isOwnProfile && friendRequests.length > 0 && (
             <div className="p-6 bg-orange-500/10">
                 <div className="flex items-center gap-2 mb-4">
                     <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                     <h2 className="text-sm font-bold text-orange-200 uppercase tracking-wider">Friend Requests</h2>
                 </div>
                 <div className="space-y-3">
                     {friendRequests.map(reqUser => (
                         <div key={reqUser.uid} className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-800">
                             <div 
                               className="flex items-center gap-3 cursor-pointer"
                               onClick={() => navigate(`/profile/${reqUser.uid}`)}
                             >
                                 <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                                     {reqUser.photoURL ? (
                                         <img src={reqUser.photoURL} alt={reqUser.displayName} className="w-full h-full object-cover" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{reqUser.displayName[0]}</div>
                                     )}
                                 </div>
                                 <span className="font-bold text-white text-sm">{reqUser.displayName}</span>
                             </div>
                             <div className="flex gap-2">
                                 <button 
                                   onClick={() => handleAcceptRequest(reqUser.uid)}
                                   className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                                 >
                                     <Check className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => handleRejectRequest(reqUser.uid)}
                                   className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-colors"
                                 >
                                     <X className="w-4 h-4" />
                                 </button>
                             </div>
                         </div>
                     ))}
                 </div>
                 <div className="h-px bg-slate-800 mt-6" />
             </div>
          )}

          {/* Bio Section */}
          <div className="p-6">
             <div className="flex items-center gap-2 mb-3">
               <Sparkles className="w-5 h-5 text-yellow-500" />
               <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">About Me</h2>
             </div>
             <p className="text-slate-400 text-base leading-relaxed whitespace-pre-wrap font-medium">
               {profile.bio || "No bio yet."}
             </p>
          </div>

          <div className="h-px bg-slate-800 mx-6" />

          {/* Interests Section */}
          <div className="p-6 bg-slate-900/50">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2.5">
              {(profile.interests || []).map(interestId => {
                const tagInfo = POPULAR_INTERESTS.find(i => i.id === interestId);
                return (
                  <span 
                    key={interestId} 
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-700 shadow-sm"
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
           <h2 className="text-xl font-bold text-white px-2 mb-4">{isOwnProfile ? "My Posts" : "Posts"}</h2>
           {myPosts.length === 0 ? (
             <div className="bg-slate-900 rounded-3xl p-8 text-center border border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                   <Edit2 className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">No posts yet.</p>
                {isOwnProfile && (
                  <button 
                    onClick={() => navigate('/create-post')}
                    className="mt-4 text-primary-400 font-bold text-sm hover:text-primary-300"
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
           <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest">Socially v2.0</p>
        </div>
      </div>
      
      {/* Friends List Modal */}
      {isFriendsModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-fade-in">
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             onClick={() => setIsFriendsModalOpen(false)}
           />
           <div className="bg-slate-900 rounded-3xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-2xl relative z-10 animate-slide-up overflow-hidden border border-slate-800">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                 <h3 className="font-bold text-white text-lg">Connections</h3>
                 <button onClick={() => setIsFriendsModalOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 {friendsLoading ? (
                   <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
                 ) : (
                   <>
                     {isOwnProfile && sentRequestsList.length > 0 && (
                       <div>
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Pending Requests (Sent)</h4>
                         <div className="space-y-2">
                           {sentRequestsList.map(u => (
                             <div key={u.uid} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
                                   {u.photoURL ? (
                                     <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                   ) : (
                                     <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{u.displayName[0]}</div>
                                   )}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="font-bold text-white text-sm truncate">{u.displayName}</div>
                                   <div className="text-xs text-slate-500">Request Sent</div>
                                </div>
                                <Clock className="w-4 h-4 text-slate-500" />
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     <div>
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Friends ({friendsList.length})</h4>
                       {friendsList.length === 0 ? (
                         <div className="text-center py-8 text-slate-500 text-sm bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
                           No friends yet.
                         </div>
                       ) : (
                         <div className="space-y-2">
                           {friendsList.map(u => (
                             <div 
                               key={u.uid} 
                               onClick={() => {
                                 setIsFriendsModalOpen(false);
                                 navigate(`/profile/${u.uid}`);
                               }}
                               className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group"
                             >
                                <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                   {u.photoURL ? (
                                     <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                                   ) : (
                                     <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{u.displayName[0]}</div>
                                   )}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="font-bold text-white truncate group-hover:text-primary-400 transition-colors">{u.displayName}</div>
                                   <div className="text-xs text-slate-500 truncate">{u.bio || "Socially user"}</div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   </>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Profile;