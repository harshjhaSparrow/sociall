import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile, Message } from '../types';
import { ChevronLeft, Send, Loader2, MoreVertical, RefreshCw, User as UserIcon } from 'lucide-react';

const Chat: React.FC = () => {
  const { uid } = useParams<{ uid: string }>(); // Friend's UID
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [friend, setFriend] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    // Scroll on initial load and when messages change
    scrollToBottom(true);
  }, [messages.length]);

  useEffect(() => {
    const init = async () => {
      if (!uid || !user) return;
      try {
        const friendProfile = await api.profile.get(uid);
        if (!friendProfile) {
            navigate('/');
            return;
        }
        setFriend(friendProfile);

        const history = await api.chat.getHistory(user.uid, uid);
        setMessages(history);

        // Mark as read
        await api.chat.markRead(user.uid, uid);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [uid, user, navigate]);

  // Real-time Subscription
  useEffect(() => {
      if (!user || !uid) return;
      
      const unsubscribe = api.chat.subscribe(user.uid, (newMsg: Message) => {
          // Check if message belongs to this conversation
          const isRelevant = 
             (newMsg.fromUid === uid && newMsg.toUid === user.uid) || 
             (newMsg.fromUid === user.uid && newMsg.toUid === uid);
             
          if (isRelevant) {
              setMessages(prev => {
                  // Prevent duplicates if backend sends echo (though our backend sends to both)
                  if (prev.some(m => m._id === newMsg._id)) return prev;
                  return [...prev, newMsg];
              });
              
              // If the new message is from the friend, mark it read immediately while chat is open
              if (newMsg.fromUid === uid) {
                  api.chat.markRead(user.uid, uid).catch(console.error);
              }
          }
      });
      
      return () => unsubscribe();
  }, [user, uid]);

  const handleSend = async () => {
      if (!text.trim() || !user || !uid) return;
      setSending(true);
      const msgText = text.trim();
      setText(''); // Optimistic clear

      try {
          const sentMsg = await api.chat.send(user.uid, uid, msgText);
          // Backend SSE will likely deliver it back, but let's add it optimistically if id is unique
          setMessages(prev => {
              if (prev.some(m => m._id === sentMsg._id)) return prev;
              return [...prev, sentMsg];
          });
      } catch (e) {
          console.error("Failed to send", e);
          setText(msgText); // Restore text on fail
      } finally {
          setSending(false);
      }
  };

  if (loading) {
      return (
          <div className="h-[100dvh] flex items-center justify-center bg-slate-950">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
      );
  }

  if (!friend) return null;

  return (
      <div className="flex flex-col h-[100dvh] bg-slate-950">
          {/* Header */}
          <div className="flex items-center px-4 py-3 bg-slate-900 border-b border-slate-800 shadow-sm shrink-0 sticky top-0 z-10">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                  <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div 
                className="flex items-center gap-3 ml-1 flex-1 cursor-pointer"
                onClick={() => navigate(`/profile/${uid}`)}
              >
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                      {friend.photoURL ? (
                          <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                             {friend.displayName[0]}
                          </div>
                      )}
                  </div>
                  <div>
                      <h2 className="font-bold text-white text-base leading-tight">{friend.displayName}</h2>
                      <p className="text-xs text-slate-500">Tap to view profile</p>
                  </div>
              </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
              {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 opacity-50">
                      <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
                          <UserIcon className="w-8 h-8" />
                      </div>
                      <p className="text-sm">Start the conversation!</p>
                  </div>
              ) : (
                  messages.map((msg, idx) => {
                      const isMe = msg.fromUid === user?.uid;
                      const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.fromUid !== msg.fromUid);

                      return (
                          <div 
                            key={msg._id} 
                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                              <div className={`flex max-w-[80%] ${isMe ? 'items-end' : 'items-end gap-2'}`}>
                                  {!isMe && (
                                      <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0 mb-1 opacity-80">
                                          {showAvatar && (
                                              friend.photoURL ? (
                                                  <img src={friend.photoURL} className="w-full h-full object-cover" />
                                              ) : (
                                                  <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-500">{friend.displayName[0]}</div>
                                              )
                                          )}
                                      </div>
                                  )}
                                  
                                  <div className={`
                                      px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm
                                      ${isMe 
                                          ? 'bg-primary-600 text-white rounded-br-none' 
                                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}
                                  `}>
                                      {msg.text}
                                  </div>
                              </div>
                          </div>
                      );
                  })
              )}
              <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              <div className="flex items-center gap-2 max-w-md mx-auto">
                  <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-5 py-3 text-white placeholder-slate-500 outline-none focus:border-primary-500 transition-colors"
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                          }
                      }}
                  />
                  <button 
                      onClick={handleSend}
                      disabled={!text.trim() || sending}
                      className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 active:scale-95"
                  >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                  </button>
              </div>
          </div>
      </div>
  );
};

export default Chat;