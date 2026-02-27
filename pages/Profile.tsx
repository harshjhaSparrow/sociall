import {
  Ban,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Edit2,
  Eye,
  Flag,
  Instagram,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MoreVertical,
  Navigation,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserLocation } from "../components/LocationGuard";
import PostItem from "../components/PostItem";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { POPULAR_INTERESTS, Post, UserProfile } from "../types";
import { calculateDistance } from "../util/location";
import ConfirmModal from "../components/ui/ConfirmModal";

export default function Profile() {
  const { user, logout } = useAuth();
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { location: myLocation } = useUserLocation();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("regular"); // "regular" or "meetup"
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const filteredPosts = myPosts?.filter((post) => post?.type === activeTab);
  console.log("myPosts", myPosts);

  // Location Name State
  const [locationName, setLocationName] = useState<string>("Unknown Location");

  // Friend System State
  const [friendRequests, setFriendRequests] = useState<UserProfile[]>([]);
  const [relationship, setRelationship] = useState<
    "self" | "friend" | "sent" | "received" | "none"
  >("none");
  const [actionLoading, setActionLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Request Message State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  // Friends List Modal State
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendsList, setFriendsList] = useState<UserProfile[]>([]);
  const [sentRequestsList, setSentRequestsList] = useState<UserProfile[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Viewers State
  const [viewers, setViewers] = useState<
    (UserProfile & { viewedAt: number })[]
  >([]);
  const [isViewersModalOpen, setIsViewersModalOpen] = useState(false);
  const [viewersLoading, setViewersLoading] = useState(false);

  // Menu State
  const [showMenu, setShowMenu] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const isOwnProfile = !uid || (user && user?.uid === uid);
  const targetUid = uid || user?.uid;

  useEffect(() => {
    const fetchData = async () => {
      if (targetUid) {
        try {
          const userProfile = await api.profile.get(targetUid);

          if (userProfile) {
            // Check if blocked
            if (user && userProfile?.blockedUsers?.includes(user?.uid)) {
              // They blocked me (server usually filters this, but just in case)
              navigate("/");
              return;
            }

            if (user && user?.uid !== targetUid) {
              // Check if I blocked them
              const myProfile = await api.profile.get(user?.uid);
              if (myProfile?.blockedUsers?.includes(targetUid)) {
                setIsBlocked(true);
                setProfile({
                  ...userProfile,
                  bio: "",
                  photoURL: "",
                  displayName: "Blocked User",
                }); // Mask data
                setLoading(false);
                return;
              }
            }

            setProfile(userProfile);

            if (
              isOwnProfile &&
              userProfile?.incomingRequests &&
              userProfile?.incomingRequests?.length > 0
            ) {
              const reqs = await api.profile.getBatch(
                userProfile?.incomingRequests,
              );
              setFriendRequests(reqs);
            }

            if (!isOwnProfile && user) {
              const myUid = user?.uid;
              if (userProfile?.friends?.includes(myUid)) {
                setRelationship("friend");
              } else if (userProfile?.incomingRequests?.includes(myUid)) {
                setRelationship("sent");
              } else if (userProfile?.outgoingRequests?.includes(myUid)) {
                setRelationship("received");
              } else {
                setRelationship("none");
              }
            } else {
              setRelationship("self");
            }

            // Only fetch posts if not blocked
            const posts = await api.posts.getUserPosts(targetUid);
            console.log("postsposts", posts);
            setMyPosts(posts);

            // Record profile view if not own profile
            if (!isOwnProfile && user && targetUid) {
              api.profile.recordView(user?.uid, targetUid);
            }
          } else if (isOwnProfile) {
            navigate("/onboarding");
            return;
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [targetUid, isOwnProfile, navigate, user]);

  // Fetch viewers if own profile
  useEffect(() => {
    if (isOwnProfile && user) {
      setViewersLoading(true);
      api.profile
        .getViewers(user.uid)
        .then(setViewers)
        .catch(console.error)
        .finally(() => setViewersLoading(false));
    }
  }, [isOwnProfile, user]);

  // Effect to determine Location Name
  useEffect(() => {
    if (profile?.lastLocation) {
      if (
        profile?.lastLocation?.name &&
        profile?.lastLocation?.name !== "Unknown Location"
      ) {
        setLocationName(profile?.lastLocation?.name);
      } else if (profile?.lastLocation?.lat && profile?.lastLocation?.lng) {
        // Fallback: Fetch name using lat/lng
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${profile.lastLocation.lat}&lon=${profile.lastLocation.lng}`,
        )
          .then((res) => res.json())
          .then((data) => {
            const addr = data.address;
            const city =
              addr?.city || addr?.town || addr?.village || addr?.county;
            const state = addr?.state;
            const country = addr?.country;

            let name = "Unknown Location";
            if (city) {
              name = state ? `${city}, ${state}` : `${city}, ${country || ""}`;
            } else if (state) {
              name = `${state}, ${country || ""}`;
            } else if (country) {
              name = country;
            }

            // Clean up trailing commas/spaces
            name = name.replace(/,\s*$/, "");
            setLocationName(name);
          })
          .catch((err) => console.warn("Failed to fetch location name", err));
      }
    } else {
      setLocationName("Unknown Location");
    }
  }, [profile]);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    type: "removeFriend" | "blockUser" | "deletePost" | null;
    payload?: any;
  }>({ open: false, type: null });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSendRequest = async () => {
    if (!user || !profile) return;
    setActionLoading(true);
    try {
      await api.friends.sendRequest(user?.uid, profile?.uid, requestMessage);
      setRelationship("sent");
      setShowRequestModal(false);
      setRequestMessage("");
    } catch (e) {
      console.error(e);
    }
    setActionLoading(false);
  };

  const handleAcceptRequest = async (requesterUid: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.friends.acceptRequest(user?.uid, requesterUid);
      if (isOwnProfile) {
        setFriendRequests((prev) =>
          prev.filter((r) => r?.uid !== requesterUid),
        );
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                incomingRequests: prev?.incomingRequests?.filter(
                  (id) => id !== requesterUid,
                ),
                friends: [...(prev?.friends || []), requesterUid],
                friendRequestMessages: {
                  ...prev?.friendRequestMessages,
                  [requesterUid]: undefined,
                } as any,
              }
            : null,
        );
      } else {
        setRelationship("friend");
      }
    } catch (e) {
      console.error(e);
    }
    setActionLoading(false);
  };

  const handleRejectRequest = async (requesterUid: string) => {
    if (!user) return;
    try {
      await api.friends.rejectRequest(user?.uid, requesterUid);
      if (isOwnProfile) {
        setFriendRequests((prev) =>
          prev.filter((r) => r?.uid !== requesterUid),
        );
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                incomingRequests: prev?.incomingRequests?.filter(
                  (id) => id !== requesterUid,
                ),
                friendRequestMessages: {
                  ...prev?.friendRequestMessages,
                  [requesterUid]: undefined,
                } as any,
              }
            : null,
        );
      } else {
        setRelationship("none");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFriend = () => {
    if (!user || !profile) return;
    setConfirmState({ open: true, type: "removeFriend" });
  };

  const handleBlockUser = () => {
    if (!user || !profile) return;
    setConfirmState({ open: true, type: "blockUser" });
    setShowMenu(false);
  };

  const handleUnblockUser = async () => {
    if (!user || !targetUid) return;
    try {
      await api.userAction.unblock(user?.uid, targetUid);
      window.location.reload(); // Reload to fetch fresh data
    } catch (e) {
      alert("Failed to unblock user");
    }
  };

  const handleSubmitReport = async () => {
    if (!user || !profile) return;
    try {
      await api.userAction.report(user?.uid, profile?.uid, reportReason);
      alert("Report submitted. We will review this user.");
      setReportModalOpen(false);
      setShowMenu(false);
    } catch (e) {
      alert("Failed to submit report");
    }
  };

  const handleOpenFriendsList = async () => {
    if (!profile) return;
    setIsFriendsModalOpen(true);
    setFriendsLoading(true);
    try {
      const friendsIds = profile?.friends || [];
      const friendsData = await api.profile.getBatch(friendsIds);
      setFriendsList(friendsData);

      if (isOwnProfile) {
        const pendingIds = profile?.outgoingRequests || [];
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
    if (!user || !post?._id) return;
    const isLiked = post?.likedBy?.includes(user?.uid);
    const newLikes = isLiked ? post?.likes - 1 : post?.likes + 1;
    const newLikedBy = isLiked
      ? post?.likedBy?.filter((id) => id !== user?.uid) || []
      : [...(post?.likedBy || []), user?.uid];

    setMyPosts((currentPosts) =>
      currentPosts.map((p) =>
        p?._id === post?._id
          ? { ...p, likes: newLikes, likedBy: newLikedBy }
          : p,
      ),
    );

    try {
      const updatedData = await api.posts.toggleLike(post?._id, user?.uid);
      setMyPosts((currentPosts) =>
        currentPosts.map((p) =>
          p?._id === post?._id
            ? { ...p, likes: updatedData?.likes, likedBy: updatedData?.likedBy }
            : p,
        ),
      );
    } catch (error) {
      setMyPosts((currentPosts) =>
        currentPosts.map((p) => (p._id === post._id ? post : p)),
      );
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!user) return;
    try {
      const newComment = await api.posts.addComment(postId, user?.uid, text);
      setMyPosts((currentPosts) =>
        currentPosts.map((p) => {
          if (p?._id === postId) {
            return {
              ...p,
              comments: [...(p?.comments || []), newComment],
            };
          }
          return p;
        }),
      );
    } catch (error) {
      console.error("Failed to add comment", error);
      throw error;
    }
  };

  const handleDeletePost = (postId: string) => {
    if (!user) return;
    setConfirmState({ open: true, type: "deletePost", payload: postId });
  };

  const handleConfirmAction = async () => {
    if (!user || !confirmState?.type) return;

    setActionLoading(true);

    try {
      if (confirmState?.type === "removeFriend" && profile) {
        await api.friends.removeFriend(user?.uid, profile?.uid);
        setRelationship("none");
      }

      if (confirmState?.type === "blockUser" && profile) {
        await api.userAction.block(user?.uid, profile?.uid);
        setIsBlocked(true);
      }

      if (confirmState?.type === "deletePost") {
        await api.posts.deletePost(confirmState?.payload, user?.uid);
        setMyPosts((prev) =>
          prev.filter((p) => p?._id !== confirmState?.payload),
        );
      }
    } catch (e) {
      console.error(e);
    }

    setActionLoading(false);
    setConfirmState({ open: false, type: null });
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

  if (!profile)
    return <div className="p-8 text-center text-slate-400">User not found</div>;

  // If blocked, show limited view
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
          <Ban className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          You blocked this user
        </h1>
        <p className="text-slate-400 mb-6 max-w-xs">
          You won't see their posts or profile details, and they won't see
          yours.
        </p>
        <button
          onClick={handleUnblockUser}
          className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          Unblock User
        </button>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-slate-500 hover:text-white"
        >
          Go Home
        </button>
      </div>
    );
  }

  const distance =
    profile?.lastLocation && myLocation
      ? calculateDistance(
          myLocation?.lat,
          myLocation?.lng,
          profile?.lastLocation?.lat,
          profile?.lastLocation?.lng,
        )
      : null;

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Dynamic Header */}
      <div className="h-64 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-900/40 via-purple-900/20 to-slate-950 opacity-60"></div>

        {/* Top Actions */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between z-10">
          <div className="w-10"></div> {/* Spacer */}
          <div className="flex gap-3">
            {!isOwnProfile && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-3 bg-slate-900/50 backdrop-blur-md text-white rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-lg border border-slate-700"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-12 w-40 bg-slate-900 rounded-xl shadow-xl border border-slate-800 py-1 overflow-hidden animate-slide-up z-50">
                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="w-full text-left px-4 py-3 text-sm text-yellow-400 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" /> Report
                    </button>
                    <button
                      onClick={handleBlockUser}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4" /> Block
                    </button>
                  </div>
                )}
              </div>
            )}
            {isOwnProfile && (
              <button
                onClick={handleLogout}
                className="p-3 bg-slate-900/50 backdrop-blur-md text-white rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-lg border border-slate-700"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-4 -mt-20 max-w-md mx-auto relative z-10 pb-6">
        <div className="bg-slate-900 rounded-[2rem] shadow-2xl shadow-black/50 border border-slate-800 relative">
          {/* Header Info */}
          <div className="pt-20 pb-8 px-6 relative text-center">
            {/* Floating Avatar */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2">
              <div className="w-32 h-32 rounded-full border-[6px] border-slate-900 shadow-xl bg-slate-800 overflow-hidden">
                {profile?.photoURL ? (
                  <img
                    draggable={false}
                    src={profile?.photoURL}
                    alt={profile?.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-primary-500 text-3xl font-bold">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Online Indicator */}
              <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-slate-900"></div>
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight">
              {profile?.displayName}
            </h1>

            {/* Location & Job */}
            <div className="flex flex-col items-center gap-1 mt-2">
              {profile?.jobRole && (
                <div className="flex items-center gap-1.5 text-slate-300 font-medium text-sm">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{profile?.jobRole}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-400 font-medium text-sm">
                <MapPin className="w-3.5 h-3.5 text-primary-500" />
                <span>{locationName}</span>
              </div>
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
                <span className="font-bold text-white">
                  {profile?.friends?.length || 0}
                </span>
                <span className="text-slate-400 text-sm">Friends</span>
              </button>

              {isOwnProfile && (
                <button
                  onClick={() => setIsViewersModalOpen(true)}
                  className="bg-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-700 hover:bg-slate-700 transition-colors active:scale-95 group"
                >
                  <Eye className="w-4 h-4 text-slate-400 group-hover:text-primary-400 transition-colors" />
                  <span className="font-bold text-white">
                    {viewers?.length}
                  </span>
                  <span className="text-slate-400 text-sm">Views</span>
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              {profile?.instagramHandle && (
                <a
                  href={`https://instagram.com/${profile?.instagramHandle}`}
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
                  onClick={() => navigate("/edit-profile")}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 text-slate-200 rounded-2xl font-semibold text-sm hover:bg-slate-700 transition-colors active:scale-95 border border-slate-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <>
                  {relationship === "none" && (
                    <button
                      onClick={() => setShowRequestModal(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-semibold text-sm hover:bg-primary-500 transition-colors active:scale-95 shadow-lg shadow-primary-500/20"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserPlus className="w-5 h-5" />
                      )}
                      Add Friend
                    </button>
                  )}
                  {relationship === "sent" && (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 text-slate-500 rounded-2xl font-semibold text-sm border border-slate-700"
                    >
                      <Clock className="w-5 h-5" />
                      Request Sent
                    </button>
                  )}
                  {relationship === "received" && (
                    <button
                      onClick={() => handleAcceptRequest(profile?.uid)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-2xl font-semibold text-sm hover:bg-green-500 transition-colors active:scale-95 shadow-lg shadow-green-500/20"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                      Accept Request
                    </button>
                  )}
                  {relationship === "friend" && (
                    <>
                      <button
                        onClick={handleRemoveFriend}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-transparent border-2 border-primary-500 text-primary-400 rounded-2xl font-semibold text-sm hover:bg-primary-500/10 transition-colors"
                      >
                        <Check className="w-5 h-5" />
                        Friends
                      </button>
                      <button
                        onClick={() => navigate(`/chat/${profile?.uid}`)}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-semibold text-sm hover:bg-blue-500 transition-colors active:scale-95 shadow-lg shadow-blue-500/20"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Message
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-800 mx-6" />

          {/* Friend Requests (Only visible on own profile) */}
          {isOwnProfile && friendRequests?.length > 0 && (
            <div className="p-6 bg-orange-500/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <h2 className="text-sm font-bold text-orange-200 uppercase tracking-wider">
                  Friend Requests
                </h2>
              </div>
              <div className="space-y-3">
                {friendRequests.map((reqUser) => {
                  const requestMsg =
                    profile?.friendRequestMessages?.[reqUser?.uid];
                  return (
                    <div
                      key={reqUser?.uid}
                      className="bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => navigate(`/profile/${reqUser?.uid}`)}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                            {reqUser?.photoURL ? (
                              <img
                                draggable={false}
                                src={reqUser?.photoURL}
                                alt={reqUser?.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                {reqUser?.displayName?.[0]}
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-white text-sm">
                            {reqUser?.displayName}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(reqUser?.uid)}
                            className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectRequest(reqUser?.uid)}
                            className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {requestMsg && (
                        <div className="mt-2 bg-slate-800/50 p-2 rounded-xl text-xs text-slate-300 italic border border-slate-800/50 flex items-start gap-2">
                          <Mail className="w-3 h-3 mt-0.5 text-slate-500" />
                          <span>"{requestMsg}"</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="h-px bg-slate-800 mt-6" />
            </div>
          )}

          {/* Bio Section */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                About Me
              </h2>
            </div>
            <p className="text-slate-400 text-base leading-relaxed whitespace-pre-wrap font-medium">
              {profile?.bio || "No bio yet."}
            </p>
          </div>

          <div className="h-px bg-slate-800 mx-6" />

          {/* Interests Section */}
          <div className="p-6 bg-slate-900/50 rounded-b-[2rem]">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {(profile.interests || []).map((interestId) => {
                const tagInfo = POPULAR_INTERESTS.find(
                  (i) => i?.id === interestId,
                );
                return (
                  <span
                    key={interestId}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-700 shadow-sm"
                  >
                    {tagInfo ? (
                      <>
                        <span className="mr-2 text-lg">{tagInfo?.emoji}</span>
                        {tagInfo?.label}
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
          <div className="flex items-center justify-between px-2 mb-4">
            <h2 className="text-xl font-bold text-white">
              {isOwnProfile ? "My Posts" : "Posts"}
            </h2>

            {/* Tabs Navigation */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {["regular", "meetup"].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === type
                      ? "bg-primary-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          {filteredPosts?.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl p-8 text-center border border-slate-800">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit2 className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">
                No {activeTab} posts yet
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate("/create-post")}
                  className="mt-4 text-primary-500 font-bold hover:text-primary-400 text-sm"
                >
                  Create {activeTab === "meetup" ? "a meetup" : "a post"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <PostItem
                  key={post?._id}
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

        {/* Send Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowRequestModal(false)}
            ></div>
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6 border border-slate-800 animate-slide-up">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-500" /> Add Friend
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Add a message to introduce yourself (optional).
              </p>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-primary-500 mb-4 h-24 resize-none placeholder-slate-500"
                placeholder="Hi! I saw we have similar interests..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e?.target?.value)}
              ></textarea>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-slate-400 font-medium text-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendRequest}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Request"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setReportModalOpen(false)}
            ></div>
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl relative z-10 p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-yellow-500" /> Report User
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Why are you reporting this user?
              </p>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-primary-500 mb-4 h-24 resize-none"
                placeholder="e.g. Inappropriate behavior, spam..."
                value={reportReason}
                onChange={(e) => setReportReason(e?.target?.value)}
              ></textarea>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 text-slate-400 font-medium text-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-500 disabled:opacity-50"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Friends List Modal */}
        {isFriendsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFriendsModalOpen(false)}
            ></div>
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[80vh] animate-slide-up border border-slate-800">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-xl text-white">Friends</h3>
                <button
                  onClick={() => setIsFriendsModalOpen(false)}
                  className="p-2 -mr-2 text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-4 flex-1 no-scrollbar">
                {friendsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Sent Requests Section (Only Own Profile) */}
                    {isOwnProfile && sentRequestsList?.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                          Pending Requests
                        </h4>
                        <div className="space-y-2">
                          {sentRequestsList.map((friend) => (
                            <div
                              key={friend?.uid}
                              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-800 opacity-75"
                            >
                              <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0">
                                {friend?.photoURL ? (
                                  <img
                                    draggable={false}
                                    src={friend?.photoURL}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                    {friend?.displayName?.[0]}
                                  </div>
                                )}
                              </div>
                              <span className="text-slate-300 font-bold text-sm flex-1">
                                {friend?.displayName}
                              </span>
                              <span className="text-xs text-slate-500 italic">
                                Sent
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Friends List */}
                    {friendsList?.length === 0 ? (
                      <div className="text-center py-10 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No friends yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {friendsList.map((friend) => (
                          <div
                            key={friend?.uid}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
                            onClick={() => {
                              setIsFriendsModalOpen(false);
                              navigate(`/profile/${friend?.uid}`);
                            }}
                          >
                            <div className="w-12 h-12 rounded-full bg-slate-900 overflow-hidden shrink-0 border border-slate-600">
                              {friend?.photoURL ? (
                                <img
                                  draggable={false}
                                  src={friend?.photoURL}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                  {friend?.displayName?.[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-base truncate">
                                {friend?.displayName}
                              </h4>
                              <p className="text-xs text-slate-400 truncate">
                                {friend?.bio || "No bio"}
                              </p>
                            </div>

                            {isOwnProfile ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsFriendsModalOpen(false);
                                  navigate(`/chat/${friend?.uid}`);
                                }}
                                className="p-2.5 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all active:scale-95 z-10"
                              >
                                <MessageCircle className="w-5 h-5 fill-current" />
                              </button>
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Viewers List Modal */}
        {isViewersModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsViewersModalOpen(false)}
            ></div>
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[80vh] animate-slide-up border border-slate-800">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-xl text-white">Profile Views</h3>
                <button
                  onClick={() => setIsViewersModalOpen(false)}
                  className="p-2 -mr-2 text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-4 flex-1 no-scrollbar">
                {viewersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                ) : viewers?.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No views yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viewers.map((viewer, index) => (
                      <div
                        key={`${viewer?.uid}-${index}`}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors"
                        onClick={() => {
                          setIsViewersModalOpen(false);
                          navigate(`/profile/${viewer?.uid}`);
                        }}
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-900 overflow-hidden shrink-0 border border-slate-600">
                          {viewer?.photoURL ? (
                            <img
                              draggable={false}
                              src={viewer?.photoURL}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                              {viewer?.displayName?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-base truncate">
                            {viewer?.displayName}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">
                            {new Date(viewer.viewedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmState?.open}
        onClose={() => setConfirmState({ open: false, type: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmState?.type === "removeFriend"
            ? "Remove Friend"
            : confirmState?.type === "blockUser"
              ? "Block User"
              : "Delete Post"
        }
        description={
          confirmState?.type === "removeFriend"
            ? "You will no longer be friends."
            : confirmState?.type === "blockUser"
              ? "You won't see each other on the map or feed."
              : "This post will be permanently deleted."
        }
        confirmText={
          confirmState?.type === "deletePost"
            ? "Delete"
            : confirmState?.type === "blockUser"
              ? "Block"
              : "Remove"
        }
        danger={
          confirmState?.type === "deletePost" ||
          confirmState?.type === "blockUser"
        }
      />
    </div>
  );
}
