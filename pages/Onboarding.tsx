import { Camera, ChevronLeft, Instagram, Sparkles, User as UserIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { InterestTag, POPULAR_INTERESTS, UserProfile } from '../types';

const STEPS = ['Basic Info', 'Socials', 'Interests'];

const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    if (user?.email && !displayName) {
      setDisplayName(user.email.split('@')[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit 500KB
         setError("Image too large (Max 500KB).");
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

  const handleNext = () => {
    setError(null);
    if (currentStep === 0 && !displayName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const profileData: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL,
        instagramHandle: instagram,
        bio: bio.trim(),
        interests: selectedInterests,
        createdAt: Date.now(),
      };

      await api.profile.createOrUpdate(user.uid, profileData);
      // Reload to ensure the App guard re-checks the profile existence
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  // Render Steps
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative group cursor-pointer">
                <div className={`w-36 h-36 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-slate-100 flex items-center justify-center ${!photoURL ? 'bg-slate-50' : ''}`}>
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
              <div className="text-center">
                <h3 className="font-semibold text-slate-900">Profile Photo</h3>
                <p className="text-sm text-slate-400">Make a great first impression</p>
              </div>
            </div>

            <div className="space-y-6">
              <Input 
                label="Display Name" 
                placeholder="e.g. Alex Rivera"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <div className="w-full space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 ml-1">
                    Bio <span className="text-slate-400 font-normal ml-1">(Optional)</span>
                  </label>
                  <textarea
                    className="w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 resize-none min-h-[120px]"
                    placeholder="Tell us a bit about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
              </div>
            </div>
          </div>
        );

      case 1: // Socials
        return (
          <div className="space-y-8 animate-fade-in pt-4">
            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-purple-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-pink-500/20 transform -rotate-3">
                <Instagram className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Instagram</h3>
                <p className="text-slate-500 text-base mt-1">Let others find you on socials</p>
              </div>
            </div>

            <Input 
              label="Username" 
              placeholder="@username"
              icon={<span className="text-slate-400 font-bold">@</span>}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
            />
          </div>
        );

      case 2: // Interests
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Your Vibe</h3>
              <p className="text-slate-500 text-base">Select at least 3 interests</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {POPULAR_INTERESTS.map((interest: InterestTag) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`
                      relative overflow-hidden px-4 py-4 rounded-2xl text-sm font-bold transition-all duration-200 border-2 text-left
                      flex items-center gap-3
                      ${isSelected 
                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md scale-[1.02]' 
                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}
                    `}
                  >
                    <span className="text-2xl">{interest.emoji}</span>
                    <span className="truncate">{interest.label}</span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header / Progress */}
      <div className="bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm z-20 sticky top-0">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
             {currentStep > 0 ? (
               <button onClick={handleBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
                 <ChevronLeft className="w-7 h-7" />
               </button>
             ) : (
               <div className="w-10" />
             )}
             <span className="font-bold text-slate-900 text-lg">Step {currentStep + 1} of {STEPS.length}</span>
             <div className="w-10" />
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full pb-32">
        <div className="flex-1">
          {renderStep()}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 font-medium text-sm rounded-2xl border border-red-100 text-center animate-slide-up">
            {error}
          </div>
        )}
      </div>

      {/* Floating Footer */}
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white to-white/0 z-30">
        <div className="max-w-md mx-auto">
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} fullWidth className="shadow-xl shadow-primary-500/20">
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleFinish} 
              fullWidth 
              isLoading={loading}
              disabled={selectedInterests.length < 3}
              className="shadow-xl shadow-primary-500/20"
            >
              Complete Profile
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;