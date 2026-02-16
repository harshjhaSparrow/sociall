import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile, Message, Post } from '../types';
import { ChevronLeft, Send, Loader2, User as UserIcon, Users, X, Trash2, Crown } from 'lucide-react';

const Chat: React.FC = () => {
  const { uid, groupId } = useParams<{ uid?: string; groupId?: string }>(); 
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [friend, setFriend] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  
  // Group Info State
  const [groupPost, setGroupPost] = useState<Post | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isGroup = !!groupId;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    // Scroll on initial load and when messages change
    scrollToBottom(true);
  }, [messages.length]);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        if (isGroup && groupId) {
            // Group Mode: Fetch history AND group details
            const [history, groupData] = await Promise.all([
                api.chat.getGroupHistory(groupId),
                api.posts.getPost(groupId)
            ]);
            setMessages(history);
            setGroupPost(groupData);
            
            if (groupData) {
                // Fetch members
                const allMemberIds = [groupData.uid, ...(groupData.attendees || [])];
                const uniqueIds = Array.from(new Set(allMemberIds));
                const profiles = await api.profile.getBatch(uniqueIds);
                setMembers(profiles);

                if (groupData.meetupDetails?.title) {
                    setGroupTitle(groupData.meetupDetails.title);
                } else if (history.length > 0 && history[0].groupTitle) {
                    setGroupTitle(history[0].groupTitle);
                } else {
                    setGroupTitle("Group Chat");
                }
            } else {
                 setGroupTitle("Group Chat");
            }

        } else if (uid) {
            // 1:1 Mode
            const friendProfile = await api.profile.get(uid);
            if (!friendProfile) {
                navigate('/');
                return;
            }
            setFriend(friendProfile);
            const history = await api.chat.getHistory(user.uid, uid);
            setMessages(history);
            await api.chat.markRead(user.uid, uid);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [uid, groupId, user, navigate, isGroup]);

  // Real-time Subscription
  useEffect(() => {
      if (!user) return;
      
      const unsubscribe = api.chat.subscribe(user.uid, (newMsg: Message) => {
          let isRelevant = false;

          if (isGroup && groupId) {
              isRelevant = newMsg.groupId === groupId;
          } else if (uid) {
              isRelevant = 
                 (newMsg.fromUid === uid && newMsg.toUid === user.uid) || 
                 (newMsg.fromUid === user.uid && newMsg.toUid === uid);
          }
             
          if (isRelevant) {
              setMessages(prev => {
                  if (prev.some(m => m._id === newMsg._id)) return prev;
                  return [...prev, newMsg];
              });
              
              if (!isGroup && uid && newMsg.fromUid === uid) {
                  api.chat.markRead(user.uid, uid).catch(console.error);
              }
          }
      });
      
      return () => unsubscribe();
  }, [user, uid, groupId, isGroup]);

  const handleSend = async () => {
      if (!text.trim() || !user) return;
      setSending(true);
      const msgText = text.trim();
      setText(''); // Optimistic clear

      try {
          const sentMsg = await api.chat.send(user.uid, uid, msgText, groupId);
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

  const handleRemoveMember = async (targetUid: string) => {
      if (!user || !groupPost || !isGroup) return;
      
      if (confirm("Remove this user from the group?")) {
          try {
              await api.meetups.removeAttendee(groupPost._id!, user.uid, targetUid);
              
              // Update local state
              setMembers(prev => prev.filter(m => m.uid !== targetUid));
              setGroupPost(prev => prev ? ({
                  ...prev,
                  attendees: prev.attendees?.filter(id => id !== targetUid)
              }) : null);
              
          } catch (e) {
              alert("Failed to remove user");
          }
      }
  };

  if (loading) {
      return (
          <div className="h-[100dvh] flex items-center justify-center bg-slate-950">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
      );
  }

  if (!isGroup && !friend) return null;

  return (
      <div className="flex flex-col h-[100dvh] bg-slate-950 relative">
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
                onClick={() => {
                    if (isGroup) {
                        setShowGroupInfo(true);
                    } else if (friend) {
                        navigate(`/profile/${uid}`);
                    }
                }}
              >
                  {isGroup ? (
                      <div className="w-10 h-10 rounded-full bg-primary-900/50 border border-primary-500/30 flex items-center justify-center text-primary-400">
                          <Users className="w-5 h-5" />
                      </div>
                  ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                          {friend?.photoURL ? (
                              <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                 {friend?.displayName[0]}
                              </div>
                          )}
                      </div>
                  )}
                  
                  <div>
                      <h2 className="font-bold text-white text-base leading-tight">
                          {isGroup ? (groupTitle || "Group Chat") : friend?.displayName}
                      </h2>
                      <p className="text-xs text-slate-500">
                          {isGroup ? 'Tap for Group Info' : 'Tap to view profile'}
                      </p>
                  </div>
              </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
              {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 opacity-50">
                      <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
                          {isGroup ? <Users className="w-8 h-8" /> : <UserIcon className="w-8 h-8" />}
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
                              <div className={`flex max-w-[80%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  {isGroup && !isMe && showAvatar && (
                                      <span className="text-[10px] text-slate-500 ml-9 mb-0.5">{msg.authorName || 'User'}</span>
                                  )}
                                  
                                  <div className={`flex ${isMe ? 'items-end' : 'items-end gap-2'}`}>
                                      {!isMe && (
                                          <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0 mb-1 opacity-80 border border-slate-700">
                                              {showAvatar && (
                                                  (isGroup ? msg.authorPhoto : friend?.photoURL) ? (
                                                      <img src={isGroup ? msg.authorPhoto : friend?.photoURL} className="w-full h-full object-cover" />
                                                  ) : (
                                                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                          {(isGroup ? msg.authorName : friend?.displayName)?.[0] || '?'}
                                                      </div>
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

          {/* Group Info Modal */}
          {showGroupInfo && groupPost && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGroupInfo(false)}></div>
                  <div className="bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[80vh] animate-slide-up border border-slate-800">
                      
                      {/* Modal Header */}
                      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                          <h3 className="font-bold text-xl text-white">Group Info</h3>
                          <button onClick={() => setShowGroupInfo(false)} className="p-2 -mr-2 text-slate-400 hover:text-white">
                              <X className="w-6 h-6" />
                          </button>
                      </div>

                      {/* Modal Content */}
                      <div className="overflow-y-auto p-4 flex-1 no-scrollbar space-y-6">
                           
                           {/* Host Section */}
                           <div>
                               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Host</h4>
                               {members.filter(m => m.uid === groupPost.uid).map(host => (
                                   <div key={host.uid} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
                                       <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden shrink-0 border-2 border-primary-500/50">
                                            {host.photoURL ? (
                                                <img src={host.photoURL} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{host.displayName[0]}</div>
                                            )}
                                       </div>
                                       <div className="flex-1">
                                           <div className="flex items-center gap-1.5">
                                               <span className="font-bold text-white">{host.displayName}</span>
                                               <Crown className="w-3.5 h-3.5 text-primary-500 fill-current" />
                                           </div>
                                           <p className="text-xs text-slate-400">Event Organizer</p>
                                       </div>
                                       <button 
                                          onClick={() => navigate(`/profile/${host.uid}`)}
                                          className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
                                       >
                                           View
                                       </button>
                                   </div>
                               ))}
                           </div>

                           {/* Attendees Section */}
                           <div>
                               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2 flex justify-between">
                                   <span>Members</span>
                                   <span className="text-slate-600">{members.length - 1}</span>
                               </h4>
                               
                               <div className="space-y-2">
                                   {members.filter(m => m.uid !== groupPost.uid).length === 0 ? (
                                       <p className="text-slate-500 text-sm px-2 italic">No other members yet.</p>
                                   ) : (
                                       members.filter(m => m.uid !== groupPost.uid).map(member => (
                                           <div key={member.uid} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800 border border-slate-700">
                                               <div className="w-10 h-10 rounded-full bg-slate-900 overflow-hidden shrink-0">
                                                    {member.photoURL ? (
                                                        <img src={member.photoURL} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">{member.displayName[0]}</div>
                                                    )}
                                               </div>
                                               <div className="flex-1 min-w-0">
                                                   <span className="font-bold text-white text-sm block truncate">{member.displayName}</span>
                                               </div>
                                               
                                               <div className="flex items-center gap-2">
                                                   <button 
                                                      onClick={() => navigate(`/profile/${member.uid}`)}
                                                      className="text-xs bg-slate-900 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700"
                                                   >
                                                       View
                                                   </button>
                                                   
                                                   {/* Host Actions: Remove Member */}
                                                   {user && user.uid === groupPost.uid && (
                                                       <button 
                                                           onClick={() => handleRemoveMember(member.uid)}
                                                           className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                           title="Remove from group"
                                                       >
                                                           <Trash2 className="w-4 h-4" />
                                                       </button>
                                                   )}
                                               </div>
                                           </div>
                                       ))
                                   )}
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

export default Chat;