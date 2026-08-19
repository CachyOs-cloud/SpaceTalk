import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  User, 
  FileText, 
  Play, 
  Hash, 
  ShieldCheck, 
  UserPlus, 
  UserCheck, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { PostItem, ShortItem, FollowUser, UserProfile } from '../types';
import { playSound } from '../utils/sound';
import { findUserByHandleOrEmail } from '../lib/firebase';

interface SearchBarProps {
  posts: PostItem[];
  shorts: ShortItem[];
  following: FollowUser[];
  onToggleFollow: (username: string, userDetails?: Partial<FollowUser>) => void;
  onSelectPost?: (post: PostItem) => void;
  onSelectUser?: (username: string) => void;
  onStartChat?: (username: string) => void;
  onRequireAuth?: (action: string) => void;
  isGuest?: boolean;
  currentUser?: UserProfile | null;
  allUsers?: UserProfile[];
  placeholder?: string;
}

export function SearchBar({
  posts,
  shorts,
  following,
  onToggleFollow,
  onSelectPost,
  onSelectUser,
  onStartChat,
  onRequireAuth,
  isGuest = false,
  currentUser,
  allUsers = [],
  placeholder = 'Search handles (@...), transmissions, tags (#), shorts...',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'users' | 'posts' | 'shorts'>('all');
  const [isFocused, setIsFocused] = useState(false);
  const [remoteUserResult, setRemoteUserResult] = useState<FollowUser | null>(null);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');

  // Live remote Firestore search for exact or partial handle
  useEffect(() => {
    if (!cleanQuery || cleanQuery.length < 1) {
      setRemoteUserResult(null);
      setIsSearchingRemote(false);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearchingRemote(true);
        const remoteDoc = await findUserByHandleOrEmail(cleanQuery);
        if (!isCancelled && remoteDoc && remoteDoc.username) {
          setRemoteUserResult({
            id: remoteDoc.id,
            username: remoteDoc.username,
            displayName: remoteDoc.displayName || remoteDoc.username,
            avatar: remoteDoc.avatar,
            bio: remoteDoc.bio,
            isVerified: remoteDoc.isVerified,
            isOwner: remoteDoc.isOwner,
            followersCount: remoteDoc.stats?.followers || 0,
          });
        } else if (!isCancelled) {
          setRemoteUserResult(null);
        }
      } catch (err) {
        if (!isCancelled) setRemoteUserResult(null);
      } finally {
        if (!isCancelled) setIsSearchingRemote(false);
      }
    }, 120);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [cleanQuery]);

  // Extract unique authors from currentUser, allUsers, posts, shorts + following list to create a searchable network index
  const searchableUsers = useMemo(() => {
    const userMap = new Map<string, FollowUser>();

    // 1. Add Current User so searching own handle (@2, etc.) always finds self
    if (currentUser && currentUser.username) {
      const lower = currentUser.username.toLowerCase();
      userMap.set(lower, {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName || currentUser.username,
        avatar: currentUser.avatar,
        bio: currentUser.bio || 'Your sovereign node',
        isVerified: currentUser.isVerified,
        isOwner: currentUser.isOwner,
        followersCount: currentUser.stats?.followers || 0,
      });
    }

    // 2. Add all registered network users
    (allUsers || []).forEach((u) => {
      if (u && u.username) {
        const lower = u.username.toLowerCase();
        if (!userMap.has(lower)) {
          userMap.set(lower, {
            id: u.id,
            username: u.username,
            displayName: u.displayName || u.username,
            avatar: u.avatar,
            bio: u.bio,
            isVerified: u.isVerified,
            isOwner: u.isOwner,
            followersCount: u.stats?.followers || 0,
          });
        }
      }
    });

    // 3. Add following
    following.forEach((f) => {
      if (f && f.username) {
        userMap.set(f.username.toLowerCase(), f);
      }
    });

    // 4. Add remote user if found in Firestore
    if (remoteUserResult && remoteUserResult.username) {
      userMap.set(remoteUserResult.username.toLowerCase(), remoteUserResult);
    }

    // 5. Add post authors
    posts.forEach((p) => {
      if (p.author && p.author.username) {
        const lower = p.author.username.toLowerCase();
        if (!userMap.has(lower)) {
          userMap.set(lower, {
            id: `usr_${p.author.username}`,
            username: p.author.username,
            displayName: p.author.displayName || p.author.username,
            avatar: p.author.avatar,
            isVerified: p.author.isVerified,
            isOwner: p.author.isOwner,
            followersCount: 12,
          });
        }
      }
    });

    // 6. Add short creators
    shorts.forEach((s) => {
      if (s.author && s.author.username) {
        const lower = s.author.username.toLowerCase();
        if (!userMap.has(lower)) {
          userMap.set(lower, {
            id: `usr_${s.author.username}`,
            username: s.author.username,
            displayName: s.author.displayName || s.author.username,
            avatar: s.author.avatar,
            isVerified: s.author.isVerified,
            isOwner: s.author.isOwner,
            followersCount: 18,
          });
        }
      }
    });

    return Array.from(userMap.values());
  }, [posts, shorts, following, currentUser, allUsers, remoteUserResult]);

  // Filtered results
  const matchingUsers = useMemo(() => {
    if (!cleanQuery) return [];
    return searchableUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(cleanQuery) ||
        u.displayName.toLowerCase().includes(cleanQuery) ||
        (u.bio && u.bio.toLowerCase().includes(cleanQuery))
    );
  }, [searchableUsers, cleanQuery]);

  const matchingPosts = useMemo(() => {
    if (!cleanQuery) return [];
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(cleanQuery) ||
        p.author.username.toLowerCase().includes(cleanQuery) ||
        p.author.displayName.toLowerCase().includes(cleanQuery) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(cleanQuery.replace(/^#/, ''))))
    );
  }, [posts, cleanQuery]);

  const matchingShorts = useMemo(() => {
    if (!cleanQuery) return [];
    return shorts.filter(
      (s) =>
        s.caption.toLowerCase().includes(cleanQuery) ||
        s.author.username.toLowerCase().includes(cleanQuery) ||
        s.author.displayName.toLowerCase().includes(cleanQuery) ||
        s.musicTitle.toLowerCase().includes(cleanQuery)
    );
  }, [shorts, cleanQuery]);

  const totalResultsCount = matchingUsers.length + matchingPosts.length + matchingShorts.length;

  return (
    <div id="global-search-container" className="relative w-full z-40">
      {/* Search Input Bar */}
      <div className={`relative flex items-center bg-white dark:bg-zinc-950 rounded-2xl border transition-all duration-200 shadow-sm ${
        isFocused ? 'border-zinc-950 dark:border-white shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
      }`}>
        <Search className={`w-4 h-4 ml-4 transition-colors ${isFocused ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />

        <input
          id="main-search-input"
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-3 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none font-mono"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsFocused(false);
            }}
            className="p-2 mr-2 text-zinc-400 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Live Results when focused or querying */}
      <AnimatePresence>
        {isFocused && query.trim().length > 0 && (
          <>
            {/* Backdrop to dismiss */}
            <div
              className="fixed inset-0 z-30 bg-black/40 dark:bg-black/60 backdrop-blur-xs"
              onClick={() => setIsFocused(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute top-full mt-2 left-0 right-0 z-40 bg-white/98 dark:bg-zinc-950/98 backdrop-blur-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[75vh] flex flex-col text-zinc-950 dark:text-white"
            >
              {/* Category Filter Pills */}
              <div className="p-3 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                    filterType === 'all' ? 'bg-zinc-950 text-white dark:bg-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  All ({totalResultsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('users')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
                    filterType === 'users' ? 'bg-zinc-950 text-white dark:bg-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Handles ({matchingUsers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('posts')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
                    filterType === 'posts' ? 'bg-zinc-950 text-white dark:bg-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Posts ({matchingPosts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('shorts')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
                    filterType === 'shorts' ? 'bg-zinc-950 text-white dark:bg-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>Shorts ({matchingShorts.length})</span>
                </button>
              </div>

              {/* Search Results Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-4">
                {totalResultsCount === 0 || (filterType === 'users' && matchingUsers.length === 0) ? (
                  <div className="py-10 text-center text-zinc-500 space-y-2">
                    <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {filterType === 'users' ? 'User is not available.' : `No network matches found for "${query}"`}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                      {filterType === 'users' ? 'No registered node matches this handle.' : 'Try searching by username handle, hashtag (#), or keyword.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Users Results */}
                    {(filterType === 'all' || filterType === 'users') && matchingUsers.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 font-bold">
                            Creators & Nodes
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{matchingUsers.length} found</span>
                        </div>

                        <div className="space-y-1.5">
                          {matchingUsers.slice(0, 5).map((userMatch) => {
                            const isFollowing = following.some(
                              (f) => f.username.toLowerCase() === userMatch.username.toLowerCase()
                            );
                            const isMe = userMatch.username.toLowerCase() === currentUser?.username?.toLowerCase();

                            return (
                              <div
                                key={userMatch.id || userMatch.username}
                                className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-3"
                              >
                                <div 
                                  onClick={() => {
                                    if (onSelectUser) onSelectUser(userMatch.username);
                                    setIsFocused(false);
                                  }}
                                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                                >
                                  <img
                                    src={userMatch.avatar}
                                    alt={userMatch.username}
                                    className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs text-zinc-950 dark:text-white truncate">
                                        {userMatch.displayName}
                                      </span>
                                      {userMatch.isVerified && (
                                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-950 dark:text-white flex-shrink-0" />
                                      )}
                                    </div>
                                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 block truncate">
                                      @{userMatch.username}
                                    </span>
                                  </div>
                                </div>

                                {!isMe && (
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {onStartChat && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isGuest && onRequireAuth) {
                                            onRequireAuth('start direct chats');
                                            return;
                                          }
                                          setIsFocused(false);
                                          onStartChat(userMatch.username);
                                        }}
                                        className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
                                        title="Direct Message"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isGuest && onRequireAuth) {
                                          onRequireAuth('follow creators');
                                          return;
                                        }
                                        onToggleFollow(userMatch.username, userMatch);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl font-bold text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                                        isFollowing
                                          ? 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-700'
                                          : 'bg-zinc-950 text-white dark:bg-white dark:text-black hover:opacity-90 shadow-sm'
                                      }`}
                                    >
                                      {isFollowing ? (
                                        <>
                                          <UserCheck className="w-3 h-3 text-zinc-950 dark:text-white" />
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
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Posts Results */}
                    {(filterType === 'all' || filterType === 'posts') && matchingPosts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 font-bold">
                            Transmissions
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{matchingPosts.length} found</span>
                        </div>

                        <div className="space-y-1.5">
                          {matchingPosts.slice(0, 5).map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                if (onSelectPost) onSelectPost(p);
                                setIsFocused(false);
                              }}
                              className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between gap-3 text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <img
                                    src={p.author.avatar}
                                    alt={p.author.username}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">@{p.author.username}</span>
                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">• {p.timestamp}</span>
                                </div>
                                <p className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                                  {p.content}
                                </p>
                              </div>
                              {p.images && p.images.length > 0 && (
                                <img
                                  src={p.images[0]}
                                  alt="Preview"
                                  className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 flex-shrink-0"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shorts Results */}
                    {(filterType === 'all' || filterType === 'shorts') && matchingShorts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 font-bold">
                            Shorts
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{matchingShorts.length} found</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {matchingShorts.slice(0, 4).map((s) => (
                            <div
                              key={s.id}
                              className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center gap-2"
                            >
                              <div className="w-10 h-14 rounded-xl bg-zinc-200 dark:bg-black border border-zinc-300 dark:border-zinc-800 overflow-hidden flex-shrink-0 relative">
                                <Play className="w-4 h-4 text-zinc-950 dark:text-white absolute inset-0 m-auto" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-zinc-800 dark:text-zinc-200 line-clamp-2 font-medium">
                                  {s.caption}
                                </p>
                                <span className="text-[10px] font-mono text-zinc-500 truncate block mt-0.5">
                                  @{s.author.username}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
