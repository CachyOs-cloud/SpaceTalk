import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  getUserFromFirestore, 
  saveUserToFirestore, 
  subscribeToPosts, 
  savePostToFirestore,
  subscribeToShorts,
  saveShortToFirestore,
  subscribeToChannels,
  seedInitialDataIfEmpty,
  logOut,
  checkIsOwner
} from './lib/firebase';
import { UserBadge } from './components/UserBadge';
import { LOGOS } from './components/Logos';
import { LoadingScreen } from './components/LoadingScreen';
import { AuthSection } from './components/AuthSection';
import { Feed } from './components/Feed';
import { ShortsView } from './components/ShortsView';
import { ChatView } from './components/ChatView';
import { FriendRequestsView } from './components/FriendRequestsView';
import { ProfileView } from './components/ProfileView';
import { NavBar } from './components/NavBar';
import { StoryViewerModal } from './components/StoryViewerModal';
import { TipModal } from './components/TipModal';
import { CreatePostModal } from './components/CreatePostModal';
import { GuestModal } from './components/GuestModal';
import { 
  UserProfile, 
  PostItem, 
  StoryItem, 
  ChatChannel, 
  FriendRequest, 
  FriendItem, 
  ShortItem,
  FollowUser
} from './types';
import { 
  INITIAL_USER, 
  INITIAL_POSTS, 
  INITIAL_STORIES, 
  INITIAL_CHANNELS, 
  INITIAL_FRIEND_REQUESTS, 
  INITIAL_FRIENDS, 
  INITIAL_SHORTS 
} from './data/mockData';
import { 
  DEFAULT_AVATAR_PLACEHOLDER, 
  DEFAULT_BANNER_PLACEHOLDER 
} from './utils/placeholders';
import { playSound } from './utils/sound';
import { Sun, Moon, Volume2, VolumeX, ShieldCheck, Radio, Eye, LogIn, Lock } from 'lucide-react';

