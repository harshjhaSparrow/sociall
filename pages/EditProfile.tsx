import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile, POPULAR_INTERESTS, InterestTag } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Camera, ChevronLeft, Save, Loader2, User as UserIcon } from 'lucide-react';

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profile = await api.profile.get(user.uid);
          if (profile) {
            setDisplayName(profile.displayName || '');
            setPhotoURL(profile.photoURL || '');
            setInstagram(profile.instagramHandle || '');
            setBio(profile.bio || '');
            setSelectedInterests(profile.interests || []);
          }
        } catch (err) {
          console.error(err);
          setError("Failed to load profile.");
        } finally {
          setInitialLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { 
         setError("Image is too large (Max 500KB).");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!displayName.trim()) {
      setError("Display Name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileData: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL,
        instagramHandle: instagram,
        bio: bio.trim(),
        interests: selectedInterests,
      };

      await api.profile.createOrUpdate(user.uid, profileData);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-3 shadow-sm z-30 sticky top-0 border-b border-slate-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
            >
                 <ChevronLeft className="w-7 h-7" />
            </button>
             <span className="font-bold text-slate-900 text-lg">Edit Profile</span>
             <div className="w-10"></div> {/* Spacer */}
        </div>
      </div>

      <div className="flex-1 pb-32">
        <form onSubmit={handleSave} className="max-w-md mx-auto w-full p-6 space-y-8">
            
            {/* Photo */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative group cursor-pointer">
                <div className={`w-36 h-36 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-slate-100 flex items-center justify-center`}>
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16 text-slate-300" />
                  )}
                </div>
                <label className="absolute bottom-1 right-1 p-3.5 bg-slate-900 text-white rounded-full shadow-lg cursor-pointer hover:bg-slate-800 transition-transform hover:scale-105 active:scale-95">
                  <Camera className="w-6 h-6" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <p className="text-sm font-medium text-slate-500">Tap icon to change photo</p>
            </div>

            {/* Basic Fields */}
            <div className="space-y-6">
                <Input 
                  label="Display Name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />

                <div className="w-full space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 ml-1">
                      Bio
                    </label>
                    <textarea
                      className="w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-base text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 resize-none min-h-[120px]"
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                </div>

                <Input 
                  label="Instagram" 
                  placeholder="@username"
                  icon={<span className="text-slate-400 font-bold">@</span>}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                />
            </div>

            {/* Interests */}
            <div>
                 <label className="block text-sm font-semibold text-slate-700 ml-1 mb-4">
                    Edit Interests
                </label>
                <div className="flex flex-wrap gap-2.5">
                {POPULAR_INTERESTS.map((interest: InterestTag) => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                    <button
                        type="button"
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        className={`
                        px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2
                        flex items-center gap-2
                        ${isSelected 
                            ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md scale-105' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}
                        `}
                    >
                        <span>{interest.emoji}</span>
                        {interest.label}
                    </button>
                    );
                })}
                </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100 text-center animate-slide-up">
                  {error}
              </div>
            )}
        </form>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-40">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={handleSave} 
            fullWidth 
            isLoading={loading}
            className="shadow-xl shadow-primary-500/20"
          >
            Save Changes
            <Save className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;