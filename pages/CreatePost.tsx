import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import { ChevronLeft, Image as ImageIcon, X, AlertCircle, MapPin } from 'lucide-react';
import { useUserLocation } from '../components/LocationGuard';

const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { location: gpsLocation } = useUserLocation();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (gpsLocation) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${gpsLocation.lat}&lon=${gpsLocation.lng}`)
        .then(res => res.json())
        .then(data => {
           const addr = data.address;
           const city = addr?.city || addr?.town || addr?.village || addr?.county || "Unknown Location";
           const state = addr?.state || "";
           setLocationName(state ? `${city}, ${state}` : city);
        })
        .catch(() => setLocationName("Nearby"));
    }
  }, [gpsLocation]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        setError("Image is too large (Max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let profile = null;
      try {
        profile = await api.profile.get(user.uid);
      } catch (e) {
        console.warn("Could not fetch profile", e);
      }
      
      await api.posts.create({
        uid: user.uid,
        authorName: profile?.displayName || user.email?.split('@')[0] || 'User',
        authorPhoto: profile?.photoURL || '',
        content,
        imageURL: image || undefined,
        location: gpsLocation ? {
          ...gpsLocation,
          name: locationName
        } : undefined
      });
      
      navigate('/');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to post. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
        <button onClick={() => navigate('/')} className="text-slate-400 p-2 -ml-2 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-lg text-white">New Post</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {/* Text Area */}
        <textarea
          className="w-full h-40 text-lg text-white bg-transparent placeholder-slate-500 outline-none resize-none"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if(error) setError(null);
          }}
          autoFocus
        />

        {/* Image Preview */}
        {image && (
          <div className="relative rounded-2xl overflow-hidden mb-6 border border-slate-800 animate-fade-in">
            <img src={image} alt="Preview" className="w-full h-auto max-h-80 object-cover" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-4 border-t border-slate-800 pt-4">
           <label className="flex items-center gap-2 text-primary-400 font-medium px-4 py-2 bg-primary-500/10 rounded-xl cursor-pointer hover:bg-primary-500/20 transition-colors select-none">
              <ImageIcon className="w-5 h-5" />
              <span>Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
           </label>

           {locationName && (
             <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
               <MapPin className="w-3 h-3" />
               {locationName}
             </div>
           )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm font-medium animate-slide-up">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
         <Button 
            onClick={handleSubmit} 
            fullWidth 
            isLoading={loading}
            disabled={(!content.trim() && !image) || loading}
         >
            Post
         </Button>
      </div>
    </div>
  );
};

export default CreatePost;