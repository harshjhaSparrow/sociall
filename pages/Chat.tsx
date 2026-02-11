import { ChevronLeft, Loader2, MoreVertical, Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Message, UserProfile } from '../types';

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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    // Scroll on initial load and when messages change
    scrollToBottom(messages.length > 0);
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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Poll for new messages
    const interval = setInterval(async () => {
        if (!uid || !user) return;
        try {
            const history = await api.chat.getHistory(user.uid, uid);
            setMessages(prev => {
                // If we have pending optimistic messages (no _id), keep them? 
                // For simplicity in this demo, we'll just merge or replace if server has more.
                // A robust system would use IDs to de-dupe.
                if (history.length !== prev.length) return history;
                // Check last message ID match to detect updates
                if (history.length > 0 && prev.length > 0) {
                     const lastHist = history[history.length - 1];
                     const lastPrev = prev[prev.length - 1];
                     if (lastHist._id !== lastPrev._id) return history;
                }
                return prev;
            });
        } catch (e) {
            console.error(e);
        }
    }, 2000);

    return () => clearInterval(interval);
  }, [uid, user, navigate]);

  const handleSend = async () => {
      if (!text.trim() || !user || !uid) return;
      
      const tempId = 'temp-' + Date.now();
      const tempMsg: Message = {
          _id: tempId,
          fromUid: user.uid,
          toUid: uid,
          text: text.trim(),
          createdAt: Date.now()
      };

      // Optimistic Update
      setMessages(prev => [...prev, tempMsg]);
      setText('');
      setSending(true);

      try {
          // Actual API call
          await api.chat.send(user.uid, uid, tempMsg.text);
          // We rely on the poller or next fetch to get the real ID, 
          // or we could replace the temp message here.
          // For this app, polling will correct the ID shortly.
      } catch (e) {
          console.error(e);
          // Remove temp message on failure
          setMessages(prev => prev.filter(m => m._id !== tempId));
          alert("Failed to send message");
      } finally {
          setSending(false);
      }
  };

  const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
      
      if (isToday) return "Today";
      if (isYesterday) return "Yesterday";
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
     return (
        <div className="flex items-center justify-center h-screen bg-slate-950">
           <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
     );
  }

  if (!friend) return null;

  let lastDateHeader = '';

  return (
    <div className="flex flex-col h-screen bg-slate-950 fixed inset-0 z-50">
        {/* Header */}
        <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full active:scale-95 transition-transform">
                   <ChevronLeft className="w-6 h-6" />
                </button>
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/profile/${friend.uid}`)}
                >
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden relative">
                        {friend.photoURL ? (
                            <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{friend.displayName[0]}</div>
                        )}
                         <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-base leading-tight">{friend.displayName}</h2>
                        <span className="text-xs text-green-500 font-medium">Online</span>
                    </div>
                </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
            </button>
        </div>

        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-950 no-scrollbar"
        >
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                        <Send className="w-10 h-10 text-slate-700" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg text-slate-400">No messages yet</p>
                        <p className="text-sm text-slate-600">Say hello to start the conversation!</p>
                    </div>
                </div>
            )}
            
            {messages.map((msg, idx) => {
                const isMe = msg.fromUid === user?.uid;
                const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.fromUid !== msg.fromUid);
                const dateHeader = formatDateHeader(msg.createdAt);
                const showDateHeader = dateHeader !== lastDateHeader;
                if (showDateHeader) lastDateHeader = dateHeader;
                
                const isTemp = msg._id.startsWith('temp-');

                return (
                    <React.Fragment key={msg._id || idx}>
                        {showDateHeader && (
                            <div className="flex justify-center my-6">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full uppercase tracking-wider border border-slate-800">
                                    {dateHeader}
                                </span>
                            </div>
                        )}

                        <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[80%] items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar for receiver */}
                                <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                                    {!isMe && showAvatar && (
                                        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                                        {friend.photoURL ? (
                                            <img src={friend.photoURL} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">{friend.displayName[0]}</div>
                                        )}
                                        </div>
                                    )}
                                </div>

                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div 
                                    className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm break-words relative group ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                        : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700'
                                    } ${isTemp ? 'opacity-70' : ''}`}
                                    >
                                        {msg.text}
                                    </div>
                                    <span className={`text-[10px] text-slate-600 mt-1 px-1 ${isTemp ? 'italic' : ''}`}>
                                        {isTemp ? 'Sending...' : formatTime(msg.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 pb-safe">
            <div className="flex items-end gap-2 bg-slate-950 p-2 rounded-3xl border border-slate-800 focus-within:border-primary-500/50 transition-colors">
                <textarea 
                   value={text}
                   onChange={(e) => setText(e.target.value)}
                   onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleSend();
                       }
                   }}
                   placeholder="Type a message..."
                   className="flex-1 bg-transparent px-4 py-2.5 text-white placeholder-slate-500 outline-none text-sm resize-none max-h-32 min-h-[44px]"
                   rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-primary-500/20 mb-0.5"
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default Chat;