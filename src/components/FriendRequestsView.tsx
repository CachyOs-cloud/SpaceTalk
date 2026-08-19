import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FriendRequest, FriendItem, UserProfile } from '../types';
import { 
  UserPlus, 
  Check, 
  X, 
  MessageSquare, 
  Search, 
  ShieldCheck, 
  Users, 
  Send, 
  Clock, 
  Radio, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface FriendRequestsViewProps {
  requests: FriendRequest[];
  friends: FriendItem[];
  user: UserProfile;
  glass: string;
  rounded: string;
  onAcceptRequest: (reqId: string) => void;
  onDeclineRequest: (reqId: string) => void;
  onSendRequest: (username: string) => void;
  onNavigateToChat: (friendUsername: string) => void;
  onShowToast: (msg: string) => void;
  onRequireAuth: (action: string) => void;
}

export function FriendRequestsView({
  requests,
  friends,
  user,
  glass,
  rounded,
  onAcceptRequest,
  onDeclineRequest,
  onSendRequest,
  onNavigateToChat,
  onShowToast,
  onRequireAuth,
}: FriendRequestsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'friends' | 'add'>('requests');
  const [targetUsername, setTargetUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendFriendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.isGuest) {
      onRequireAuth('send friend requests');
      return;
    }

    const cleanUsername = targetUsername.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername || cleanUsername.length < 1 || cleanUsername.length > 18) {
      onShowToast('Username must be 1 to 18 characters');
      return;
    }

    if (cleanUsername === user.username.toLowerCase()) {
      onShowToast('Cannot send a friend request to yourself');
      return;
    }

    if (friends.some((f) => f.username.toLowerCase() === cleanUsername)) {
      onShowToast(`@${cleanUsername} is already in your friends list`);
      return;
    }

    playSound('laser');
    onSendRequest(cleanUsername);
    setTargetUsername('');
    onShowToast(`Friend transmission sent to @${cleanUsername}!`);
  };

  return (
    <div id="friend-requests-view" className="w-full max-w-xl mx-auto space-y-6 pb-28 text-zinc-950 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-zinc-950 dark:text-white uppercase tracking-tight font-sans">
            Friend Transmissions
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
            Sovereign peer connections & verified contacts
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-950 dark:text-white">
          <Users className="w-3.5 h-3.5" />
          <span>{friends.length} Friends</span>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 gap-1.5">
        <button
          onClick={() => {
            playSound('click');
            setActiveSubTab('requests');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'requests'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          <span>Requests</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveSubTab('friends');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'friends'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>My Friends ({friends.length})</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveSubTab('add');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'add'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Friend</span>
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'requests' && (
          <motion.div
            key="tab-requests"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {pendingRequests.length === 0 ? (
              <div className="bg-white/80 dark:bg-zinc-950/80 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 p-10 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase font-mono">No Pending Requests</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  All peer handshakes are synchronized. Use the Add Friend tab to connect with 1-18 letter handles.
                </p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-zinc-950 rounded-3xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={req.fromUser.avatar}
                      alt={req.fromUser.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-zinc-300 dark:border-zinc-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-zinc-950 dark:text-white">{req.fromUser.displayName}</span>
                        {(req.fromUser.isVerified || req.fromUser.isVerifiedGoogle || req.fromUser.isVerifiedGmail) && (
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 block">
                        @{req.fromUser.username} • {req.timestamp}
                      </span>
                      {req.fromUser.bio && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">{req.fromUser.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        if (user.isGuest) {
                          onRequireAuth('accept friend requests');
                          return;
                        }
                        playSound('chime');
                        onAcceptRequest(req.id);
                        onShowToast(`Accepted friend request from @${req.fromUser.username}!`);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>

                    <button
                      onClick={() => {
                        playSound('pop');
                        onDeclineRequest(req.id);
                        onShowToast(`Declined request from @${req.fromUser.username}`);
                      }}
                      className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                      title="Decline"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeSubTab === 'friends' && (
          <motion.div
            key="tab-friends"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends by handle or name..."
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 pl-11 pr-4 py-3 rounded-2xl text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white transition-all font-mono shadow-xs"
              />
            </div>

            {filteredFriends.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-500 text-xs font-mono shadow-xs">
                No friends matching search query.
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-white dark:bg-zinc-950 rounded-3xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-zinc-300 dark:border-zinc-700"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-950 ${
                            friend.status === 'online'
                              ? 'bg-emerald-500'
                              : friend.status === 'transmitting'
                              ? 'bg-zinc-400 animate-pulse'
                              : 'bg-zinc-400'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-zinc-950 dark:text-white">{friend.displayName}</span>
                          {friend.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />}
                        </div>
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 block">
                          @{friend.username}
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{friend.bio}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (user.isGuest) {
                          onRequireAuth('chat in Inbox');
                          return;
                        }
                        playSound('laser');
                        onNavigateToChat(friend.username);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white font-mono text-xs border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Message</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'add' && (
          <motion.div
            key="tab-add"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-950 dark:text-white" />
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">Transmit Sovereign Friend Request</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Enter any 1-18 letter username to send a direct cryptographic friend request across the network.
            </p>

            <form onSubmit={handleSendFriendRequest} className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                    Target Handle (1-18 Characters)
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    {targetUsername.length}/18
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-zinc-400 dark:text-zinc-500 font-mono text-sm">@</span>
                  <input
                    type="text"
                    maxLength={18}
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="sora_k or zack_crypto"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-3 rounded-2xl text-xs font-mono text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={targetUsername.trim().length === 0}
                className="w-full py-3.5 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-xs uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Send Friend Request</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
