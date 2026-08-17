import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, PostItem, ShortItem, ChatChannel, FriendRequest, FriendItem } from '../types';
import { DEFAULT_AVATAR_PLACEHOLDER, DEFAULT_BANNER_PLACEHOLDER } from '../utils/placeholders';
import { INITIAL_POSTS, INITIAL_SHORTS, INITIAL_CHANNELS, INITIAL_FRIEND_REQUESTS, INITIAL_FRIENDS } from '../data/mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();

export const OWNER_EMAIL = 'fxruzzo@gmail.com';

export function checkIsOwner(email?: string): boolean {
  const cleanEmail = (email || '').toLowerCase().trim();
  return cleanEmail === OWNER_EMAIL;
}

export function buildUserProfile(
  uid: string, 
  username: string, 
  email?: string, 
  displayName?: string, 
  avatar?: string,
  existingDoc?: Partial<UserProfile>
): UserProfile {
  const isOwner = checkIsOwner(email);
  const isVerified = isOwner || existingDoc?.isVerified === true;

  return {
    id: uid,
    username: username.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) || `user_${uid.slice(0, 5)}`,
    displayName: displayName || username || 'Sovereign Node',
    avatar: avatar || existingDoc?.avatar || DEFAULT_AVATAR_PLACEHOLDER,
    banner: existingDoc?.banner || DEFAULT_BANNER_PLACEHOLDER,
    bio: existingDoc?.bio || (isOwner ? '👑 Platform Owner & Sovereign Creator of SpaceTalk.' : 'Sovereign node authenticated on SpaceTalk.'),
    joinedDate: existingDoc?.joinedDate || 'Stardate 2026.08',
    location: existingDoc?.location || 'Sovereign Node',
    isVerified,
    isOwner,
    isGuest: false,
    email: email || existingDoc?.email || '',
    isVerifiedGoogle: existingDoc?.isVerifiedGoogle || Boolean(email?.includes('@')),
    isVerifiedGmail: existingDoc?.isVerifiedGmail || Boolean(email?.includes('@gmail.com')),
    wallets: existingDoc?.wallets || { btc: '', eth: '', xmr: '', sol: '' },
    socials: existingDoc?.socials || { tiktok: '', youtube: '', discord: '', telegram: '', x: '', github: '' },
    stats: existingDoc?.stats || { transmissions: 0, followers: 0, following: 0, tipsReceivedUsd: 0 },
  };
}

// ----------------- USER PROFILE FIRESTORE METHODS -----------------

export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  try {
    const isOwner = checkIsOwner(user.email);
    const userDocRef = doc(db, 'users', user.id);
    const payload = {
      ...user,
      isOwner,
      isVerified: isOwner || user.isVerified === true,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, payload, { merge: true });
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
  }
}

export async function getUserFromFirestore(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const isOwner = checkIsOwner(data.email);
      return {
        ...data,
        isOwner,
        isVerified: isOwner || data.isVerified === true,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user from Firestore:', error);
    return null;
  }
}

export async function findUserByHandleOrEmail(identifier: string): Promise<UserProfile | null> {
  try {
    const clean = identifier.trim().toLowerCase().replace(/^@/, '');
    
    // Search by username
    const usernameQuery = query(collection(db, 'users'), where('username', '==', clean));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) {
      const data = usernameSnap.docs[0].data() as UserProfile;
      return {
        ...data,
        isOwner: checkIsOwner(data.email),
        isVerified: checkIsOwner(data.email) || data.isVerified === true,
      };
    }

    // Search by email
    const emailQuery = query(collection(db, 'users'), where('email', '==', clean));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      const data = emailSnap.docs[0].data() as UserProfile;
      return {
        ...data,
        isOwner: checkIsOwner(data.email),
        isVerified: checkIsOwner(data.email) || data.isVerified === true,
      };
    }

    return null;
  } catch (error) {
    console.error('Error searching user in Firestore:', error);
    return null;
  }
}

// ----------------- AUTH HANDLERS -----------------

export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const email = fbUser.email || '';
  const displayName = fbUser.displayName || email.split('@')[0] || 'User';
  const username = (email.split('@')[0] || displayName).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18);
  const avatar = fbUser.photoURL || DEFAULT_AVATAR_PLACEHOLDER;

  // Check if existing user in Firestore
  let profile = await getUserFromFirestore(fbUser.uid);
  if (!profile) {
    profile = buildUserProfile(fbUser.uid, username, email, displayName, avatar);
    await saveUserToFirestore(profile);
  } else {
    // Ensure owner/verified are up to date if logging in with fxruzzo@gmail.com
    if (checkIsOwner(email)) {
      profile.isOwner = true;
      profile.isVerified = true;
      profile.email = email;
      await saveUserToFirestore(profile);
    }
  }

  return profile;
}

export async function registerWithCredentials(
  username: string, 
  email: string, 
  password?: string, 
  avatar?: string
): Promise<UserProfile> {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18);
  const cleanEmail = email.trim().toLowerCase();
  
  // Use real Firebase Auth email signup if email & password are provided
  let uid = '';
  if (cleanEmail && password && password.length >= 6) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      uid = userCredential.user.uid;
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        uid = userCredential.user.uid;
      } else {
        // Fallback to synthetic unique UID
        uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      }
    }
  } else {
    // Guest or anonymous / handle-based registration
    try {
      const anon = await signInAnonymously(auth);
      uid = anon.user.uid;
    } catch {
      uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
  }

  const profile = buildUserProfile(uid, cleanUsername, cleanEmail, username.trim(), avatar);
  await saveUserToFirestore(profile);
  return profile;
}

