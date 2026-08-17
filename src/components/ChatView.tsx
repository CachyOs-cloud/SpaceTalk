import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatChannel, ChatMessage, UserProfile } from '../types';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Phone, 
  PhoneOff, 
  Zap, 
  Wallet,
  Lock, 
  Check, 
  ShieldCheck, 
  Radio, 
  Search, 
  ArrowLeft,
  Volume2,
  Image,
  Upload,
  Plus,
  X,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface ChatViewProps {
  channels: ChatChannel[];
  user: UserProfile;
  glass: string;
  rounded: string;
  onOpenTip: (targetUser: { username: string; displayName?: string; avatar?: string }) => void;
  onUpdateChannels: (channels: ChatChannel[]) => void;
  onRequireAuth: (action: string) => void;
  onShowToast: (msg: string) => void;
}

export function ChatView({
  channels,
  user,
  glass,
  rounded,
  onOpenTip,
  onUpdateChannels,
  onRequireAuth,
  onShowToast,
}: ChatViewProps) {
  const [activeChannelId, setActiveChannelId] = useState<string>(channels[0]?.id || '');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatHandle, setNewChatHandle] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannel?.messages]);

  useEffect(() => {
    let interval: any;
    if (isCalling) {
      interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          playSound('pop');
          setAttachedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.isGuest) {
      onRequireAuth('send messages in unfiltered chat');
      return;
    }

    if ((!messageInput.trim() && !attachedImage) || !activeChannel) return;

    playSound('laser');
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      text: messageInput.trim(),
      imageUrl: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: attachedImage ? 'image' : 'text',
    };

    const updatedChannels = channels.map((c) => {
      if (c.id === activeChannel.id) {
        return {
          ...c,
          lastMessage: attachedImage ? '📷 Image transmission' : `You: ${messageInput.trim()}`,
          lastTime: 'Just now',
          messages: [...c.messages, newMsg],
        };
      }
      return c;
    });

    onUpdateChannels(updatedChannels);
    setMessageInput('');
    setAttachedImage(null);
  };

  const handleSendAudioMock = () => {
    if (user.isGuest) {
      onRequireAuth('record audio notes');
      return;
    }
    if (!activeChannel) return;
    playSound('pop');
    setIsRecordingAudio(true);

    setTimeout(() => {
      playSound('laser');
      setIsRecordingAudio(false);
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderId: user.id,
        senderName: user.displayName,
        senderAvatar: user.avatar,
        text: 'Voice Transmission (Unfiltered RF)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        type: 'audio',
        audioDuration: '0:14',
      };

      const updatedChannels = channels.map((c) => {
        if (c.id === activeChannel.id) {
          return {
            ...c,
            lastMessage: '🎤 Voice transmission (0:14)',
            lastTime: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      });

      onUpdateChannels(updatedChannels);
      onShowToast('Voice note broadcasted to encrypted stream');
    }, 1500);
  };

  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.isGuest) {
      onRequireAuth('start direct chats');
      return;
    }

    const clean = newChatHandle.trim().replace(/^@/, '');
    if (!clean || clean.length < 1 || clean.length > 18) {
      onShowToast('Handle must be between 1 and 18 characters');
      return;
    }

    const newChannel: ChatChannel = {
      id: `ch_${Date.now()}`,
      name: clean,
      type: 'direct',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      lastMessage: 'Unfiltered P2P channel initialized',
      lastTime: 'Just now',
      unread: 0,
      isEncrypted: true,
      isUnfiltered: true,
      messages: [
        {
          id: `m_init_${Date.now()}`,
          senderId: 'system',
          senderName: 'Mesh Protocol',
          senderAvatar: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80',
          text: `Direct unfiltered communication link established with @${clean}. Zero censorship active.`,
          timestamp: 'Just now',
          isMe: false,
        },
      ],
    };

    onUpdateChannels([newChannel, ...channels]);
    setActiveChannelId(newChannel.id);
    setShowNewChatModal(false);
    setNewChatHandle('');
    playSound('chime');
    onShowToast(`Opened direct chat with @${clean}!`);
  };

  return (
    <div id="inbox-chat-view" className="w-full max-w-4xl mx-auto h-[78vh] flex flex-col md:flex-row rounded-[36px] overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl mb-24 text-zinc-950 dark:text-white">
      {/* Channel List Sidebar */}
      <div className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/90 dark:bg-zinc-950/90 ${
        activeChannelId ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header with Unfiltered Badge */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-zinc-950 dark:text-white text-base uppercase font-sans">Inbox</h3>
              <span className="px-2 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-[9px] font-black uppercase tracking-wider">
                Unfiltered
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Zero-censorship P2P relay</p>
          </div>

          <button
            onClick={() => {
              if (user.isGuest) {
                onRequireAuth('start new chats');
                return;
              }
              playSound('click');
              setShowNewChatModal(true);
            }}
            className="p-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black hover:opacity-90 transition-all font-bold shadow-md cursor-pointer"
            title="Start New Unfiltered Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-9 pr-3 py-2 rounded-xl text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white font-mono shadow-xs"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-100 dark:divide-zinc-900">
          {filteredChannels.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 space-y-3">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <Radio className="w-5 h-5" />
              </div>
              <p className="text-xs font-mono">No active conversations</p>
              <button
                onClick={() => {
                  if (user.isGuest) {
                    onRequireAuth('start new chats');
                    return;
                  }
                  playSound('click');
                  setShowNewChatModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black font-bold text-xs hover:opacity-90 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Direct Chat</span>
              </button>
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = channel.id === activeChannelId;
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    playSound('click');
                    setActiveChannelId(channel.id);
                  }}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-all cursor-pointer ${
                    isSelected ? 'bg-zinc-200/70 dark:bg-zinc-900 border-l-4 border-l-zinc-950 dark:border-l-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={channel.avatar}
                      alt={channel.name}
                      className="w-11 h-11 rounded-full object-cover grayscale border border-zinc-300 dark:border-zinc-700"
                    />
                    {channel.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-[9px] font-black flex items-center justify-center">
                        {channel.unread}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-xs text-zinc-950 dark:text-white truncate">{channel.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{channel.lastTime}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{channel.lastMessage}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Active Window */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-zinc-950 ${!activeChannelId ? 'hidden md:flex' : 'flex'}`}>
        {activeChannel ? (
          <>
            {/* Top Channel Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChannelId('')}
                  className="md:hidden p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="relative">
                  <img
                    src={activeChannel.avatar}
                    alt={activeChannel.name}
                    className="w-10 h-10 rounded-full object-cover grayscale border border-zinc-300 dark:border-zinc-700"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-black" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-zinc-950 dark:text-white">{activeChannel.name}</h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block">
                    Unfiltered P2P Encryption • Live Stream
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Crypto Wallets / Donate */}
                <button
                  onClick={() => {
                    playSound('pop');
                    onOpenTip({
                      username: activeChannel.name.toLowerCase().replace(/\s+/g, '_'),
                      displayName: activeChannel.name,
                      avatar: activeChannel.avatar,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="View Crypto Wallets & Donate"
                >
                  <Wallet className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
                  <span className="hidden sm:inline">Wallets</span>
                </button>

                {/* Simulated Audio Call */}
                <button
                  onClick={() => {
                    if (user.isGuest) {
                      onRequireAuth('start calls');
                      return;
                    }
                    playSound('laser');
                    setIsCalling(!isCalling);
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isCalling
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                  title="Secure Mesh Call"
                >
                  {isCalling ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* In-Call Banner */}
            {isCalling && (
              <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center justify-between text-xs font-mono text-zinc-950 dark:text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>Unfiltered RF Voice Call Active ({Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')})</span>
                </div>
                <button
                  onClick={() => setIsCalling(false)}
                  className="px-2 py-0.5 bg-red-600 rounded text-[10px] text-white font-bold cursor-pointer"
                >
                  End Call
                </button>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar bg-zinc-50/50 dark:bg-zinc-950">
              {activeChannel.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover grayscale border border-zinc-300 dark:border-zinc-800 flex-shrink-0"
                  />

                  <div className={`max-w-[75%] ${msg.isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{msg.senderName}</span>
                      <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.isMe
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-medium rounded-tr-none shadow-sm'
                          : 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-200 dark:border-zinc-800 shadow-xs'
                      }`}
                    >
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Attachment"
                          className="rounded-xl mb-2 max-h-56 w-full object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                      )}

                      {msg.type === 'audio' ? (
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <Volume2 className="w-4 h-4" />
                          <span>Voice Note ({msg.audioDuration})</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Attachment Preview */}
            {attachedImage && (
              <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={attachedImage} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700" />
                  <span className="text-xs font-mono text-zinc-950 dark:text-white">Image attached</span>
                </div>
                <button
                  onClick={() => setAttachedImage(null)}
                  className="p-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Upload Image Button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                title="Attach Photo"
              >
                <Image className="w-4 h-4" />
              </button>

              {/* Record Audio Button */}
              <button
                type="button"
                onClick={handleSendAudioMock}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isRecordingAudio
                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                    : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white shadow-xs'
                }`}
                title="Record Unfiltered Audio"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Unfiltered peer message..."
                className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white transition-all font-sans"
              />

              <button
                type="submit"
                disabled={!messageInput.trim() && !attachedImage}
                className="p-3 bg-zinc-950 text-white dark:bg-white dark:text-black font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-30 shadow-md flex items-center justify-center cursor-pointer"
                title="Transmit"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <Radio className="w-12 h-12 mb-3 text-zinc-400 dark:text-zinc-700" />
            <h4 className="font-bold text-zinc-950 dark:text-white text-sm">No Active Channel Selected</h4>
            <p className="text-xs font-mono mt-1 text-zinc-500 dark:text-zinc-400">Select a peer or start a new unfiltered transmission link.</p>
          </div>
        )}
      </div>

      {/* New Unfiltered Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[190] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-sm p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative text-left text-zinc-950 dark:text-white"
          >
            <button
              onClick={() => setShowNewChatModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-zinc-950 dark:text-white" />
              <h3 className="text-base font-bold text-zinc-950 dark:text-white uppercase">New Unfiltered Link</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Enter any 1-18 character handle to open a direct, censorship-free messaging node.
            </p>

            <form onSubmit={handleStartNewChat} className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">Username (1-18 chars)</label>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{newChatHandle.length}/18</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-zinc-400 dark:text-zinc-500 font-mono text-xs">@</span>
                  <input
                    type="text"
                    maxLength={18}
                    value={newChatHandle}
                    onChange={(e) => setNewChatHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="sora_k"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-3 py-2.5 rounded-xl text-xs font-mono text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={newChatHandle.trim().length === 0}
                className="w-full py-3.5 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer shadow-md"
              >
                Establish Unfiltered Channel
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
