import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  getUserFromFirestore, 
  saveUserToFirestore,
  updateUsernameInFirestore,
  subscribeToAllUsers,
  saveFollowingToFirestore,
  getFollowingFromFirestore,
  saveFollowersToFirestore,
  getFollowersFromFirestore,
  toggleFollowInFirestore,
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
  FollowUser,
  SavedAccount
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
  const [following, setFollowing] = useState<FollowUser[]>(() => {
    try {
      const cached = localStorage.getItem('spacetalk_session_user');
      if (cached) {
        const u = JSON.parse(cached);
        if (Array.isArray(u.followingList) && u.followingList.length > 0) {
          return u.followingList.filter((f: any) => f && f.username);
        }
      }
      const cachedFollowing = localStorage.getItem('spacetalk_following_cache');
      return cachedFollowing ? JSON.parse(cachedFollowing).filter((f: any) => f && f.username) : [];
    } catch {
      return [];
    }
  });

  const [followers, setFollowers] = useState<FollowUser[]>(() => {
    try {
      const cached = localStorage.getItem('spacetalk_session_user');
      if (cached) {
        const u = JSON.parse(cached);
        if (Array.isArray(u.followersList) && u.followersList.length > 0) {
          return u.followersList.filter((f: any) => f && f.username);
        }
      }
      const cachedFollowers = localStorage.getItem('spacetalk_followers_cache');
      return cachedFollowers ? JSON.parse(cachedFollowers).filter((f: any) => f && f.username) : [];
    } catch {
      return [];
    }
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    try {
      const raw = localStorage.getItem('spacetalk_saved_accounts');
      if (raw) return JSON.parse(raw);
      const cached = localStorage.getItem('spacetalk_session_user');
      if (cached) {
        const u = JSON.parse(cached);
        if (!u.isGuest) {
          return [{
            id: u.id,
            username: u.username,
            displayName: u.displayName || u.username,
            avatar: u.avatar || DEFAULT_AVATAR_PLACEHOLDER,
            email: u.email,
            isOwner: u.isOwner,
            isVerified: u.isVerified,
            lastActive: new Date().toISOString(),
          }];
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Modals & Toast State
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [tipTargetUser, setTipTargetUser] = useState<PostItem['author'] | null>(null);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [guestRestrictionAction, setGuestRestrictionAction] = useState<string | null>(null);

  // Liquid Glass Constant Classes in Glowing Monochrome
  const glassBase = theme === 'dark' 
    ? "bg-zinc-950/85 backdrop-blur-[30px] border border-white/20 shadow-[0_0_25px_rgba(255,255,255,0.08)] text-white" 
    : "bg-white/95 backdrop-blur-[30px] border border-zinc-300 shadow-[0_0_20px_rgba(0,0,0,0.06)] text-zinc-950";
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

    // 5. Real-time listener for All Network Users (for universal search and handle indexing)
    const unsubscribeUsers = subscribeToAllUsers((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        setAllUsers(firestoreUsers);
      }
    });

    // 6. Firebase Auth State listener to maintain session across reloads
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getUserFromFirestore(fbUser.uid);
          if (profile) {
            setUser(profile);
            setAuthStatus('active');
            // Sync following from Firestore
            if (profile.followingList && profile.followingList.length > 0) {
              setFollowing(profile.followingList.filter((f) => f && f.username));
            } else {
              const remoteFollows = await getFollowingFromFirestore(fbUser.uid);
              if (remoteFollows && remoteFollows.length > 0) {
                setFollowing(remoteFollows.filter((f) => f && f.username));
              }
            }
            // Sync followers from Firestore
            if (profile.followersList && profile.followersList.length > 0) {
              setFollowers(profile.followersList.filter((f) => f && f.username));
            } else {
              const remoteFollowers = await getFollowersFromFirestore(fbUser.uid);
              if (remoteFollowers && remoteFollowers.length > 0) {
                setFollowers(remoteFollowers.filter((f) => f && f.username));
              }
            }
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
      unsubscribeUsers();
      unsubscribeAuth();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Sync user state with localStorage and savedAccounts list to maintain persistent multi-account state
  useEffect(() => {
    if (user && !user.isGuest) {
      try {
        localStorage.setItem('spacetalk_session_user', JSON.stringify(user));
        setSavedAccounts((prev) => {
          const existingIdx = prev.findIndex((a) => a.id === user.id || a.username.toLowerCase() === user.username.toLowerCase());
          const newEntry: SavedAccount = {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: user.avatar || DEFAULT_AVATAR_PLACEHOLDER,
            email: user.email,
            isOwner: user.isOwner,
            isVerified: user.isVerified,
            lastActive: new Date().toISOString(),
          };
          let updated: SavedAccount[];
          if (existingIdx >= 0) {
            updated = [...prev];
            updated[existingIdx] = newEntry;
          } else {
            updated = [newEntry, ...prev];
          }
          localStorage.setItem('spacetalk_saved_accounts', JSON.stringify(updated));
          return updated;
        });
      } catch (e) {
        console.warn('Failed to cache session user:', e);
      }
    } else if (!user) {
      localStorage.removeItem('spacetalk_session_user');
    }
  }, [user]);

  // Sync following cache
  useEffect(() => {
    if (user && !user.isGuest) {
      try {
        localStorage.setItem('spacetalk_following_cache', JSON.stringify(following));
        localStorage.setItem(`spacetalk_following_${user.id}`, JSON.stringify(following));
      } catch (e) {
        console.warn('Failed to cache following:', e);
      }
    }
  }, [following, user]);

  // Sync followers cache
  useEffect(() => {
    if (user && !user.isGuest) {
      try {
        localStorage.setItem('spacetalk_followers_cache', JSON.stringify(followers));
        localStorage.setItem(`spacetalk_followers_${user.id}`, JSON.stringify(followers));
      } catch (e) {
        console.warn('Failed to cache followers:', e);
      }
    }
  }, [followers, user]);

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

  const handleUpdateUsername = async (newUsername: string): Promise<boolean> => {
    if (!user || user.isGuest) return false;
    try {
      const res = await updateUsernameInFirestore(user.id, user.username, newUsername);
      if (res && res.success) {
        const updatedUser: UserProfile = { ...user, username: res.newUsername };
        setUser(updatedUser);
        setSavedAccounts((prev) => {
          const next = prev.map((a) => (a.id === user.id ? { ...a, username: res.newUsername } : a));
          localStorage.setItem('spacetalk_saved_accounts', JSON.stringify(next));
          return next;
        });
        showToast(`Sovereign handle updated to @${res.newUsername}`);
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err?.message || 'Failed to update username handle.');
      throw err;
    }
  };

  const handleRemoveSavedAccount = (accountIdOrUsername: string) => {
    playSound('pop');
    setSavedAccounts((prev) => {
      const filtered = prev.filter(
        (a) => a.id !== accountIdOrUsername && a.username.toLowerCase() !== accountIdOrUsername.toLowerCase()
      );
      localStorage.setItem('spacetalk_saved_accounts', JSON.stringify(filtered));
      return filtered;
    });
    showToast('Node account removed from this device.');
  };

  const handleSwitchAccount = async (targetAccount: SavedAccount | UserProfile) => {
    playSound('chime');
    let fullProfile: UserProfile | null = null;
    try {
      fullProfile = await getUserFromFirestore(targetAccount.id);
    } catch (e) {
      console.warn("Failed to fetch full user on switch:", e);
    }

    if (!fullProfile) {
      fullProfile = {
        id: targetAccount.id,
        username: targetAccount.username,
        displayName: targetAccount.displayName,
        avatar: targetAccount.avatar || DEFAULT_AVATAR_PLACEHOLDER,
        banner: (targetAccount as UserProfile).banner || DEFAULT_BANNER_PLACEHOLDER,
        bio: (targetAccount as UserProfile).bio || 'Decentralized node operator.',
        joinedDate: (targetAccount as UserProfile).joinedDate || 'Recently',
        isOwner: targetAccount.isOwner,
        isVerified: targetAccount.isVerified,
        isGuest: false,
        email: targetAccount.email,
        wallets: (targetAccount as UserProfile).wallets || {
          btc: 'bc1q9x3d8y2m7v0e8w2k9p4s6t1u3z5w7y8a',
          eth: '0x71C8F32B5e69e71A598B6D197120c920D32894B2',
          xmr: '888tNkZrPN6JsEAnkjujijjncE5nd4Bgy',
          sol: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        },
        socials: (targetAccount as UserProfile).socials || {},
        stats: (targetAccount as UserProfile).stats || {
          transmissions: 0,
          followers: 0,
          following: 0,
          tipsReceivedUsd: 0,
        },
      };
    }

    setUser(fullProfile);
    setAuthStatus('active');
    try {
      localStorage.setItem('spacetalk_session_user', JSON.stringify(fullProfile));
      if (fullProfile.followingList && fullProfile.followingList.length > 0) {
        setFollowing(fullProfile.followingList.filter((f) => f && f.username));
      } else {
        const remoteFollows = await getFollowingFromFirestore(fullProfile.id);
        if (remoteFollows && remoteFollows.length > 0) {
          setFollowing(remoteFollows.filter((f) => f && f.username));
        } else {
          setFollowing([]);
        }
      }

      if (fullProfile.followersList && fullProfile.followersList.length > 0) {
        setFollowers(fullProfile.followersList.filter((f) => f && f.username));
      } else {
        const remoteFollowers = await getFollowersFromFirestore(fullProfile.id);
        if (remoteFollowers && remoteFollowers.length > 0) {
          setFollowers(remoteFollowers.filter((f) => f && f.username));
        } else {
          setFollowers([]);
        }
      }
    } catch (e) {
      console.warn("Failed to complete account switch:", e);
    }
    showToast(`Switched account to @${fullProfile.username}`);
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
    const cleanUsername = friendUsername.trim().replace(/^@/, '');
    if (!cleanUsername) return;

    // Ensure the peer is in following list if logged in
    if (user && !user.isGuest) {
      const isAlreadyFollowed = following.some(
        (f) => f.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (!isAlreadyFollowed) {
        const newFollow: FollowUser = {
          id: `follow_${Date.now()}`,
          username: cleanUsername,
          displayName: cleanUsername,
          avatar: DEFAULT_AVATAR_PLACEHOLDER,
          bio: 'Sovereign peer node',
          isFollowing: true,
        };
        const updatedFollows = [newFollow, ...following.filter((f) => f && f.username)];
        setFollowing(updatedFollows);
        saveFollowingToFirestore(user.id, updatedFollows);
      }
    }

    // Check if channel already exists
    let existingChannel = channels.find(c => c.name.toLowerCase() === cleanUsername.toLowerCase());
    if (!existingChannel) {
      const friendObj = friends.find(f => f.username.toLowerCase() === cleanUsername.toLowerCase());
      const followObj = following.find(f => f.username.toLowerCase() === cleanUsername.toLowerCase());
      const newChannel: ChatChannel = {
        id: `ch_${Date.now()}`,
        name: friendObj?.displayName || followObj?.displayName || cleanUsername,
        type: 'direct',
        avatar: friendObj?.avatar || followObj?.avatar || DEFAULT_AVATAR_PLACEHOLDER,
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
            text: `Unfiltered encryption channel active with @${cleanUsername}.`,
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

  const handleToggleFollow = async (targetUsername: string, userDetails?: Partial<FollowUser>) => {
    if (user?.isGuest) {
      handleRequireAuth('follow creators');
      return;
    }

    const cleanTarget = targetUsername.trim().replace(/^@/, '');
    if (!cleanTarget) return;

    const isCurrentlyFollowing = following.some(
      (f) => f && f.username && f.username.toLowerCase() === cleanTarget.toLowerCase()
    );

    if (isCurrentlyFollowing) {
      playSound('pop');
      const updatedFollowing = following.filter(
        (f) => f && f.username && f.username.toLowerCase() !== cleanTarget.toLowerCase()
      );
      setFollowing(updatedFollowing);
      if (user) {
        const updatedUser: UserProfile = {
          ...user,
          stats: {
            ...user.stats,
            following: updatedFollowing.length,
          },
          followingList: updatedFollowing,
        };
        setUser(updatedUser);
        saveFollowingToFirestore(user.id, updatedFollowing);
        toggleFollowInFirestore(user, cleanTarget, false, userDetails);
      }
      showToast(`Unfollowed @${cleanTarget}`);
    } else {
      playSound('chime');
      const newFollow: FollowUser = {
        id: userDetails?.id || `follow_${Date.now()}`,
        username: cleanTarget,
        displayName: userDetails?.displayName || cleanTarget,
        avatar: userDetails?.avatar || DEFAULT_AVATAR_PLACEHOLDER,
        bio: userDetails?.bio || 'Sovereign network peer node',
        isVerified: userDetails?.isVerified,
        followersCount: (userDetails?.followersCount || 0) + 1,
        isFollowing: true,
      };
      const updatedFollowing = [
        newFollow,
        ...following.filter((f) => f && f.username && f.username.toLowerCase() !== cleanTarget.toLowerCase()),
      ];
      setFollowing(updatedFollowing);
      if (user) {
        const updatedUser: UserProfile = {
          ...user,
          stats: {
            ...user.stats,
            following: updatedFollowing.length,
          },
          followingList: updatedFollowing,
        };
        setUser(updatedUser);
        saveFollowingToFirestore(user.id, updatedFollowing);
        toggleFollowInFirestore(user, cleanTarget, true, userDetails);
      }
      showToast(`Now following @${cleanTarget}!`);
    }
  };

  const handleRefreshFollowers = async () => {
    if (!user || user.isGuest) return;
    try {
      const [remoteFollowers, remoteFollowing] = await Promise.all([
        getFollowersFromFirestore(user.id),
        getFollowingFromFirestore(user.id),
      ]);
      if (remoteFollowers) setFollowers(remoteFollowers);
      if (remoteFollowing) setFollowing(remoteFollowing);
      showToast('Followers & Following synchronized with sovereign database');
    } catch (err) {
      console.warn('Refresh error:', err);
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
                    className="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-transform"
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
                      allUsers={allUsers}
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
                      savedAccounts={savedAccounts}
                      onToggleFollow={handleToggleFollow}
                      onRefreshFollowers={handleRefreshFollowers}
                      onStartChat={handleNavigateToChat}
                      onUpdateUser={handleUpdateUser}
                      onUpdateUsername={handleUpdateUsername}
                      onSwitchAccount={handleSwitchAccount}
                      onAddAnotherAccount={() => {
                        setAuthStatus('landing');
                      }}
                      onRemoveSavedAccount={handleRemoveSavedAccount}
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
