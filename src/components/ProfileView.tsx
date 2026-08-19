import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, PostItem, FollowUser, SavedAccount } from '../types';
import { LOGOS } from './Logos';
import { FollowersModal } from './FollowersModal';
import { 
  Copy, 
  Check, 
  Edit3, 
  QrCode, 
  Zap, 
  Wallet,
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
  Users,
  LogOut,
  Settings,
  UserPlus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AtSign
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { UserBadge } from './UserBadge';

interface ProfileViewProps {
  user: UserProfile;
  posts: PostItem[];
  glass: string;
  rounded: string;
  followers?: FollowUser[];
  following?: FollowUser[];
  savedAccounts?: SavedAccount[];
  onToggleFollow?: (username: string, userDetails?: Partial<FollowUser>) => void;
  onStartChat?: (username: string) => void;
  onUpdateUser: (updated: UserProfile) => void;
  onUpdateUsername?: (newUsername: string) => Promise<boolean>;
  onSwitchAccount?: (account: SavedAccount) => void;
  onAddAnotherAccount?: () => void;
  onRemoveSavedAccount?: (accountId: string) => void;
  onShowToast: (msg: string) => void;
  onOpenTip: (targetUser: { 
    username: string; 
    displayName?: string; 
    avatar?: string;
    wallets?: {
      btc?: string;
      eth?: string;
      xmr?: string;
      sol?: string;
    };
    isVerified?: boolean;
    isOwner?: boolean;
    email?: string;
  }) => void;
  onRequireAuth: (action: string) => void;
  onLogout?: () => void;
  onRefreshFollowers?: () => void;
}

export function ProfileView({
  user,
  posts,
  glass,
  rounded,
  followers = [],
  following = [],
  savedAccounts = [],
  onToggleFollow,
  onStartChat,
  onUpdateUser,
  onUpdateUsername,
  onSwitchAccount,
  onAddAnotherAccount,
  onRemoveSavedAccount,
  onShowToast,
  onOpenTip,
  onRequireAuth,
  onLogout,
  onRefreshFollowers,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'transmissions' | 'crypto' | 'socials' | 'settings' | 'saved'>('transmissions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');
  const [qrAddress, setQrAddress] = useState<{ name: string; address: string } | null>(null);

  // Edit profile form state
  const [editUsername, setEditUsername] = useState(user.username);
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

  // Settings tab specific state for quick handle change
  const [settingsNewHandle, setSettingsNewHandle] = useState(user.username);
  const [isUpdatingHandle, setIsUpdatingHandle] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  useEffect(() => {
    setEditUsername(user.username);
    setSettingsNewHandle(user.username);
    setEditDisplayName(user.displayName);
    setEditBio(user.bio);
    setEditLocation(user.location || '');
    setEditAvatar(user.avatar);
    setEditBanner(user.banner);
  }, [user]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const userPosts = posts.filter(p => p.author.username.toLowerCase() === user.username.toLowerCase());
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

  const handleQuickChangeHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.isGuest) {
      onRequireAuth('change username');
      return;
    }
    const cleanNew = settingsNewHandle.trim().toLowerCase().replace(/^@/, '');
    if (!cleanNew || cleanNew.length < 1 || cleanNew.length > 18) {
      setHandleError('Username must be 1 to 18 characters (letters, numbers, underscores).');
      playSound('pop');
      return;
    }
    if (cleanNew === user.username.toLowerCase()) {
      setHandleError('New handle is identical to current handle.');
      return;
    }

    setHandleError(null);
    setIsUpdatingHandle(true);
    try {
      if (onUpdateUsername) {
        const success = await onUpdateUsername(cleanNew);
        if (success) {
          playSound('chime');
          onShowToast(`Sovereign handle updated to @${cleanNew}!`);
        }
      }
    } catch (err: any) {
      playSound('pop');
      setHandleError(err?.message || 'Failed to update username handle.');
    } finally {
      setIsUpdatingHandle(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.isGuest) {
      onRequireAuth('edit profile');
      return;
    }

    const cleanHandle = editUsername.trim().toLowerCase().replace(/^@/, '');
    if (cleanHandle && cleanHandle !== user.username.toLowerCase()) {
      if (onUpdateUsername) {
        try {
          await onUpdateUsername(cleanHandle);
        } catch (err: any) {
          onShowToast(err.message || 'Username handle already taken.');
          playSound('pop');
          return;
        }
      }
    }

    playSound('chime');
    const updated: UserProfile = {
      ...user,
      username: cleanHandle || user.username,
      displayName: editDisplayName.trim() || cleanHandle || user.username,
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
            className="w-full h-full object-cover opacity-85 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          
          {/* Top Actions on Banner */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => {
                playSound('click');
                setActiveTab('settings');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700 text-xs text-white transition-all font-semibold cursor-pointer shadow-md"
              title="Open Settings & Account Management"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {onLogout && !user.isGuest && (
              <button
                onClick={() => {
                  playSound('pop');
                  onLogout();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-950/80 hover:bg-red-900 backdrop-blur-md border border-red-500/30 text-xs text-red-200 transition-all font-semibold cursor-pointer shadow-md"
                title="Disconnect node identity"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Details */}
        <div className="px-6 pb-6 pt-0 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="relative group w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-full h-full rounded-full object-cover border-4 border-zinc-950 shadow-2xl bg-zinc-900"
              />
              {!user.isGuest && (
                <button
                  onClick={() => {
                    playSound('click');
                    setShowEditModal(true);
                  }}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  title="Change avatar"
                >
                  <Camera className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {!user.isGuest ? (
                <>
                  <button
                    onClick={() => {
                      playSound('click');
                      setShowEditModal(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white text-black font-extrabold hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      playSound('click');
                      setActiveTab('settings');
                    }}
                    className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm"
                    title="Account Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onRequireAuth('edit profile and broadcast')}
                  className="px-4 py-2.5 rounded-2xl bg-white text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Sign In to Edit
                </button>
              )}
            </div>
          </div>

          {/* Names and Badges */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span>{user.displayName}</span>
              </h2>
              <UserBadge
                isOwner={user.isOwner}
                isVerified={user.isVerified || user.isVerifiedGoogle || user.isVerifiedGmail}
                email={user.email}
                username={user.username}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 font-medium">@{user.username}</span>
              {user.isOwner && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                  Platform Founder
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-1 whitespace-pre-wrap max-w-lg">
              {user.bio}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 pt-1 flex-wrap">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{user.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {user.joinedDate}</span>
              </span>
            </div>

            {/* Follower Stats with Instant Modal and Sync */}
            <div className="flex items-center gap-5 pt-3 text-xs font-mono border-t border-zinc-800/80">
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
                <span className="font-bold text-zinc-950 dark:text-white text-sm group-hover:underline">
                  {followers.length || (user.stats?.followers || 0)}
                </span>
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
                <span className="font-bold text-zinc-950 dark:text-white text-sm group-hover:underline">
                  {following.length || (user.stats?.following || 0)}
                </span>
                <span className="text-zinc-500 ml-1.5">Following</span>
              </button>

              {onRefreshFollowers && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onRefreshFollowers();
                  }}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer ml-auto"
                  title="Synchronize followers from database"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-white dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 gap-1.5 shadow-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            playSound('click');
            setActiveTab('transmissions');
          }}
          className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'transmissions'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          Posts ({userPosts.length})
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('settings');
          }}
          className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'settings'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          <Settings className="w-3 h-3" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('crypto');
          }}
          className={`flex-1 min-w-[85px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'crypto'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          Crypto
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('socials');
          }}
          className={`flex-1 min-w-[85px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'socials'
              ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
          }`}
        >
          Socials
        </button>

        <button
          onClick={() => {
            playSound('click');
            setActiveTab('saved');
          }}
          className={`flex-1 min-w-[85px] py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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

        {/* Dedicated Settings & Multi-Account Management Tab */}
        {activeTab === 'settings' && (
          <motion.div
            key="tab-settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* 1. Change Username Setting */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm text-zinc-950 dark:text-white">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <AtSign className="w-4 h-4" />
                    <span>Change Username Handle</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Update your unique @handle across transmissions and comments.
                  </p>
                </div>
              </div>

              {handleError && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs">
                  {handleError}
                </div>
              )}

              <form onSubmit={handleQuickChangeHandle} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 dark:text-zinc-500">
                    @
                  </span>
                  <input
                    type="text"
                    value={settingsNewHandle}
                    onChange={(e) => setSettingsNewHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18))}
                    placeholder="new_username"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-3.5 py-2.5 rounded-2xl text-xs font-mono text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingHandle || settingsNewHandle.toLowerCase() === user.username.toLowerCase()}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isUpdatingHandle ? 'Updating...' : 'Save Handle'}
                </button>
              </form>
            </div>

            {/* 2. Multi-Account Switcher Section */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm text-zinc-950 dark:text-white">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Saved Accounts on this Device</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Switch seamlessly between multiple sovereign accounts.
                  </p>
                </div>
                
                {onAddAnotherAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      onAddAnotherAccount();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer border border-zinc-200 dark:border-zinc-800"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Account</span>
                  </button>
                )}
              </div>

              {/* List of saved accounts */}
              <div className="space-y-2 pt-1">
                {savedAccounts.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-xs text-zinc-950 dark:text-white block">{user.displayName}</span>
                        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">@{user.username}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                ) : (
                  savedAccounts.map((acc) => {
                    const isActive = acc.username.toLowerCase() === user.username.toLowerCase();
                    return (
                      <div
                        key={acc.id || acc.username}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-xs'
                            : 'bg-white dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div
                          onClick={() => {
                            if (!isActive && onSwitchAccount) {
                              playSound('chime');
                              onSwitchAccount(acc);
                            }
                          }}
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                        >
                          <img src={acc.avatar} alt={acc.username} className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-950 dark:text-white truncate">{acc.displayName}</span>
                              <UserBadge isOwner={acc.isOwner} isVerified={acc.isVerified} username={acc.username} size="xs" />
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 block truncate">@{acc.username}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onSwitchAccount) {
                                  playSound('chime');
                                  onSwitchAccount(acc);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black font-bold text-xs transition-all hover:opacity-90 cursor-pointer shadow-xs"
                            >
                              Switch
                            </button>
                          )}

                          {!isActive && onRemoveSavedAccount && (
                            <button
                              type="button"
                              onClick={() => {
                                playSound('pop');
                                onRemoveSavedAccount(acc.id || acc.username);
                              }}
                              className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                              title="Remove account from device"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Profile & Ledger Synchronizer */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-sm text-zinc-950 dark:text-white">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-950 dark:text-white block">Sovereign Ledger Sync</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                  Force-sync followers, transmissions, and cryptographic nodes.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onRefreshFollowers) onRefreshFollowers();
                  onShowToast('Synced with sovereign Firestore database.');
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>
            </div>
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
            <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <p>
                <strong>Optional Crypto Wallets:</strong> Anyone viewing your profile can copy or scan these addresses to send donations directly from external wallet apps.
              </p>
            </div>

            {[
              { key: 'btc', label: 'Bitcoin', address: user.wallets?.btc, logo: LOGOS.Bitcoin },
              { key: 'eth', label: 'Ethereum / EVM', address: user.wallets?.eth, logo: LOGOS.Ethereum },
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
                      {wallet.address || 'Address not configured (optional)'}
                    </span>
                  </div>
                </div>

                {wallet.address ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        playSound('click');
                        setQrAddress({ name: `${wallet.label} Address`, address: wallet.address! });
                      }}
                      className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
                      title="Show QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(wallet.key, wallet.address!)}
                      className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer shadow-xs"
                    >
                      {copiedKey === wallet.key ? <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedKey === wallet.key ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (user.isGuest) {
                        onRequireAuth('edit profile');
                        return;
                      }
                      setShowEditModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white text-[11px] font-mono font-bold cursor-pointer border border-zinc-200 dark:border-zinc-800"
                  >
                    + Add
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
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {[
              { 
                key: 'x',
                name: 'X / Twitter', 
                handle: user.socials?.x, 
                logo: LOGOS.X,
                getUrl: (h: string) => h.startsWith('http') ? h : `https://x.com/${h.replace(/^@/, '')}`
              },
              { 
                key: 'telegram',
                name: 'Telegram', 
                handle: user.socials?.telegram, 
                logo: LOGOS.Telegram,
                getUrl: (h: string) => h.startsWith('http') ? h : `https://t.me/${h.replace(/^@/, '')}`
              },
              { 
                key: 'discord',
                name: 'Discord', 
                handle: user.socials?.discord, 
                logo: LOGOS.Discord,
                getUrl: (h: string) => h.startsWith('http') ? h : (h.includes('#') ? null : `https://discord.gg/${h.replace(/^@/, '')}`)
              },
              { 
                key: 'youtube',
                name: 'YouTube', 
                handle: user.socials?.youtube, 
                logo: LOGOS.YouTube,
                getUrl: (h: string) => h.startsWith('http') ? h : `https://youtube.com/@${h.replace(/^@/, '')}`
              },
              { 
                key: 'tiktok',
                name: 'TikTok', 
                handle: user.socials?.tiktok, 
                logo: LOGOS.TikTok,
                getUrl: (h: string) => h.startsWith('http') ? h : `https://tiktok.com/@${h.replace(/^@/, '')}`
              },
              { 
                key: 'github',
                name: 'GitHub', 
                handle: user.socials?.github, 
                logo: LOGOS.GitHub,
                getUrl: (h: string) => h.startsWith('http') ? h : `https://github.com/${h.replace(/^@/, '')}`
              },
            ].map((soc, idx) => {
              const hasHandle = Boolean(soc.handle && soc.handle.trim());
              const targetUrl = hasHandle ? soc.getUrl(soc.handle!.trim()) : null;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (hasHandle) {
                      if (targetUrl) {
                        playSound('click');
                        window.open(targetUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        // Discord handle copy
                        navigator.clipboard.writeText(soc.handle!);
                        playSound('pop');
                        onShowToast(`Copied Discord handle: ${soc.handle}`);
                      }
                    } else {
                      if (user.isGuest) {
                        onRequireAuth('connect socials');
                        return;
                      }
                      playSound('click');
                      setShowEditModal(true);
                    }
                  }}
                  className={`bg-white dark:bg-zinc-950 rounded-3xl p-4 border transition-all flex items-center justify-between gap-3 shadow-sm cursor-pointer ${
                    hasHandle
                      ? 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md'
                      : 'border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <soc.logo />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-950 dark:text-white block">{soc.name}</span>
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                        {soc.handle || '+ Connect Profile'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                    {hasHandle ? (
                      <ExternalLink className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                        Add
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* Edit Profile Modal with Local Image Uploads & Handle change */}
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
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Customize your handle, details, and photos.</p>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              {/* Username Handle change */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1 font-bold">
                  Username Handle (@...)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-3.5 py-2.5 rounded-2xl text-xs font-mono text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white"
                  />
                </div>
              </div>

              {/* Avatar upload */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1 font-bold">
                  Avatar Photo
                </label>
                <div className="flex items-center gap-3">
                  <img src={editAvatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-zinc-300 dark:border-zinc-700" />
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
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1 font-bold">
                  Banner Photo
                </label>
                <div className="flex items-center gap-3">
                  <img src={editBanner} alt="Banner" className="w-20 h-10 rounded-xl object-cover border border-zinc-300 dark:border-zinc-700" />
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

              {/* Socials Connection */}
              <div className="pt-2">
                <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-2 font-bold">
                  Connected Social Profiles
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0 text-zinc-700 dark:text-zinc-300">
                      <LOGOS.X className="w-4 h-4 fill-current" />
                    </div>
                    <input
                      type="text"
                      value={editX}
                      onChange={(e) => setEditX(e.target.value)}
                      placeholder="X / Twitter handle (e.g. @elonmusk)"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0 text-zinc-700 dark:text-zinc-300">
                      <LOGOS.Telegram className="w-4 h-4 fill-current" />
                    </div>
                    <input
                      type="text"
                      value={editTelegram}
                      onChange={(e) => setEditTelegram(e.target.value)}
                      placeholder="Telegram username"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0 text-zinc-700 dark:text-zinc-300">
                      <LOGOS.Discord className="w-4 h-4 fill-current" />
                    </div>
                    <input
                      type="text"
                      value={editDiscord}
                      onChange={(e) => setEditDiscord(e.target.value)}
                      placeholder="Discord username / invite"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0 text-zinc-700 dark:text-zinc-300">
                      <LOGOS.TikTok className="w-4 h-4 fill-current" />
                    </div>
                    <input
                      type="text"
                      value={editTikTok}
                      onChange={(e) => setEditTikTok(e.target.value)}
                      placeholder="TikTok username"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0 text-zinc-700 dark:text-zinc-300">
                      <LOGOS.YouTube className="w-4 h-4 fill-current" />
                    </div>
                    <input
                      type="text"
                      value={editYouTube}
                      onChange={(e) => setEditYouTube(e.target.value)}
                      placeholder="YouTube channel handle"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0 text-zinc-700 dark:text-zinc-300">
                      <LOGOS.GitHub className="w-4 h-4 fill-current" />
                    </div>
                    <input
                      type="text"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="GitHub username"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl text-xs text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white font-mono"
                    />
                  </div>
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