export async function loginWithCredentials(identifier: string, password?: string): Promise<UserProfile> {
  const clean = identifier.trim().toLowerCase();

  // Try direct email auth if identifier is email and password >= 6
  if (clean.includes('@') && password && password.length >= 6) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, clean, password);
      const existing = await getUserFromFirestore(userCredential.user.uid);
      if (existing) return existing;
      
      const username = clean.split('@')[0].slice(0, 18);
      const newProfile = buildUserProfile(userCredential.user.uid, username, clean);
      await saveUserToFirestore(newProfile);
      return newProfile;
    } catch (err: any) {
      console.warn('Firebase email auth login failed, searching Firestore:', err.message);
    }
  }

  // Search Firestore for the user document
  const foundUser = await findUserByHandleOrEmail(clean);
  if (!foundUser) {
    throw new Error(`No account found for @${clean}. Please create an account first.`);
  }

  // If found, sign in anonymously if not authenticated to maintain session
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonymous session error:', e);
    }
  }

  return foundUser;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// ----------------- FIRESTORE DATA SYNC HELPERS -----------------

export async function seedInitialDataIfEmpty(
  customPosts?: PostItem[],
  customShorts?: ShortItem[],
  customChannels?: ChatChannel[]
): Promise<void> {
  try {
    const postsSnap = await getDocs(collection(db, 'posts'));
    if (postsSnap.empty) {
      const postsToSeed = customPosts || INITIAL_POSTS;
      for (const p of postsToSeed) {
        await setDoc(doc(db, 'posts', p.id), { ...p, createdAt: new Date().toISOString() });
      }
    }

    const shortsSnap = await getDocs(collection(db, 'shorts'));
    if (shortsSnap.empty) {
      const shortsToSeed = customShorts || INITIAL_SHORTS;
      for (const s of shortsToSeed) {
        await setDoc(doc(db, 'shorts', s.id), { ...s, createdAt: new Date().toISOString() });
      }
    }

    const channelsSnap = await getDocs(collection(db, 'channels'));
    if (channelsSnap.empty) {
      const channelsToSeed = customChannels || INITIAL_CHANNELS;
      for (const c of channelsToSeed) {
        await setDoc(doc(db, 'channels', c.id), { ...c, createdAt: new Date().toISOString() });
      }
    }
  } catch (error) {
    console.warn('Could not seed initial data in Firestore:', error);
  }
}

export function subscribeToPosts(onUpdate: (posts: PostItem[]) => void): () => void {
  const postsRef = collection(db, 'posts');
  return onSnapshot(postsRef, (snap) => {
    if (!snap.empty) {
      const items: PostItem[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as PostItem;
        items.push({
          ...d,
          id: doc.id,
          author: {
            ...d.author,
            isOwner: checkIsOwner(d.author?.email),
            isVerified: checkIsOwner(d.author?.email) || d.author?.isVerified === true,
          }
        });
      });
      // Sort newest first
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      onUpdate(items);
    }
  }, (err) => {
    console.warn('Firestore posts subscribe error:', err);
  });
}

export async function savePostToFirestore(post: PostItem): Promise<void> {
  try {
    const isOwner = checkIsOwner(post.author?.email);
    const cleanPost: PostItem = {
      ...post,
      author: {
        ...post.author,
        isOwner,
        isVerified: isOwner || post.author?.isVerified === true,
      }
    };
    await setDoc(doc(db, 'posts', post.id), {
      ...cleanPost,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving post to Firestore:', error);
  }
}

export function subscribeToShorts(onUpdate: (shorts: ShortItem[]) => void): () => void {
  const shortsRef = collection(db, 'shorts');
  return onSnapshot(shortsRef, (snap) => {
    if (!snap.empty) {
      const items: ShortItem[] = [];
      snap.forEach((doc) => {
        const s = doc.data() as ShortItem;
        items.push({
          ...s,
          id: doc.id,
          author: {
            ...s.author,
            isOwner: checkIsOwner(s.author?.email),
            isVerified: checkIsOwner(s.author?.email) || s.author?.isVerified === true,
          }
        });
      });
      onUpdate(items);
    }
  }, (err) => {
    console.warn('Firestore shorts subscribe error:', err);
  });
}

export async function saveShortToFirestore(short: ShortItem): Promise<void> {
  try {
    const isOwner = checkIsOwner(short.author?.email);
    const cleanShort: ShortItem = {
      ...short,
      author: {
        ...short.author,
        isOwner,
        isVerified: isOwner || short.author?.isVerified === true,
      }
    };
    await setDoc(doc(db, 'shorts', short.id), {
      ...cleanShort,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving short to Firestore:', error);
  }
}

export function subscribeToChannels(onUpdate: (channels: ChatChannel[]) => void): () => void {
  const channelsRef = collection(db, 'channels');
  return onSnapshot(channelsRef, (snap) => {
    if (!snap.empty) {
      const items: ChatChannel[] = [];
      snap.forEach((doc) => {
        items.push({ ...(doc.data() as ChatChannel), id: doc.id });
      });
      onUpdate(items);
    }
  }, (err) => {
    console.warn('Firestore channels subscribe error:', err);
  });
}

export async function saveChannelToFirestore(channel: ChatChannel): Promise<void> {
  try {
    await setDoc(doc(db, 'channels', channel.id), channel, { merge: true });
  } catch (error) {
    console.error('Error saving channel to Firestore:', error);
  }
}
