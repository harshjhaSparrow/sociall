import React, { useState } from 'react';
import { Post } from '../types';
import { Heart, MessageCircle, Send, Trash2, Edit, Loader2, MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateDistance } from './util/location';
import { useUserLocation } from './LocationGaurd';

interface PostItemProps {
  post: Post;
  currentUserId?: string;
  onLike: (post: Post) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({ 
  post, 
  currentUserId, 
  onLike, 
  onAddComment, 
  onDelete, 
  onEdit 
}) => {
  const { location: myLocation } = useUserLocation();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isLiked = currentUserId && post.likedBy?.includes(currentUserId);
  const commentCount = post.comments?.length || 0;

  const handleSubmitComment = async () => {
    if (!post._id || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await onAddComment(post._id, commentText);
      setCommentText('');
    } catch (error) {
      console.error("Failed to add comment", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const distance = (post.location && myLocation) 
    ? calculateDistance(myLocation.lat, myLocation.lng, post.location.lat, post.location.lng)
    : null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${post.uid}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-transparent group-hover:ring-primary-100 transition-all">
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-500 font-bold">
                {post.authorName?.[0] || 'U'}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition-colors">{post.authorName}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
               <span>{new Date(post.createdAt).toLocaleDateString()}</span>
               {post.location && (
                 <>
                   <span>•</span>
                   <div className="flex items-center gap-0.5">
                     <MapPin className="w-3 h-3" />
                     {post.location.name || "Unknown"}
                   </div>
                 </>
               )}
            </div>
          </div>
        </Link>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Distance Indicator */}
          {distance && (
            <div className="mr-2 flex items-center gap-1 text-xs font-bold text-primary-500 bg-primary-50 px-2 py-1 rounded-full">
              <Navigation className="w-3 h-3 fill-current" />
              {distance}
            </div>
          )}

          {onEdit && (
            <button 
              onClick={() => onEdit(post._id!)}
              className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
              title="Edit Post"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(post._id!)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Delete Post"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Post Image */}
      {post.imageURL && (
        <div className="w-full aspect-square bg-slate-100">
          <img src={post.imageURL} alt="Post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Post Content */}
      <div className="p-4">
        <p className="text-slate-800 text-sm leading-relaxed mb-3">
          {post.content}
        </p>
        
        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-50 mt-4">
          <button 
            onClick={() => onLike(post)}
            className={`flex items-center gap-1.5 transition-colors group py-2 ${isLiked ? 'text-primary-500' : 'text-slate-500 hover:text-primary-500'}`}
          >
            <Heart className={`w-6 h-6 transition-transform group-active:scale-90 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{post.likes}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 transition-colors py-2 ${showComments ? 'text-blue-500' : 'text-slate-500 hover:text-blue-500'}`}
          >
            <MessageCircle className={`w-6 h-6 ${showComments ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-4 mt-2 animate-fade-in">
            <div className="space-y-4 mb-4">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 mt-0.5">
                        {comment.authorPhoto ? (
                          <img src={comment.authorPhoto} alt={comment.authorName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                            {comment.authorName?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none text-sm w-full">
                        <span className="font-bold text-slate-900 mr-2">{comment.authorName}</span>
                        <span className="text-slate-700">{comment.text}</span>
                      </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-sm py-2 italic">
                  No comments yet.
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
                <input 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-slate-50 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-100 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <button 
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="p-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:bg-slate-200 transition-colors"
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostItem;