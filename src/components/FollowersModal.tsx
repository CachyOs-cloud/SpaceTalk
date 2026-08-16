import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Search, ShieldCheck, UserMinus, UserCheck, UserPlus, MessageSquare, Radio } from 'lucide-react';
import { FollowUser } from '../types';
import { playSound } from '../utils/sound';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  followers: FollowUser[];
  following: FollowUser[];
  onToggleFollow: (username: string, userDetails?: Partial<FollowUser>) => void;
  onStartChat?: (username: string) => void;
  onRequireAuth?: (action: string) => void;
  isGuest?: boolean;
}

export function FollowersModal({
  isOpen,
  onClose,
  initialTab = 'followers',
  followers,
  following,
  onToggleFollow,
  onStartChat,
  onRequireAuth,
  isGuest = false,
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = currentList.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[160] bg-black/60 dark:bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-zinc-950 dark:text-white"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-zinc-950 dark:text-white" />
            <h3 className="text-base font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-tight">
              Peer Connections
            </h3>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="grid grid-cols-2 p-1 bg-zinc-200 dark:bg-zinc-900 rounded-2xl border border-zinc-300 dark:border-zinc-800 mb-3">
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('followers');
              }}
              className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'followers'
                  ? 'bg-white text-zinc-950 dark:bg-white dark:text-black shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Followers ({followers.length})
            </button>

            <button
              onClick={() => {
                playSound('click');
                setActiveTab('following');
              }}
              className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                activeTab === 'following'
                  ? 'bg-white text-zinc-950 dark:bg-white dark:text-black shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Following ({following.length})
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-3" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-2 rounded-xl text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white transition-all font-mono shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <p className="text-xs font-mono">
                {searchQuery
                  ? `No ${activeTab} matching "${searchQuery}"`
                  : activeTab === 'followers'
                  ? 'No peer followers yet'
                  : 'Not following any peers yet'}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-600 max-w-xs mx-auto">
                Use the search bar on the feed to discover and follow nodes across the sovereign network.
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isFollowing = following.some((f) => f.username.toLowerCase() === item.username.toLowerCase());

              return (
                <div
                  key={item.id || item.username}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.avatar}
                      alt={item.username}
                      className="w-10 h-10 rounded-full object-cover grayscale border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-zinc-950 dark:text-white truncate">
                          {item.displayName}
                        </span>
                        {item.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-950 dark:text-white flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                        @{item.username}
                      </span>
                      {item.bio && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 max-w-[180px]">
                          {item.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {onStartChat && (
                      <button
                        onClick={() => {
                          if (isGuest && onRequireAuth) {
                            onRequireAuth('chat with peers');
                            return;
                          }
                          playSound('click');
                          onClose();
                          onStartChat(item.username);
                        }}
                        className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
                        title="Send Direct Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (isGuest && onRequireAuth) {
                          onRequireAuth('follow creators');
                          return;
                        }
                        onToggleFollow(item.username, item);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                        isFollowing
                          ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white dark:border-zinc-700'
                          : 'bg-zinc-950 text-white dark:bg-white dark:text-black hover:opacity-90 shadow-sm'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3 h-3 text-zinc-900 dark:text-white" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 text-white dark:text-black" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
