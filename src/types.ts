export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner: string;
  bio: string;
  joinedDate: string;
  location?: string;
  isVerified?: boolean;
  isGuest?: boolean;
  email?: string;
  isVerifiedGoogle?: boolean;
  isVerifiedGmail?: boolean;
  wallets: {
    btc?: string;
    eth?: string;
    xmr?: string;
    sol?: string;
  };
  socials: {
    tiktok?: string;
    youtube?: string;
    discord?: string;
    telegram?: string;
    x?: string;
    github?: string;
  };
  stats: {
    transmissions: number;
    followers: number;
    following: number;
    tipsReceivedUsd: number;
  };
}

export interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  followersCount?: number;
  isFollowing?: boolean;
}

export interface StoryItem {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  hasUnseen: boolean;
  stories: {
    id: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption: string;
    timestamp: string;
  }[];
}

export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export interface PostItem {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
    isVerifiedGoogle?: boolean;
    isVerifiedGmail?: boolean;
    walletAddress?: string;
  };
  content: string;
  images?: string[];
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tipsUsd: number;
  commentsCount: number;
  comments: CommentItem[];
  tags?: string[];
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  type?: 'text' | 'image' | 'audio' | 'tip';
  audioDuration?: string;
  tipAmount?: string;
  tipCurrency?: string;
  imageUrl?: string;
}

export type ChatMessage = MessageItem;

export interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'space';
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  isEncrypted: boolean;
  isUnfiltered: boolean;
  membersCount?: number;
  messages: MessageItem[];
}

export interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    bio?: string;
    isVerified?: boolean;
    isVerifiedGoogle?: boolean;
    isVerifiedGmail?: boolean;
  };
  toUserId: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface FriendItem {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  status: 'online' | 'offline' | 'transmitting';
  lastSeen?: string;
  isVerified?: boolean;
  walletAddress?: string;
}

export interface ShortItem {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
    isVerifiedGoogle?: boolean;
  };
  videoUrl: string;
  caption: string;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  musicTitle: string;
  timestamp: string;
  views: number;
}
