import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile, POPULAR_INTERESTS } from '../types';
import { LogOut, Instagram, MapPin, Edit2, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const userProfile = await api.profile.get(user.uid);
          if (userProfile) {
            setProfile(userProfile);
          } else {
            navigate('/onboarding');
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      {/* Dynamic Header */}
      <div className="h-64 bg-gradient-to-br from-primary-600 via-primary-500 to-rose-400 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-black opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="absolute top-0 inset-x-0 p-4 flex justify-end z-10">
           <button 
             onClick={handleLogout}
             className="p-3 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/30 transition-all active:scale-95 shadow-lg"
             title="Logout"
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Main Content Container - Pulling up to overlap header */}
      <div className="px-4 -mt-20 max-w-md mx-auto relative z-10">
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
              <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{profile.displayName}</h1>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-500 font-medium">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span>San Francisco, CA</span>
            </div>

            {/* Stats / Quick Actions */}
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
              <button 
                onClick={() => navigate('/edit-profile')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-colors active:scale-95"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
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
              {profile.interests.map(interestId => {
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

        <div className="text-center mt-12 pb-6">
           <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Socially v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;