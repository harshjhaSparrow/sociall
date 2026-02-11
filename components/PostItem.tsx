import React, { useState } from 'react';
import { Post } from '../types';
import { Heart, MessageCircle, Send, Trash2, Edit, Loader2, MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserLocation } from './LocationGuard';
import { calculateDistance } from '@/util/location';

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
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isLiked = currentUserId && post.likedBy?.includes(currentUserId);
  const commentCount = post.comments?.length || 0;
  
  // Logic to determine which comments to show:
  // If showAll is false, show ONLY the last comment (if exists).
  // If showAll is true, show all.
  const hasComments = commentCount > 0;
  const commentsToShow = showAllComments 
      ? post.comments 
      : (hasComments ? [post.comments![post.comments!.length - 1]] : []);

  const handleSubmitComment = async () => {
    if (!post._id || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await onAddComment(post._id, commentText);
      setCommentText('');
      // If we add a comment, expand to show all so the user sees theirs
      setShowAllComments(true);
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
    <div className="bg-slate-900 rounded-3xl shadow-sm border border-slate-800 overflow-hidden relative">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${post.uid}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden ring-2 ring-transparent group-hover:ring-primary-500/50 transition-all">
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-primary-500 font-bold">
                {post.authorName?.[0] || 'U'}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200 group-hover:text-primary-400 transition-colors">{post.authorName}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
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
            <div className="mr-2 flex items-center gap-1 text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded-full border border-primary-500/20">
              <Navigation className="w-3 h-3 fill-current" />
              {distance}
            </div>
          )}

          {onEdit && (
            <button 
              onClick={() => onEdit(post._id!)}
              className="p-2 text-slate-500 hover:text-primary-400 hover:bg-slate-800 rounded-full transition-colors"
              title="Edit Post"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(post._id!)}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-full transition-colors"
              title="Delete Post"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Post Image */}
      {post.imageURL && (
        <div className="w-full aspect-square bg-slate-950">
          <img src={post.imageURL} alt="Post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Post Content */}
      <div className="p-4">
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          {post.content}
        </p>
        
        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-800 mt-4 mb-3">
          <button 
            onClick={() => onLike(post)}
            className={`flex items-center gap-1.5 transition-colors group py-2 ${isLiked ? 'text-primary-500' : 'text-slate-500 hover:text-primary-500'}`}
          >
            <Heart className={`w-6 h-6 transition-transform group-active:scale-90 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{post.likes}</span>
          </button>
          <button 
            onClick={() => setShowAllComments(!showAllComments)}
            className={`flex items-center gap-1.5 transition-colors py-2 ${showAllComments ? 'text-blue-400' : 'text-slate-500 hover:text-blue-400'}`}
          >
            <MessageCircle className={`w-6 h-6 ${showAllComments ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="space-y-3">
            {/* View All Button */}
            {!showAllComments && commentCount > 1 && (
                <button 
                    onClick={() => setShowAllComments(true)}
                    className="text-slate-500 text-xs font-semibold hover:text-slate-300 ml-1"
                >
                    View all {commentCount} comments
                </button>
            )}

            {/* Comment List (Shows only latest if !showAllComments) */}
            {commentsToShow && commentsToShow.length > 0 && (
                <div className="space-y-3">
                    {commentsToShow.map((comment, idx) => (
                        <div key={idx} className="flex gap-2.5 animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 mt-0.5 border border-slate-700">
                                {comment.authorPhoto ? (
                                <img src={comment.authorPhoto} alt={comment.authorName} className="w-full h-full object-cover" />
                                ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {comment.authorName?.[0]}
                                </div>
                                )}
                            </div>
                            <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl text-sm border border-slate-800 flex-1">
                                <span className="font-bold text-slate-200 text-xs mr-2 block mb-0.5">{comment.authorName}</span>
                                <span className="text-slate-400 text-xs leading-relaxed">{comment.text}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Input - Always visible if user wants to engage */}
            <div className="flex items-center gap-2 pt-2">
                <input 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent border-b border-slate-800 py-2 text-sm text-white focus:border-primary-500 outline-none placeholder-slate-600 transition-colors"
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
                  className="p-2 text-primary-500 hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PostItem;