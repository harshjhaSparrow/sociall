import {
  ChevronRight,
  Loader2,
  MessageCircle
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Message, UserProfile } from "../types";

interface InboxItem {
  partner: UserProfile;
  lastMessage: Message;
  unreadCount?: number;
}

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      if (!user) return;
      try {
        const data = await api.chat.getInbox(user.uid);
        setConversations(data);
      } catch (e) {
        console.error("Failed to load inbox", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md px-4 py-4 shadow-sm border-b border-slate-800 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-white">Messages</h1>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
              <MessageCircle className="w-8 h-8 opacity-50" />
            </div>
            <p>No messages yet.</p>
            <p className="text-sm mt-1">
              Start a chat from a friend's profile!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const isUnread = (conv.unreadCount || 0) > 0;
              return (
                <div
                  key={conv.partner.uid}
                  onClick={() => navigate(`/chat/${conv.partner.uid}`)}
                  className={`
                                        p-3 rounded-2xl border flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer hover:bg-slate-800
                                        ${isUnread ? "bg-slate-800 border-slate-700" : "bg-slate-900 border-slate-800"}
                                    `}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                      {conv.partner.photoURL ? (
                        <img
                          src={conv.partner.photoURL}
                          alt={conv.partner.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                          {conv.partner.displayName[0]}
                        </div>
                      )}
                    </div>
                    {isUnread && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-slate-900 flex items-center justify-center"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3
                        className={`text-base truncate ${isUnread ? "font-black text-white" : "font-bold text-slate-200"}`}
                      >
                        {conv.partner.displayName}
                      </h3>
                      <span
                        className={`text-[10px] whitespace-nowrap ml-2 ${isUnread ? "text-blue-400 font-bold" : "text-slate-500"}`}
                      >
                        {new Date(
                          conv.lastMessage.createdAt,
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm truncate ${isUnread ? "text-white font-medium" : "text-slate-400"}`}
                      >
                        {conv.lastMessage.fromUid === user?.uid && (
                          <span className="text-slate-500 mr-1 font-normal">
                            You:
                          </span>
                        )}
                        {conv.lastMessage.text}
                      </p>
                      {isUnread && (
                        <span className="ml-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 ${isUnread ? "text-blue-500" : "text-slate-600"}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
