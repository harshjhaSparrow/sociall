import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Post } from '../types';
import PostItem from '../components/PostItem';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const data = await api.posts.getPost(id);
        if (data) {
            setPost(data);
        } else {
            setError("Post not found");
        }
      } catch (e) {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleLike = async (postToUpdate: Post) => {
    if (!user || !postToUpdate._id) return;
    
    // Optimistic Update
    const isLiked = postToUpdate.likedBy?.includes(user.uid);
    const newLikes = isLiked ? postToUpdate.likes - 1 : postToUpdate.likes + 1;
    const newLikedBy = isLiked 
      ? postToUpdate.likedBy?.filter(id => id !== user.uid) || []
      : [...(postToUpdate.likedBy || []), user.uid];

    const updatedPost = { ...postToUpdate, likes: newLikes, likedBy: newLikedBy };
    setPost(updatedPost);

    try {
      const updatedData = await api.posts.toggleLike(postToUpdate._id, user.uid);
      setPost({ ...updatedPost, likes: updatedData.likes, likedBy: updatedData.likedBy });
    } catch (error) {
      // Revert
      setPost(postToUpdate);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!user) return;
    try {
      const newComment = await api.posts.addComment(postId, user.uid, text);
      setPost(prev => prev ? ({
          ...prev,
          comments: [...(prev.comments || []), newComment]
      }) : null);
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
     return (
        <div className="flex items-center justify-center h-screen bg-slate-950">
           <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-950">
       <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 shadow-sm sticky top-0 z-20 flex items-center border-b border-slate-800">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full">
             <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="font-bold text-lg text-white ml-2">Post</h2>
       </div>

       <div className="max-w-md mx-auto p-4">
          {error ? (
              <div className="text-center py-10 text-slate-500">{error}</div>
          ) : post ? (
              <PostItem 
                 post={post}
                 currentUserId={user?.uid}
                 onLike={handleLike}
                 onAddComment={handleAddComment}
              />
          ) : null}
       </div>
    </div>
  );
};

export default PostDetail;