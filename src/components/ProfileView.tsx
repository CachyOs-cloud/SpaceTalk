import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, PostItem, FollowUser } from '../types';
import { LOGOS } from './Logos';
import { FollowersModal } from './FollowersModal';
import { 
  Copy, 
  Check, 
  Edit3, 
  QrCode, 
  Zap, 
  Radio, 
  MapPin, 
  Calendar, 
  ExternalLink,
  ShieldCheck, 
  X,
  Sparkles,
  Share2,
  Upload,
  Camera,
  Image as ImageIcon,
  Mail,
  Lock,
  Users
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface ProfileViewProps {
  user: UserProfile;
  posts: PostItem[];
  glass: string;
  rounded: string;
  followers?: FollowUser[];
  following?: FollowUser[];
  onToggleFollow?: (username: string, userDetails?: Partial<FollowUser>) => void;
  onStartChat?: (username: string) => void;
  onUpdateUser: (updated: UserProfile) => void;
  onShowToast: (msg: string) => void;
  onOpenTip: (targetUser: { username: string; displayName?: string; avatar?: string }) => void;
  onRequireAuth: (action: string) => void;
}

export function ProfileView({
  user,
  posts,
  glass,
  rounded,
  followers = [],
  following = [],
  onToggleFollow,
  onStartChat,
  onUpdateUser,
  onShowToast,
  onOpenTip,
  onRequireAuth,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'transmissions' | 'crypto' | 'socials' | 'saved'>('transmissions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');
  const [qrAddress, setQrAddress] = useState<{ name: string; address: string } | null>(null);

  // Edit profile form state
  const [editDisplayName, setEditDisplayName] = useState(user.displayName);
  const [editBio, setEditBio] = useState(user.bio);
  const [editLocation, setEditLocation] = useState(user.location || '');
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [editBanner, setEditBanner] = useState(user.banner);
  const [editBtc, setEditBtc] = useState(user.wallets?.btc || '');
  const [editEth, setEditEth] = useState(user.wallets?.eth || '');
  const [editXmr, setEditXmr] = useState(user.wallets?.xmr || '');
  const [editSol, setEditSol] = useState(user.wallets?.sol || '');
  const [editTikTok, setEditTikTok] = useState(user.socials?.tiktok || '');
  const [editYouTube, setEditYouTube] = useState(user.socials?.youtube || '');
  const [editDiscord, setEditDiscord] = useState(user.socials?.discord || '');
  const [editTelegram, setEditTelegram] = useState(user.socials?.telegram || '');
  const [editX, setEditX] = useState(user.socials?.x || '');
  const [editGithub, setEditGithub] = useState(user.socials?.github || '');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const userPosts = posts.filter(p => p.author.username === user.username);
  const savedPosts = posts.filter(p => p.isBookmarked);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          playSound('pop');
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          playSound('pop');
          setEditBanner(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    playSound('pop');
    onShowToast(`Copied ${key.toUpperCase()} address!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.isGuest) {
      onRequireAuth('edit profile');
      return;
    }
    playSound('chime');
    const updated: UserProfile = {
      ...user,
      displayName: editDisplayName.trim() || user.username,
      bio: editBio.trim(),
      location: editLocation.trim(),
      avatar: editAvatar || user.avatar,
      banner: editBanner || user.banner,
      wallets: {
        btc: editBtc.trim(),
        eth: editEth.trim(),
        xmr: editXmr.trim(),
        sol: editSol.trim(),
      },
      socials: {
        tiktok: editTikTok.trim(),
        youtube: editYouTube.trim(),
        discord: editDiscord.trim(),
        telegram: editTelegram.trim(),
        x: editX.trim(),
        github: editGithub.trim(),
      }
    };
    onUpdateUser(updated);
    setShowEditModal(false);
    onShowToast('Profile updated on sovereign ledger!');
  };

  return (
    <div id="profile-view" className="space-y-6 max-w-xl mx-auto pb-28">
      {/* Banner & Avatar Card */}
      <div className="overflow-hidden rounded-[36px] border border-zinc-800 bg-zinc-950/90 relative shadow-2xl">
        {/* Banner */}
        <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-black">
          <img
            src={user.banner}
            alt="Profile Banner"
            className="w-full h-full object-cover grayscale opacity-55 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          
          {/* Top Actions on Banner */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => {
                playSound('click');
                setQrAddress({ 
                  name: 'Direct Node Identity', 
                  address: user.wallets?.eth || '0x71C8F32B5e69e71A598B6D197120c920D32894B2' 
                });
              }}
              className="p-2.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white hover:bg-black transition-all"
              title="Share Node QR"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (user.isGuest) {
                  onRequireAuth('edit profile');
                  return;
                }
                playSound('click');
                setShowEditModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs text-white hover:bg-black transition-all font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5 text-white" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Top Row: Round PFP + Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Round Profile Picture */}
            <div className="relative inline-block self-start">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-black ring-2 ring-zinc-300 dark:ring-zinc-700 bg-zinc-100 dark:bg-zinc-900 shadow-2xl">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              {/* Online / Active Node Beacon */}
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white dark:bg-black border-2 border-white dark:border-black flex items-center justify-center shadow-md">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 dark:bg-white animate-pulse" />
              </div>
            </div>

            {/* Quick Action Button Cluster */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => {
                  if (user.isGuest) {
                    onRequireAuth('tip users');
                    return;
                  }
                  playSound('pop');
                  onOpenTip({
                    username: user.username,
                    displayName: user.displayName,
                    avatar: user.avatar,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold text-xs uppercase tracking-wider shadow-md hover:opacity-90 transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-white dark:text-black" />
                <span>Tip Handle</span>
              </button>

              <button
                onClick={() => {
                  playSound('chime');
                  navigator.clipboard.writeText(window.location.href);
                  onShowToast('Profile link copied to clipboard!');
                }}
                className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer shadow-sm"
                title="Share Profile"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Bio & Handle Section */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-zinc-950 dark:text-white uppercase tracking-tight font-sans">
                  {user.displayName}
                </h2>
                
                {/* Verified Google Badge */}
                {user.isVerifiedGoogle && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-white dark:text-black" /> Google Verified
                  </span>
                )}

                {/* Verified Gmail Badge */}
                {user.isVerifiedGmail && !user.isVerifiedGoogle && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-wider">
                    <Mail className="w-3 h-3 text-white dark:text-black" /> Gmail Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-950 dark:text-white font-bold">@{user.username}</span>
                <span>•</span>
                <span>{user.joinedDate}</span>
                {user.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                      <MapPin className="w-3 h-3" /> {user.location}
                    </span>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans max-w-lg">
              {user.bio}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-6 pt-2 border-t border-zinc-200 dark:border-zinc-900 text-xs font-mono">
              <div>
                <span className="font-bold text-zinc-950 dark:text-white text-sm">{userPosts.length}</span>
                <span className="text-zinc-500 ml-1.5">Posts</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setFollowersModalTab('followers');
                  setShowFollowersModal(true);
                }}
                className="hover:opacity-80 transition-opacity text-left cursor-pointer group"
                title="View Followers"
              >
                <span className="font-bold text-zinc-950 dark:text-white text-sm group-hover:underline">{followers.length || (user.stats?.followers || 0)}</span>
                <span className="text-zinc-500 ml-1.5">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setFollowersModalTab('following');
                  setShowFollowersModal(true);
                }}
                className="hover:opacity-80 transition-opacity text-left cursor-pointer group"
                title="View Following"
              >
                <span className="font-bold text-zinc-950 dark:text-white text-sm group-hover:underline">{following.length || (user.stats?.following || 0)}</span>
                <span className="text-zinc-500 ml-1.5">Following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-white dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 gap-1.5 shadow-sm">
        <button
          onClick={() => {
            playSound('click');
            setActiveTab('transmissions');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'transmissions'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          My Posts ({userPosts.length})
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('crypto');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'crypto'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          Crypto Wallets
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('socials');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'socials'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          Social Handles
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('saved');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          Saved ({savedPosts.length})
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'transmissions' && (
          <motion.div
            key="tab-posts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {userPosts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 rounded-3xl p-10 text-center border border-zinc-200 dark:border-zinc-800 text-zinc-500 space-y-2 shadow-sm">
                <p className="text-sm font-bold text-zinc-950 dark:text-white">No Transmissions Yet</p>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Click the center + button in navigation to broadcast a post.</p>
              </div>
            ) : (
              userPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-zinc-950 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-3 shadow-sm text-zinc-950 dark:text-white"
                >
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap">{post.content}</p>
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden max-h-48">
                      {post.images.map((img, i) => (
                        <img key={i} src={img} alt="Post" className="w-full h-full object-cover" />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <span>{post.timestamp}</span>
                    <span>{post.likes} likes • {post.commentsCount} comments</span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'crypto' && (
          <motion.div
            key="tab-crypto"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {[
              { key: 'btc', label: 'Bitcoin', address: user.wallets?.btc, logo: LOGOS.Bitcoin },
              { key: 'eth', label: 'Ethereum', address: user.wallets?.eth, logo: LOGOS.Ethereum },
              { key: 'xmr', label: 'Monero', address: user.wallets?.xmr, logo: LOGOS.Monero },
              { key: 'sol', label: 'Solana', address: user.wallets?.sol, logo: LOGOS.Solana },
            ].map((wallet) => (
              <div
                key={wallet.key}
                className="bg-white dark:bg-zinc-950 rounded-3xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
                    <wallet.logo />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-950 dark:text-white block">{wallet.label}</span>
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate block max-w-[200px] sm:max-w-xs">
                      {wallet.address || 'Address not configured'}
                    </span>
                  </div>
                </div>

                {wallet.address && (
                  <button
                    onClick={() => handleCopy(wallet.key, wallet.address!)}
                    className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-all flex items-center gap-1.5 text-xs font-mono flex-shrink-0 cursor-pointer shadow-xs"
                  >
                    {copiedKey === wallet.key ? <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copiedKey === wallet.key ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'socials' && (
          <motion.div
            key="tab-socials"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { name: 'X / Twitter', handle: user.socials?.x, logo: LOGOS.X },
              { name: 'Telegram', handle: user.socials?.telegram, logo: LOGOS.Telegram },
              { name: 'Discord', handle: user.socials?.discord, logo: LOGOS.Discord },
              { name: 'YouTube', handle: user.socials?.youtube, logo: LOGOS.YouTube },
              { name: 'TikTok', handle: user.socials?.tiktok, logo: LOGOS.TikTok },
              { name: 'GitHub', handle: user.socials?.github, logo: LOGOS.GitHub },
            ].map((soc, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-950 rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shadow-sm"
              >
                <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
                  <soc.logo />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-950 dark:text-white block">{soc.name}</span>
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                    {soc.handle || 'Not connected'}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'saved' && (
          <motion.div
            key="tab-saved"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {savedPosts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 rounded-3xl p-10 text-center border border-zinc-200 dark:border-zinc-800 text-zinc-500 font-mono text-xs shadow-sm">
                No saved vault bookmarks.
              </div>
            ) : (
              savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-zinc-950 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm text-zinc-950 dark:text-white"
                >
                  <span className="text-xs font-bold text-zinc-950 dark:text-white">@{post.author.username}</span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-200">{post.content}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      {qrAddress && (
        <div className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-950 rounded-[36px] w-full max-w-sm p-7 border border-zinc-200 dark:border-zinc-800 text-center space-y-5 relative shadow-2xl text-zinc-950 dark:text-white"
          >
            <button
              onClick={() => setQrAddress(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-zinc-950 dark:text-white">{qrAddress.name}</h3>

            <div className="p-4 bg-zinc-100 dark:bg-white rounded-3xl mx-auto w-52 h-52 flex items-center justify-center shadow-md">
              <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-zinc-950 rounded-2xl">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                        ? 'bg-white'
                        : 'bg-zinc-950'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-left">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Address</span>
              <p className="text-[11px] font-mono text-zinc-900 dark:text-white break-all">{qrAddress.address}</p>
            </div>

            <button
              onClick={() => handleCopy('modal_qr', qrAddress.address)}
              className="w-full py-3 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 text-xs uppercase tracking-wider cursor-pointer shadow-md"
            >
              Copy Ingress Address
            </button>
          </motion.div>
        </div>
      )}

      {/* Edit Profile Modal with Local Image Uploads */}
      {showEditModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-950 rounded-[36px] w-full max-w-lg p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-950 dark:text-white"
          >
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-zinc-950 dark:text-white">Edit Profile & Uploads</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Upload custom photos from your device.</p>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              {/* Avatar upload */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                  Avatar Photo
                </label>
                <div className="flex items-center gap-3">
                  <img src={editAvatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover grayscale border-2 border-zinc-300 dark:border-zinc-700" />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Avatar Image
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Banner upload */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                  Banner Photo
                </label>
                <div className="flex items-center gap-3">
                  <img src={editBanner} alt="Banner" className="w-20 h-10 rounded-xl object-cover grayscale border border-zinc-300 dark:border-zinc-700" />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Banner Image
                  </button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFile}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-2xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                  Location / Station
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-2xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white"
                />
              </div>

              {/* Wallets */}
              <div className="pt-2">
                <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-2 font-bold">
                  Crypto Wallets
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editBtc}
                    onChange={(e) => setEditBtc(e.target.value)}
                    placeholder="Bitcoin (BTC)"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                  />
                  <input
                    type="text"
                    value={editEth}
                    onChange={(e) => setEditEth(e.target.value)}
                    placeholder="Ethereum (ETH)"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                  />
                  <input
                    type="text"
                    value={editXmr}
                    onChange={(e) => setEditXmr(e.target.value)}
                    placeholder="Monero (XMR)"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                  />
                  <input
                    type="text"
                    value={editSol}
                    onChange={(e) => setEditSol(e.target.value)}
                    placeholder="Solana (SOL)"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md mt-4 cursor-pointer"
              >
                Save Profile Configuration
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Followers & Following Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        initialTab={followersModalTab}
        followers={followers}
        following={following}
        onToggleFollow={onToggleFollow || (() => {})}
        onStartChat={onStartChat}
        onRequireAuth={onRequireAuth}
        isGuest={user.isGuest}
      />
    </div>
  );
}