export default function SpaceTalk() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('spacetalk_session_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [authStatus, setAuthStatus] = useState<string>(() => {
    try {
      const cached = localStorage.getItem('spacetalk_session_user');
      return cached ? 'active' : 'landing';
    } catch {
      return 'landing';
    }
  });
  const [currentTab, setCurrentTab] = useState<string>('posts'); // 'posts' | 'shorts' | 'inbox' | 'friends' | 'profile'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Core Data States
  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POSTS);
  const [stories, setStories] = useState<StoryItem[]>(INITIAL_STORIES);
  const [channels, setChannels] = useState<ChatChannel[]>(INITIAL_CHANNELS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(INITIAL_FRIEND_REQUESTS);
  const [friends, setFriends] = useState<FriendItem[]>(INITIAL_FRIENDS);
  const [shorts, setShorts] = useState<ShortItem[]>(INITIAL_SHORTS);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);

  // Modals & Toast State
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [tipTargetUser, setTipTargetUser] = useState<PostItem['author'] | null>(null);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [guestRestrictionAction, setGuestRestrictionAction] = useState<string | null>(null);

  // Liquid Glass Constant Classes in Monochrome
  const glassBase = theme === 'dark' 
    ? "bg-zinc-950/80 backdrop-blur-[30px] border border-zinc-800 shadow-2xl text-white" 
    : "bg-white/95 backdrop-blur-[30px] border border-zinc-200/90 shadow-xl text-zinc-950";
  const roundedLarge = "rounded-[40px]";
  const roundedMedium = "rounded-[32px]";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Seed data & subscribe to Firestore collections + Auth State Persistence
  useEffect(() => {
    // 1. Ensure initial mock collection data is available in Firestore
    seedInitialDataIfEmpty(INITIAL_POSTS, INITIAL_SHORTS, INITIAL_CHANNELS);

    // 2. Real-time listener for Posts
    const unsubscribePosts = subscribeToPosts((firestorePosts) => {
      if (firestorePosts && firestorePosts.length > 0) {
        setPosts(firestorePosts);
      }
    });

    // 3. Real-time listener for Shorts
    const unsubscribeShorts = subscribeToShorts((firestoreShorts) => {
      if (firestoreShorts && firestoreShorts.length > 0) {
        setShorts(firestoreShorts);
      }
    });

    // 4. Real-time listener for Channels
    const unsubscribeChannels = subscribeToChannels((firestoreChannels) => {
      if (firestoreChannels && firestoreChannels.length > 0) {
        setChannels(firestoreChannels);
      }
    });

    // 5. Firebase Auth State listener to maintain session across reloads
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getUserFromFirestore(fbUser.uid);
          if (profile) {
            setUser(profile);
            setAuthStatus('active');
          } else {
            // Profile not yet created in Firestore, generate from Firebase Auth data
            const isOwner = checkIsOwner(fbUser.email || undefined);
            const newProfile: UserProfile = {
              id: fbUser.uid,
              username: fbUser.email ? fbUser.email.split('@')[0] : (fbUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'explorer'),
              displayName: fbUser.displayName || (fbUser.email?.split('@')[0] || 'Space Explorer'),
              email: fbUser.email || undefined,
              avatar: fbUser.photoURL || DEFAULT_AVATAR_PLACEHOLDER,
              banner: DEFAULT_BANNER_PLACEHOLDER,
              bio: isOwner ? 'SpaceTalk Founder & Sovereign Node Owner' : 'Verified decentralized communications node.',
              joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              isVerified: true,
              isOwner: isOwner,
              isVerifiedGoogle: true,
              isVerifiedGmail: true,
              isGuest: false,
              wallets: {
                btc: 'bc1q9x3d8y2m7v0e8w2k9p4s6t1u3z5w7y8a',
                eth: '0x71C8F32B5e69e71A598B6D197120c920D32894B2',
                xmr: '888tNkZrPN6JsEAnkjujijjncE5nd4Bgy',
                sol: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
              },
              socials: {},
              stats: {
                transmissions: 1,
                followers: isOwner ? 254 : 12,
                following: 4,
                tipsReceivedUsd: isOwner ? 500 : 0,
              },
            };
            await saveUserToFirestore(newProfile);
            setUser(newProfile);
            setAuthStatus('active');
          }
        } catch (err) {
          console.error("Failed to restore session from Firestore:", err);
        }
      }
      setLoading(false);
    });

    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => {
      unsubscribePosts();
      unsubscribeShorts();
      unsubscribeChannels();
      unsubscribeAuth();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Sync user state with localStorage to maintain persistent login on refresh
  useEffect(() => {
    if (user && !user.isGuest) {
      try {
        localStorage.setItem('spacetalk_session_user', JSON.stringify(user));
      } catch (e) {
        console.warn('Failed to cache session user:', e);
      }
    } else if (!user) {
      localStorage.removeItem('spacetalk_session_user');
    }
  }, [user]);

  const handleUpdatePost = (updatedPost: PostItem) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    savePostToFirestore(updatedPost);
  };

  const handleCreatePost = (newPost: PostItem) => {
    setPosts([newPost, ...posts]);
    savePostToFirestore(newPost);
    showToast('Post broadcasted to network and stored in database!');
  };

  const handleUpdateShort = (updatedShort: ShortItem) => {
    setShorts(prev => prev.map(s => s.id === updatedShort.id ? updatedShort : s));
    saveShortToFirestore(updatedShort);
  };

  const handleAddShort = (newShort: ShortItem) => {
    setShorts([newShort, ...shorts]);
    saveShortToFirestore(newShort);
    showToast('Short transmission broadcasted to network!');
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    if (!updated.isGuest) {
      saveUserToFirestore(updated);
    }
  };

  const handleLogout = async () => {
    playSound('pop');
    try {
      await logOut();
    } catch (e) {
      console.warn("Logout warning:", e);
    }
    localStorage.removeItem('spacetalk_session_user');
    setUser(null);
    setAuthStatus('landing');
    showToast('Disconnected node identity.');
  };

  const handleAcceptFriendRequest = (reqId: string) => {
    const req = friendRequests.find(r => r.id === reqId);
    if (!req) return;

    // Add to friends
    const newFriend: FriendItem = {
      id: `fr_${Date.now()}`,
      username: req.fromUser.username,
      displayName: req.fromUser.displayName,
      avatar: req.fromUser.avatar,
      bio: req.fromUser.bio || 'Verified peer contact',
      status: 'online',
      isVerified: req.fromUser.isVerified,
    };
    setFriends([newFriend, ...friends]);
    setFriendRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleDeclineFriendRequest = (reqId: string) => {
    setFriendRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleSendFriendRequest = (targetUsername: string) => {
    const newReq: FriendRequest = {
      id: `freq_${Date.now()}`,
      fromUser: {
        id: user?.id || 'usr_me',
        username: user?.username || 'me',
        displayName: user?.displayName || 'Me',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=200&auto=format&fit=crop&q=80',
        bio: user?.bio,
        isVerified: user?.isVerified,
        isVerifiedGoogle: user?.isVerifiedGoogle,
        isVerifiedGmail: user?.isVerifiedGmail,
      },
      toUserId: targetUsername,
      timestamp: 'Just now',
      status: 'pending',
    };
    // Also simulate creating a pending contact or adding to requested list
    showToast(`Friend transmission sent to @${targetUsername}!`);
  };

  const handleNavigateToChat = (friendUsername: string) => {
    // Check if channel already exists
    let existingChannel = channels.find(c => c.name.toLowerCase() === friendUsername.toLowerCase());
    if (!existingChannel) {
      const friendObj = friends.find(f => f.username.toLowerCase() === friendUsername.toLowerCase());
      const newChannel: ChatChannel = {
        id: `ch_${Date.now()}`,
        name: friendObj?.displayName || friendUsername,
        type: 'direct',
        avatar: friendObj?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        lastMessage: 'Direct unfiltered handshake established',
        lastTime: 'Just now',
        unread: 0,
        isEncrypted: true,
        isUnfiltered: true,
        messages: [
          {
            id: `m_${Date.now()}`,
            senderId: 'system',
            senderName: 'Mesh Relay',
            senderAvatar: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80',
            text: `Unfiltered encryption channel active with @${friendUsername}.`,
            timestamp: 'Just now',
            isMe: false,
          }
        ],
      };
      setChannels([newChannel, ...channels]);
    }
    setCurrentTab('inbox');
  };

  const handleRequireAuth = (action: string) => {
    playSound('pop');
    setGuestRestrictionAction(action);
  };

  const handleToggleFollow = (targetUsername: string, userDetails?: Partial<FollowUser>) => {
    if (user?.isGuest) {
      handleRequireAuth('follow creators');
      return;
    }

    const isCurrentlyFollowing = following.some(
      (f) => f.username.toLowerCase() === targetUsername.toLowerCase()
    );

    if (isCurrentlyFollowing) {
      playSound('pop');
      setFollowing((prev) =>
        prev.filter((f) => f.username.toLowerCase() !== targetUsername.toLowerCase())
      );
      if (user) {
        setUser({
          ...user,
          stats: {
            ...user.stats,
            following: Math.max(0, (user.stats?.following || 1) - 1),
          },
        });
      }
      showToast(`Unfollowed @${targetUsername}`);
    } else {
      playSound('chime');
      const newFollow: FollowUser = {
        id: userDetails?.id || `follow_${Date.now()}`,
        username: targetUsername,
        displayName: userDetails?.displayName || targetUsername,
        avatar: userDetails?.avatar || DEFAULT_AVATAR_PLACEHOLDER,
        bio: userDetails?.bio || 'Sovereign network peer node',
        isVerified: userDetails?.isVerified,
        followersCount: (userDetails?.followersCount || 0) + 1,
        isFollowing: true,
      };
      setFollowing((prev) => [newFollow, ...prev]);
      if (user) {
        setUser({
          ...user,
          stats: {
            ...user.stats,
            following: (user.stats?.following || 0) + 1,
          },
        });
      }
      showToast(`Now following @${targetUsername}!`);
    }
  };

  const handleSetGuestMode = () => {
    setUser({
      id: 'usr_guest',
      username: 'guest',
      displayName: 'Guest Explorer',
      avatar: DEFAULT_AVATAR_PLACEHOLDER,
      banner: DEFAULT_BANNER_PLACEHOLDER,
      bio: 'Browsing planetary SpaceTalk in Read-Only Guest Mode.',
      joinedDate: 'Just now',
      isVerified: false,
      isGuest: true,
      wallets: {},
      socials: {},
      stats: {
        transmissions: 0,
        followers: 0,
        following: 0,
        tipsReceivedUsd: 0,
      },
    });
    setAuthStatus('active');
    setCurrentTab('posts');
    showToast('Entered as Guest (Read-Only Mode)');
  };

  const totalUnreadMessages = channels.reduce((acc, c) => acc + c.unread, 0);
  const pendingRequestsCount = friendRequests.filter(r => r.status === 'pending').length;

  if (loading) {
    return <LoadingScreen glassBase={glassBase} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 relative font-sans ${
      theme === 'dark' ? 'dark bg-black text-white' : 'light bg-zinc-100 text-zinc-950'
    }`}>
      {/* Background Subtle Monochromatic Vignette */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-zinc-900/[0.04] dark:bg-white/[0.02] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-900/[0.04] dark:bg-white/[0.02] blur-[150px] rounded-full" />
      </div>

      {/* Guest Mode Floating Warning Banner */}
      {user?.isGuest && (
        <div className="sticky top-0 z-[160] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center justify-between text-xs font-mono shadow-sm">
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Eye className="w-4 h-4 text-zinc-950 dark:text-white animate-pulse" />
            <span>Viewing in <strong>Guest Mode (Read-Only)</strong></span>
          </div>
          <button
            onClick={() => {
              playSound('chime');
              setAuthStatus('landing');
            }}
            className="px-3 py-1 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition-all flex items-center gap-1 text-[11px]"
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In / Verify</span>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[170] px-5 py-3 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold text-xs shadow-2xl flex items-center gap-2 font-mono border border-zinc-700 dark:border-zinc-200"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-white dark:text-black" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {authStatus !== 'active' || !user ? (
          <AuthSection
            status={authStatus}
            setStatus={setAuthStatus}
            setUser={(u) => {
              setUser(u);
              setAuthStatus('active');
            }}
            glassBase={glassBase}
            rounded={roundedLarge}
            onSetGuestMode={handleSetGuestMode}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 max-w-2xl mx-auto px-4 pt-5 pb-36"
          >
            {/* Top Global Header */}
            <header className="flex justify-between items-center mb-6 px-1">
              <div
                onClick={() => {
                  playSound('click');
                  setCurrentTab('posts');
                }}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="group-hover:scale-105 transition-transform">
                  <LOGOS.SpaceTalk className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-xl font-black tracking-widest uppercase font-mono text-zinc-950 dark:text-white">
                      SpaceTalk
                    </h1>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 dark:bg-white animate-pulse" />
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 -mt-0.5">Kepler Sovereign Mesh</p>
                </div>
              </div>

              {/* Utility Action Buttons */}
              <div className="flex items-center gap-2">
                {/* User quick badge indicator */}
                {!user.isGuest && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                    <span className="font-bold text-zinc-950 dark:text-white">@{user.username}</span>
                    <UserBadge
                      isOwner={user.isOwner}
                      isVerified={user.isVerified || user.isVerifiedGoogle || user.isVerifiedGmail}
                      email={user.email}
                      username={user.username}
                      size="xs"
                    />
                  </div>
                )}

                {/* Sound toggle */}
                <button
                  id="btn-sound-toggle"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    playSound('click');
                  }}
                  className={`${glassBase} p-2.5 rounded-2xl hover:scale-105 active:scale-95 transition-all text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-sm`}
                  title={soundEnabled ? 'Disable Audio Feedback' : 'Enable Audio Feedback'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-zinc-950 dark:text-white" /> : <VolumeX className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />}
                </button>

                {/* Theme toggle */}
                <button
                  id="btn-theme-toggle"
                  onClick={() => {
                    playSound('click');
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                  }}
                  className={`${glassBase} p-2.5 rounded-2xl hover:scale-105 active:scale-95 transition-all text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-sm`}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-zinc-950" />}
                </button>

                {/* Profile mini avatar shortcut */}
                <button
                  onClick={() => {
                    if (user.isGuest) {
                      handleRequireAuth('access profile settings');
                      return;
                    }
                    playSound('click');
                    setCurrentTab('profile');
                  }}
                  className="relative group p-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 overflow-hidden hover:border-zinc-950 dark:hover:border-white transition-colors cursor-pointer shadow-sm"
                  title="My Sovereign Profile"
                >
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-transform grayscale"
                  />
                </button>
              </div>
            </header>

            {/* Dynamic Content Views: Posts, Shorts, Inbox, Friend Requests, Profile with Smooth Animated Page Transitions */}
            <main>
              <AnimatePresence mode="wait">
                {currentTab === 'posts' && (
                  <motion.div
                    key="tab-posts"
                    initial={{ opacity: 0, y: 12, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.995 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Feed
                      posts={posts}
                      stories={stories}
                      shorts={shorts}
                      user={user}
                      glass={glassBase}
                      rounded={roundedMedium}
                      following={following}
                      onToggleFollow={handleToggleFollow}
                      onStartChat={handleNavigateToChat}
                      onOpenStories={(idx) => setActiveStoryIndex(idx)}
                      onOpenTip={(author) => setTipTargetUser(author)}
                      onUpdatePost={handleUpdatePost}
                      onOpenAddPost={() => {
                        if (user.isGuest) {
                          handleRequireAuth('create posts');
                          return;
                        }
                        setIsAddPostOpen(true);
                      }}
                      onShowToast={showToast}
                      onRequireAuth={handleRequireAuth}
                    />
                  </motion.div>
                )}

                {currentTab === 'shorts' && (
                  <motion.div
                    key="tab-shorts"
                    initial={{ opacity: 0, y: 12, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.995 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ShortsView
                      shorts={shorts}
                      user={user}
                      glass={glassBase}
                      rounded={roundedMedium}
                      following={following}
                      onToggleFollow={handleToggleFollow}
                      onUpdateShort={handleUpdateShort}
                      onAddShort={handleAddShort}
                      onShowToast={showToast}
                      onRequireAuth={handleRequireAuth}
                    />
                  </motion.div>
                )}

                {currentTab === 'inbox' && (
                  <motion.div
                    key="tab-inbox"
                    initial={{ opacity: 0, y: 12, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.995 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ChatView
                      channels={channels}
                      user={user}
                      glass={glassBase}
                      rounded={roundedMedium}
                      onOpenTip={(target) => setTipTargetUser(target)}
                      onUpdateChannels={(c) => setChannels(c)}
                      onRequireAuth={handleRequireAuth}
                      onShowToast={showToast}
                    />
                  </motion.div>
                )}

                {currentTab === 'friends' && (
                  <motion.div
                    key="tab-friends"
                    initial={{ opacity: 0, y: 12, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.995 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <FriendRequestsView
                      requests={friendRequests}
                      friends={friends}
                      user={user}
                      glass={glassBase}
                      rounded={roundedMedium}
                      onAcceptRequest={handleAcceptFriendRequest}
                      onDeclineRequest={handleDeclineFriendRequest}
                      onSendRequest={handleSendFriendRequest}
                      onNavigateToChat={handleNavigateToChat}
                      onShowToast={showToast}
                      onRequireAuth={handleRequireAuth}
                    />
                  </motion.div>
                )}

                {currentTab === 'profile' && (
                  <motion.div
                    key="tab-profile"
                    initial={{ opacity: 0, y: 12, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.995 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProfileView
                      user={user}
                      posts={posts}
                      glass={glassBase}
                      rounded={roundedMedium}
                      followers={followers}
                      following={following}
                      onToggleFollow={handleToggleFollow}
                      onStartChat={handleNavigateToChat}
                      onUpdateUser={handleUpdateUser}
                      onLogout={handleLogout}
                      onShowToast={showToast}
                      onOpenTip={(target) => setTipTargetUser(target)}
                      onRequireAuth={handleRequireAuth}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Navigation Bar */}
            <NavBar
              active={currentTab}
              setTab={setCurrentTab}
              onOpenAddPost={() => {
                if (user.isGuest) {
                  handleRequireAuth('create posts');
                  return;
                }
                setIsAddPostOpen(true);
              }}
              glass={glassBase}
              unreadInboxCount={totalUnreadMessages}
              pendingFriendsCount={pendingRequestsCount}
              onRequireAuth={handleRequireAuth}
              isGuest={user.isGuest}
            />

            {/* Global Stories Fullscreen Modal */}
            {activeStoryIndex !== null && (
              <StoryViewerModal
                stories={stories}
                initialStoryIndex={activeStoryIndex}
                onClose={() => setActiveStoryIndex(null)}
              />
            )}

            {/* Global Creator Wallets & Donations Modal */}
            {tipTargetUser && (
              <TipModal
                targetUser={tipTargetUser}
                glassBase={glassBase}
                onClose={() => setTipTargetUser(null)}
                onShowToast={showToast}
              />
            )}

            {/* Global Add Post Modal */}
            {isAddPostOpen && (
              <CreatePostModal
                user={user}
                glassBase={glassBase}
                onClose={() => setIsAddPostOpen(false)}
                onPostCreated={handleCreatePost}
                onShowToast={showToast}
              />
            )}

            {/* Guest Action Restriction Modal */}
            <GuestModal
              isOpen={Boolean(guestRestrictionAction)}
              onClose={() => setGuestRestrictionAction(null)}
              actionName={guestRestrictionAction || 'interact'}
              onOpenAuth={(mode) => {
                setGuestRestrictionAction(null);
                setAuthStatus(mode === 'google' ? 'landing' : 'signup');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
