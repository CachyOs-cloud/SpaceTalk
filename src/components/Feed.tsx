import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PostItem, StoryItem, UserProfile, FollowUser, ShortItem } from '../types';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Zap, 
  Wallet,
  Bookmark, 
  Send, 
  Plus, 
  ShieldCheck, 
  X,
  Sparkles,
  UserCheck,
  UserPlus,
  Radio
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { SearchBar } from './SearchBar';
import { UserBadge } from './UserBadge';

interface FeedProps {
  posts: PostItem[];
  stories: StoryItem[];
  shorts?: ShortItem[];
  user: UserProfile;
  glass: string;
  rounded: string;
  following?: FollowUser[];
  allUsers?: UserProfile[];
  onToggleFollow?: (username: string, userDetails?: Partial<FollowUser>) => void;
  onOpenStories: (index: number) => void;
  onOpenTip: (author: { username: string; displayName?: string; avatar?: string }) => void;
  onUpdatePost: (post: PostItem) => void;
  onOpenAddPost: () => void;
  onShowToast: (msg: string) => void;
  onRequireAuth: (action: string) => void;
  onStartChat?: (username: string) => void;
  onSelectUser?: (username: string) => void;
}

export function Feed({
  posts,
  stories,
  shorts = [],
  user,
  glass,
  rounded,
  following = [],
  allUsers = [],
  onToggleFollow,
  onOpenStories,
  onOpenTip,
  onUpdatePost,
  onOpenAddPost,
  onShowToast,
  onRequireAuth,
  onStartChat,
  onSelectUser,
}: FeedProps) {
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleLike = (post: PostItem) => {
    if (user.isGuest) {
      onRequireAuth('like transmissions');
      return;
    }
    playSound('pop');
    const isLiked = !post.isLiked;
    const likes = isLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
    onUpdatePost({ ...post, isLiked, likes });
  };

  const handleBookmark = (post: PostItem) => {
    if (user.isGuest) {
      onRequireAuth('save posts to vault');
      return;
    }
    playSound('click');
    const isBookmarked = !post.isBookmarked;
    onUpdatePost({ ...post, isBookmarked });
    onShowToast(isBookmarked ? 'Transmission stored in Vault' : 'Removed from Vault');
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (user.isGuest) {
      onRequireAuth('comment on transmissions');
      return;
    }

    const text = commentInputs[postId]?.trim();
    if (!text) return;

    playSound('laser');
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newComment = {
      id: `c_${Date.now()}`,
      author: user.username,
      avatar: user.avatar,
      text,
      timestamp: 'Just now',
      likes: 0,
    };

    onUpdatePost({
      ...post,
      comments: [newComment, ...post.comments],
      commentsCount: post.commentsCount + 1,
    });

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    onShowToast('Response broadcasted to thread!');
  };

  const handleShare = (post: PostItem) => {
    playSound('chime');
    navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
    onShowToast('Transmission link copied to clipboard!');
  };

  return (
    <div id="posts-feed" className="w-full max-w-xl mx-auto space-y-6 pb-28">
      {/* Universal Network Search Bar */}
      <div className="w-full">
        <SearchBar
          posts={posts}
          shorts={shorts}
          following={following}
          allUsers={allUsers}
          onToggleFollow={(uname, details) => {
            if (onToggleFollow) onToggleFollow(uname, details);
          }}
          onStartChat={onStartChat}
          onSelectUser={onSelectUser}
          onRequireAuth={onRequireAuth}
          isGuest={user.isGuest}
          currentUser={user}
        />
      </div>

      {/* Stories Bar */}
      <div className="w-full overflow-x-auto no-scrollbar py-2">
        <div className="flex items-center gap-4 px-1">
          {/* User's story button */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div
              onClick={() => {
                if (user.isGuest) {
                  onRequireAuth('broadcast posts and stories');
                  return;
                }
                playSound('pop');
                onOpenAddPost();
              }}
              className="relative w-16 h-16 rounded-full p-0.5 bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-950 dark:hover:border-white transition-all flex items-center justify-center shadow-sm"
            >
              <img
                src={user.avatar}
                alt="My avatar"
                className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs shadow-md">
                +
              </div>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">Transmit</span>
          </motion.div>

          {/* Peer stories */}
          {stories.map((story, idx) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onOpenStories(idx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div
                className={`w-16 h-16 rounded-full p-0.5 transition-all ${
                  story.hasUnseen
                    ? 'bg-gradient-to-tr from-zinc-950 via-zinc-400 to-zinc-950 dark:from-white dark:via-zinc-400 dark:to-white shadow-[0_0_15px_rgba(0,0,0,0.15)] dark:shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-black p-0.5">
                  <img
                    src={story.userAvatar}
                    alt={story.username}
                    className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[64px]">
                {story.username}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-zinc-800/90 p-10 text-center space-y-4 shadow-md dark:shadow-xl"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-600 dark:text-zinc-400">
              <Sparkles className="w-6 h-6 text-zinc-950 dark:text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-tight">
                No Transmissions Yet
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                Your sovereign feed is clean. Click below or search above to discover peers and broadcast your first photo or text transmission.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (user.isGuest) {
                  onRequireAuth('broadcast posts');
                  return;
                }
                playSound('laser');
                onOpenAddPost();
              }}
              className="px-6 py-3 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast First Post</span>
            </motion.button>
          </motion.div>
        ) : (
          posts.map((post) => {
            const isMe = post.author.username.toLowerCase() === user.username.toLowerCase();
            const isFollowing = following.some(
              (f) => f.username.toLowerCase() === post.author.username.toLowerCase()
            );

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden shadow-sm dark:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all p-5 sm:p-6 text-zinc-950 dark:text-white"
              >
                {/* Author Header */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.author.avatar}
                      alt={post.author.username}
                      className="w-11 h-11 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-zinc-950 dark:text-white truncate">{post.author.displayName}</span>
                        <UserBadge
                          isOwner={post.author.isOwner}
                          isVerified={post.author.isVerified || post.author.isVerifiedGoogle || post.author.isVerifiedGmail}
                          email={post.author.email}
                          username={post.author.username}
                          size="xs"
                        />
                      </div>
                      <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 block truncate">
                        @{post.author.username} • {post.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Actions Right: Follow Toggle + Tip Creator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isMe && onToggleFollow && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (user.isGuest) {
                            onRequireAuth('follow creators');
                            return;
                          }
                          onToggleFollow(post.author.username, {
                            id: `usr_${post.author.username}`,
                            username: post.author.username,
                            displayName: post.author.displayName,
                            avatar: post.author.avatar,
                            isVerified: post.author.isVerified,
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isFollowing
                            ? 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
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
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        playSound('pop');
                        onOpenTip(post.author);
                      }}
                      className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-950 dark:hover:border-white text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="View Crypto Wallets & Donate"
                    >
                      <Wallet className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
                      <span className="text-[11px] font-bold">Wallets</span>
                    </motion.button>
                  </div>
                </div>

                {/* Post Content (Text) */}
                <p className="text-sm text-zinc-800 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap font-sans mb-4">
                  {post.content}
                </p>

                {/* Post Images (User-uploaded or authentic photos) */}
                {post.images && post.images.length > 0 && (
                  <div
                    className={`rounded-2xl overflow-hidden mb-4 grid gap-2 ${
                      post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    }`}
                  >
                    {post.images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setLightboxImage(img)}
                        className="relative cursor-pointer group bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden max-h-[380px]"
                      >
                        <img
                          src={img}
                          alt={`Post attachment ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Tags if any */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <div className="flex items-center gap-6">
                    {/* Like */}
                    <motion.button
                      whileTap={{ scale: 0.82 }}
                      onClick={() => handleLike(post)}
                      className="flex items-center gap-1.5 group cursor-pointer"
                    >
                      <motion.div
                        animate={post.isLiked ? { scale: [1, 1.38, 0.92, 1] } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors duration-200 ${
                            post.isLiked
                              ? 'fill-zinc-950 text-zinc-950 dark:fill-white dark:text-white'
                              : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-950 dark:group-hover:text-white'
                          }`}
                        />
                      </motion.div>
                      <span
                        className={`text-xs font-mono font-medium ${
                          post.isLiked ? 'text-zinc-950 dark:text-white' : 'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-950 dark:group-hover:text-white'
                        }`}
                      >
                        {post.likes}
                      </span>
                    </motion.button>

                    {/* Comments Toggle */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        playSound('click');
                        setExpandedCommentsPostId(
                          expandedCommentsPostId === post.id ? null : post.id
                        );
                      }}
                      className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-mono font-medium">{post.commentsCount}</span>
                    </motion.button>

                    {/* Share */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleShare(post)}
                      className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                      title="Share Transmission"
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Bookmark Vault */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleBookmark(post)}
                    className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                    title="Save to Vault"
                  >
                    <motion.div
                      animate={post.isBookmarked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          post.isBookmarked ? 'fill-zinc-950 text-zinc-950 dark:fill-white dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      />
                    </motion.div>
                  </motion.button>
                </div>

                {/* Inline Comment Thread with Smooth Expansion */}
                <AnimatePresence>
                  {expandedCommentsPostId === post.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3"
                    >
                      {/* Add Comment Input */}
                      <form
                        onSubmit={(e) => handleAddComment(post.id, e)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                          }
                          placeholder={
                            user.isGuest ? 'Log in to join discussion...' : 'Broadcast reply to thread...'
                          }
                          className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white font-mono transition-all"
                        />
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          type="submit"
                          disabled={!commentInputs[post.id]?.trim()}
                          className="p-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-30 transition-all font-bold cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </motion.button>
                      </form>

                      {/* Comments List */}
                      <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar pt-2">
                        {post.comments.length === 0 ? (
                          <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 text-center py-2">
                            No replies in this thread yet.
                          </p>
                        ) : (
                          post.comments.map((comm) => (
                            <motion.div
                              key={comm.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 text-left flex items-start gap-2.5"
                            >
                              <img
                                src={comm.avatar}
                                alt={comm.author}
                                className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 flex-shrink-0 mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-xs text-zinc-950 dark:text-white">@{comm.author}</span>
                                    <UserBadge username={comm.author} size="xs" />
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-500">{comm.timestamp}</span>
                                </div>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 font-sans leading-relaxed">
                                  {comm.text}
                                </p>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size preview"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
