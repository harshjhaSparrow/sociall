import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile, POPULAR_INTERESTS, InterestTag } from '../types';
import Input from '../components/ui/Input';
import { Camera, ChevronLeft, Loader2, User as UserIcon, Calendar, Briefcase } from 'lucide-react';
import { compressImage } from '../util/ImageCompression';


const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [dob, setDob] = useState('');
  const [jobRole, setJobRole] = useState('');
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
            setDob(profile.dob || '');
            setJobRole(profile.jobRole || '');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Increased limit to 10MB input
      if (file.size > 10 * 1024 * 1024) {
        setError("Image is too large (Max 10MB).");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const compressed = await compressImage(file, 800, 0.8);
        setPhotoURL(compressed);
      } catch (err: any) {
        setError(err.message || "Failed to process image.");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!displayName.trim()) {
      setError("Display Name is required.");
      return;
    }

    if (dob) {
      const age = calculateAge(dob);
      if (age < 18) {
        setError("You must be at least 18 years old.");
        return;
      }
    }

    if (instagram.trim()) {
      const instagramRegex = /^[a-zA-Z0-9._]+$/;
      if (!instagramRegex.test(instagram)) {
        setError("Invalid Instagram handle. Use only letters, numbers, periods, and underscores.");
        return;
      }
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
        dob,
        jobRole: jobRole.trim(),
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Sticky Header */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 shadow-sm z-30 sticky top-0 border-b border-slate-800">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <span className="font-bold text-white text-lg">Edit Profile</span>

          <button
            onClick={handleSave}
            disabled={loading}
            className="text-primary-500 font-bold text-base hover:text-primary-400 transition-colors disabled:opacity-50 flex items-center gap-1 px-2 py-1"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 pb-10">
        <form onSubmit={handleSave} className="max-w-md mx-auto w-full p-6 space-y-8">

          {/* Photo */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group cursor-pointer">
              <div className={`w-36 h-36 rounded-full border-[6px] border-slate-900 shadow-2xl overflow-hidden bg-slate-800 flex items-center justify-center`}>
                {photoURL ? (
                  <img  draggable={false} src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-16 h-16 text-slate-600" />
                )}
              </div>
              <label className="absolute bottom-1 right-1 p-3.5 bg-slate-800 text-white rounded-full shadow-lg cursor-pointer hover:bg-slate-700 transition-transform hover:scale-105 active:scale-95 border border-slate-600">
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

            <Input
              label="Job Role / Profession"
              value={jobRole}
              icon={<Briefcase className="w-5 h-5" />}
              onChange={(e) => setJobRole(e.target.value)}
            />

            <Input
              label="Date of Birth"
              type="date"
              icon={<Calendar className="w-5 h-5" />}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />

            <div className="w-full space-y-2">
              <label className="block text-sm font-semibold text-slate-300 ml-1">
                Bio
              </label>
              <textarea
                className="w-full rounded-2xl border-2 border-slate-800 bg-slate-900 px-4 py-4 text-base text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:bg-slate-800 resize-none min-h-[120px]"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <Input
              label="Instagram"
              placeholder="@username"
              icon={<span className="text-slate-500 font-bold">@</span>}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 ml-1 mb-4">
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
                        ? 'bg-primary-500/10 border-primary-500 text-primary-400 shadow-md scale-105'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800'}
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
            <div className="p-4 bg-red-500/10 text-red-400 text-sm font-medium rounded-2xl border border-red-500/20 text-center animate-slide-up">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditProfile;