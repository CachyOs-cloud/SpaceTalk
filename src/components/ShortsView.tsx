import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShortItem, UserProfile, FollowUser } from '../types';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Plus, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ShieldCheck, 
  ChevronUp, 
  ChevronDown, 
  Upload, 
  X, 
  Send, 
  Music2,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { UserBadge } from './UserBadge';

interface ShortsViewProps {
  shorts: ShortItem[];
  user: UserProfile;
  glass: string;
  rounded: string;
  following?: FollowUser[];
  onToggleFollow?: (username: string, userDetails?: Partial<FollowUser>) => void;
  onUpdateShort: (short: ShortItem) => void;
  onAddShort: (short: ShortItem) => void;
  onShowToast: (msg: string) => void;
  onRequireAuth: (action: string) => void;
}

export function ShortsView({
  shorts,
  user,
  glass,
  rounded,
  following = [],
  onToggleFollow,
  onUpdateShort,
  onAddShort,
  onShowToast,
  onRequireAuth,
}: ShortsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showBurstHeart, setShowBurstHeart] = useState(false);

  // Upload short state
  const [caption, setCaption] = useState('');
  const [musicTitle, setMusicTitle] = useState('Cosmic Wave - 432Hz');
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentShort = shorts[currentIndex] || shorts[0];

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      playSound('pop');
      setSlideDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playSound('pop');
      setSlideDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleLike = () => {
    if (user.isGuest) {
      onRequireAuth('like shorts');
      return;
    }
    playSound('pop');
    const isLiked = !currentShort.isLiked;
    const likes = isLiked ? currentShort.likes + 1 : Math.max(0, currentShort.likes - 1);
    onUpdateShort({ ...currentShort, isLiked, likes });
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentShort.isLiked) {
      handleLike();
    }
    setShowBurstHeart(true);
    setTimeout(() => setShowBurstHeart(false), 800);
  };

  const handleShare = () => {
    playSound('chime');
    navigator.clipboard.writeText(window.location.href);
    onShowToast('Short transmission link copied to clipboard!');
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          playSound('pop');
          setUploadedMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishShort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedMediaUrl && !caption.trim()) {
      onShowToast('Please provide media and a caption');
      return;
    }

    playSound('laser');
    const newShort: ShortItem = {
      id: `short_${Date.now()}`,
      author: {
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isVerifiedGoogle: user.isVerifiedGoogle,
      },
      videoUrl: uploadedMediaUrl || 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4',
      caption: caption.trim() || 'Sovereign transmission #space',
      likes: 0,
      isLiked: false,
      commentsCount: 0,
      musicTitle: musicTitle.trim() || 'Original Sovereign Audio',
      timestamp: 'Just now',
      views: 1,
    };

    onAddShort(newShort);
    setShowUploadModal(false);
    setCaption('');
    setUploadedMediaUrl(null);
    onShowToast('Short broadcasted to global feed!');
  };

  return (
    <div id="shorts-view" className="w-full max-w-sm sm:max-w-md mx-auto h-[78vh] relative rounded-[36px] overflow-hidden bg-black border border-zinc-800 shadow-2xl flex flex-col mb-24">
      {/* Empty State when no shorts exist */}
      {shorts.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950 space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
            <Play className="w-8 h-8 ml-1 text-zinc-900 dark:text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-zinc-950 dark:text-white uppercase tracking-tight">
              No Shorts Transmitted Yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono max-w-xs mx-auto">
              Broadcast the first vertical video or photo short to the sovereign network.
            </p>
          </div>
          <button
            onClick={() => {
              if (user.isGuest) {
                onRequireAuth('upload shorts');
                return;
              }
              playSound('click');
              setShowUploadModal(true);
            }}
            className="px-6 py-3 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Short</span>
          </button>
        </div>
      ) : (
        <>
          {/* Top Bar inside Short */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
            <span className="text-xs font-mono font-bold tracking-wider text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              SHORTS • {currentIndex + 1}/{shorts.length}
            </span>

            <div className="flex items-center gap-2">
              {/* Mute Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/20 transition-all"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Upload Short Button */}
              <button
                onClick={() => {
                  if (user.isGuest) {
                    onRequireAuth('upload shorts');
                    return;
                  }
                  playSound('click');
                  setShowUploadModal(true);
                }}
                className="p-2.5 rounded-full bg-white text-black hover:bg-zinc-200 transition-all font-bold shadow-lg"
                title="Upload Short"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video / Photo Reel Content with Smooth Slide Transitions */}
          <div 
            className="w-full h-full relative flex items-center justify-center cursor-pointer select-none bg-zinc-950 overflow-hidden"
            onClick={() => setIsPlaying(!isPlaying)}
            onDoubleClick={handleDoubleTap}
          >
            <AnimatePresence mode="popLayout" custom={slideDirection} initial={false}>
              {currentShort && (
                <motion.div
                  key={currentShort.id}
                  custom={slideDirection}
                  initial={{ opacity: 0, y: slideDirection > 0 ? 100 : -100, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: slideDirection > 0 ? -100 : 100, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full"
                >
                  {currentShort.videoUrl.startsWith('data:image') || currentShort.videoUrl.endsWith('.jpg') || currentShort.videoUrl.endsWith('.png') ? (
                    <img
                      src={currentShort.videoUrl}
                      alt="Short"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={currentShort.videoUrl}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play/Pause Overlay indicator */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xl">
                    <Play className="w-8 h-8 ml-1 fill-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bursting Floating Heart on Double Tap */}
            <AnimatePresence>
              {showBurstHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, rotate: -15 }}
                  animate={{ scale: [0, 1.4, 1.2], opacity: [0, 1, 0], rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
                >
                  <div className="p-5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-2xl">
                    <Heart className="w-20 h-20 fill-white text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side Interaction Bar */}
          {currentShort && (
            <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-4">
              {/* Like */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                  currentShort.isLiked 
                    ? 'bg-white text-black border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                    : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                }`}>
                  <motion.div
                    animate={currentShort.isLiked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <Heart className={`w-6 h-6 ${currentShort.isLiked ? 'fill-black' : ''}`} />
                  </motion.div>
                </div>
                <span className="text-[11px] font-mono font-bold text-white shadow-sm">
                  {currentShort.likes.toLocaleString()}
                </span>
              </motion.button>

              {/* Comments */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (user.isGuest) {
                    onRequireAuth('view comments');
                    return;
                  }
                  setShowCommentsModal(true);
                }}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-bold text-white shadow-sm">
                  {currentShort.commentsCount}
                </span>
              </motion.button>

              {/* Share */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-zinc-300">Share</span>
              </motion.button>
            </div>
          )}

          {/* Bottom Info Overlay */}
          {currentShort && (
            <div className="absolute bottom-4 left-4 right-20 z-30 text-left pointer-events-auto bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <img
                  src={currentShort.author.avatar}
                  alt={currentShort.author.username}
                  className="w-9 h-9 rounded-full object-cover border border-white/40 flex-shrink-0"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-white">{currentShort.author.displayName}</span>
                  <UserBadge 
                    isOwner={currentShort.author.isOwner}
                    isVerified={currentShort.author.isVerified || currentShort.author.isVerifiedGoogle || currentShort.author.isVerifiedGmail}
                    username={currentShort.author.username}
                    size="xs"
                  />
                </div>
                <span className="text-xs font-mono text-zinc-400">@{currentShort.author.username}</span>

                {currentShort.author.username.toLowerCase() !== user.username.toLowerCase() && onToggleFollow && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (user.isGuest) {
                        onRequireAuth('follow creators');
                        return;
                      }
                      onToggleFollow(currentShort.author.username, {
                        id: `usr_${currentShort.author.username}`,
                        username: currentShort.author.username,
                        displayName: currentShort.author.displayName,
                        avatar: currentShort.author.avatar,
                        isVerified: currentShort.author.isVerified,
                      });
                    }}
                    className={`ml-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      following.some((f) => f.username.toLowerCase() === currentShort.author.username.toLowerCase())
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    {following.some((f) => f.username.toLowerCase() === currentShort.author.username.toLowerCase()) ? (
                      <>
                        <UserCheck className="w-2.5 h-2.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-2.5 h-2.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed mb-2 font-sans">
                {currentShort.caption}
              </p>

              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-300">
                <Music2 className="w-3.5 h-3.5 text-white animate-spin" />
                <span className="truncate">{currentShort.musicTitle}</span>
              </div>
            </div>
          )}

          {/* Up/Down Navigation Floating Controls */}
          <div className="absolute right-4 top-20 z-30 flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white disabled:opacity-30 hover:bg-black/90 transition-all cursor-pointer"
              title="Previous Short"
            >
              <ChevronUp className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={currentIndex >= shorts.length - 1}
              onClick={handleNext}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white disabled:opacity-30 hover:bg-black/90 transition-all cursor-pointer"
              title="Next Short"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>
        </>
      )}

      {/* Upload Short Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[190] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative text-zinc-950 dark:text-white"
            >
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-black text-zinc-950 dark:text-white uppercase tracking-tight mb-4">
                Broadcast Short Transmission
              </h3>

              <form onSubmit={handlePublishShort} className="space-y-4">
                {/* Media selection */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-950 dark:hover:border-white rounded-2xl p-6 text-center cursor-pointer bg-zinc-50 dark:bg-zinc-900/60 transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                  {uploadedMediaUrl ? (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-zinc-950 dark:text-white">✓ Media Attached Ready to Transmit</p>
                      <span className="text-[10px] text-zinc-500 font-mono">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <Upload className="w-6 h-6 text-zinc-950 dark:text-white" />
                      <p className="text-xs font-bold text-zinc-950 dark:text-white">Upload Short Video or Photo</p>
                      <span className="text-[10px] font-mono text-zinc-500">MP4, WEBM, PNG, JPG</span>
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div>
                  <label className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Caption</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Describe this short clip #astronomy #space"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white"
                  />
                </div>

                {/* Audio/Music Title */}
                <div>
                  <label className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Audio Track</label>
                  <input
                    type="text"
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    placeholder="Cosmic Wave - 432Hz"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="w-full py-4 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer"
                >
                  Publish Short
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comments Modal */}
      <AnimatePresence>
        {showCommentsModal && (
          <div className="fixed inset-0 z-[190] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative text-zinc-950 dark:text-white"
            >
              <button
                onClick={() => setShowCommentsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-4">
                Transmission Comments ({currentShort.commentsCount})
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar mb-4">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-950 dark:text-white">sora_k</span>
                    <span className="text-[10px] font-mono text-zinc-500">2h ago</span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">The exposure quality on the sensor frame is outstanding.</p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-950 dark:text-white">marcus_v</span>
                    <span className="text-[10px] font-mono text-zinc-500">4h ago</span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">Synchronizing this orbit loop with the planetary relay.</p>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Broadcast a response..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white pr-12"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    playSound('laser');
                    setShowCommentsModal(false);
                    onShowToast('Comment broadcasted!');
                  }}
                  className="absolute right-2 top-2 p-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black hover:opacity-90 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
