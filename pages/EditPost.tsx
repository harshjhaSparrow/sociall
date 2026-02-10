import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Button from '../components/ui/Button';
import { ChevronLeft, Image as ImageIcon, X, AlertCircle, Loader2 } from 'lucide-react';

const EditPost: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id || !user) return;
      try {
        const post = await api.posts.getPost(id);
        if (post) {
          if (post.uid !== user.uid) {
            navigate('/'); // Unauthorized
            return;
          }
          setContent(post.content);
          setImage(post.imageURL || null);
        } else {
          setError("Post not found");
        }
      } catch (err) {
        setError("Failed to fetch post");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, user, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit 2MB
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
    if (!user || !id) return;

    setSaving(true);
    setError(null);

    try {
      await api.posts.updatePost(id, user.uid, content, image);
      navigate('/profile');
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update post. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
           <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
        <button onClick={() => navigate('/profile')} className="text-slate-500 p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-lg text-slate-900">Edit Post</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {/* Text Area */}
        <textarea
          className="w-full h-40 text-lg text-slate-900 placeholder-slate-400 outline-none resize-none"
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
          <div className="relative rounded-2xl overflow-hidden mb-6 border border-slate-100 animate-fade-in">
            <img src={image} alt="Preview" className="w-full h-auto max-h-80 object-cover" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-4">
           <label className="flex items-center gap-2 text-primary-600 font-medium px-4 py-2 bg-primary-50 rounded-xl cursor-pointer hover:bg-primary-100 transition-colors select-none">
              <ImageIcon className="w-5 h-5" />
              <span>Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
           </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium animate-slide-up">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Footer Button */}
      <div className="p-4 border-t border-slate-100">
         <Button 
            onClick={handleSubmit} 
            fullWidth 
            isLoading={saving}
            disabled={(!content.trim() && !image) || saving}
         >
            Save Changes
         </Button>
      </div>
    </div>
  );
};

export default EditPost;