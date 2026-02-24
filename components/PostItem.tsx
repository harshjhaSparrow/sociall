import {
  AlertTriangle,
  Edit,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Navigation,
  Send,
  Trash2,
  UserX
} from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppModal from "../components/ui/AppModal";
import ConfirmModal from "../components/ui/ConfirmModal";
import { api } from "../services/api";
import { Post } from "../types";
import { calculateDistance } from "../util/location";
import { useUserLocation } from "./LocationGuard";

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
  onEdit,
}) => {
  const navigate = useNavigate();
  const { location: myLocation } = useUserLocation();

  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 🔥 MODAL STATES
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);

  const isLiked = currentUserId && post.likedBy?.includes(currentUserId);
  const commentCount = post.comments?.length || 0;

  const isMeetup = post.type === "meetup" && post.meetupDetails;
  const isHost = currentUserId === post.uid;
  const isAttendee = currentUserId && post.attendees?.includes(currentUserId);
  const isPending =
    currentUserId && post.pendingRequests?.includes(currentUserId);

  const distance =
    post.location && myLocation
      ? calculateDistance(
        myLocation.lat,
        myLocation.lng,
        post.location.lat,
        post.location.lng
      )
      : null;

  // COMMENT
  const handleSubmitComment = async () => {
    if (!post._id || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await onAddComment(post._id, commentText);
      setCommentText("");
      setShowAllComments(true);
    } finally {
      setSubmittingComment(false);
    }
  };

  // JOIN
  const handleJoinRequest = async () => {
    if (!currentUserId || !post._id) return;

    setJoinLoading(true);
    try {
      await api.meetups.join(post._id, currentUserId);
      setRequestSent(true);
    } finally {
      setJoinLoading(false);
    }
  };

  // REPORT
  const handleReportSubmit = async () => {
    if (!currentUserId || !post.uid || !reportReason.trim()) return;

    setReportLoading(true);
    try {
      await api.userAction.report(
        currentUserId,
        post.uid,
        reportReason,
        post._id
      );

      setReportModalOpen(false);
      setReportReason("");
    } finally {
      setReportLoading(false);
    }
  };

  // BLOCK
  const handleConfirmBlock = async () => {
    if (!currentUserId || !post.uid) return;

    try {
      await api.userAction.block(currentUserId, post.uid);
      setConfirmBlockOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative">
        {/* HEADER */}
        <div className="p-4 flex items-center justify-between">
          <Link
            to={`/profile/${post.uid}`}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
              {post.authorPhoto ? (
                <img
                  src={post.authorPhoto}
                  alt={post.authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-500 font-bold">
                  {post.authorName?.[0] || "U"}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200">
                {post.authorName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                {post.location && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    {post.location.name || "Unknown"}
                  </>
                )}
              </div>
            </div>
          </Link>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">
            {distance && (
              <div className="text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded-full">
                <Navigation className="w-3 h-3 inline mr-1" />
                {distance}
              </div>
            )}

            {onEdit && (
              <button onClick={() => onEdit(post._id!)}>
                <Edit className="w-5 h-5 text-slate-500 hover:text-primary-400" />
              </button>
            )}

            {onDelete && (
              <button onClick={() => onDelete(post._id!)}>
                <Trash2 className="w-5 h-5 text-slate-500 hover:text-red-400" />
              </button>
            )}

            {!isHost && currentUserId && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2"
                >
                  <MoreVertical className="w-5 h-5 text-slate-500" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 rounded-xl border border-slate-700 z-20">
                    <button
                      onClick={() => {
                        setReportModalOpen(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-yellow-400 hover:bg-slate-700 flex gap-2 items-center"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Report
                    </button>

                    <button
                      onClick={() => {
                        setConfirmBlockOpen(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-sm text-red-400 hover:bg-slate-700 border-t border-slate-700 flex gap-2 items-center"
                    >
                      <UserX className="w-4 h-4" />
                      Block
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {post.imageURL && (
          <div className="w-full aspect-square bg-slate-950">
            <img
              src={post.imageURL}
              alt="Post"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4">
          <p className="text-slate-300 text-sm">{post.content}</p>
        </div>

        {/* FOOTER */}
        <div className="px-4 pb-4 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post)}
              className={`flex items-center gap-1 ${isLiked ? "text-primary-500" : "text-slate-500"
                }`}
            >
              <Heart
                className={`w-6 h-6 ${isLiked ? "fill-current" : ""
                  }`}
              />
              {post.likes}
            </button>

            <button
              onClick={() => setShowAllComments(!showAllComments)}
              className="flex items-center gap-1 text-slate-500"
            >
              <MessageCircle className="w-6 h-6" />
              {commentCount}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent border-b border-slate-800 text-sm text-white focus:border-primary-500 outline-none"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || submittingComment}
              className="text-primary-500"
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

      {/* REPORT MODAL */}
      <AppModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Post"
      >
        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder="Describe the issue..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm mb-4 h-24 resize-none"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setReportModalOpen(false)}
            className="text-slate-400"
          >
            Cancel
          </button>
          <button
            onClick={handleReportSubmit}
            disabled={!reportReason.trim() || reportLoading}
            className="bg-yellow-600 px-4 py-2 rounded-lg text-white"
          >
            {reportLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </AppModal>

      {/* BLOCK CONFIRM */}
      <ConfirmModal
        isOpen={confirmBlockOpen}
        onClose={() => setConfirmBlockOpen(false)}
        onConfirm={handleConfirmBlock}
        title="Block User"
        description="You won't see this user's posts anymore."
        confirmText="Block"
        danger
      />
    </>
  );
};

export default PostItem;