import { 
  UserProfile, 
  StoryItem, 
  PostItem, 
  ChatChannel, 
  FriendRequest, 
  FriendItem, 
  ShortItem 
} from '../types';
import { DEFAULT_AVATAR_PLACEHOLDER, DEFAULT_BANNER_PLACEHOLDER } from '../utils/placeholders';

// Empty default profile template using standard placeholder avatar
export const INITIAL_USER: UserProfile = {
  id: 'usr_new',
  username: '',
  displayName: 'Anonymous Peer',
  avatar: DEFAULT_AVATAR_PLACEHOLDER,
  banner: DEFAULT_BANNER_PLACEHOLDER,
  bio: 'Sovereign node. Cryptographically authenticated.',
  joinedDate: 'Stardate 2026.08',
  location: 'Decentralized Mesh',
  isVerified: false,
  isVerifiedGoogle: false,
  isVerifiedGmail: false,
  email: '',
  isGuest: false,
  wallets: {
    btc: '',
    eth: '',
    xmr: '',
    sol: '',
  },
  socials: {
    tiktok: '',
    youtube: '',
    discord: '',
    telegram: '',
    x: '',
    github: '',
  },
  stats: {
    transmissions: 0,
    followers: 0,
    following: 0,
    tipsReceivedUsd: 0,
  },
};

export const INITIAL_POSTS: PostItem[] = [];

export const INITIAL_STORIES: StoryItem[] = [];

export const INITIAL_CHANNELS: ChatChannel[] = [];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [];

export const INITIAL_FRIENDS: FriendItem[] = [];

export const INITIAL_SHORTS: ShortItem[] = [];
