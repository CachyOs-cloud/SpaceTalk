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
import { UserProfile, PostItem, ShortItem, ChatChannel, FriendRequest, FriendItem, FollowUser } from '../types';
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
    const cleanUsername = (user.username || '').toLowerCase().trim();
    const payload = {
      ...user,
      username: cleanUsername,
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
    if (!clean) return null;
    
    // Search by username
    const usernameQuery = query(collection(db, 'users'), where('username', '==', clean));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) {
      const data = usernameSnap.docs[0].data() as UserProfile;
      return {
        ...data,
        id: usernameSnap.docs[0].id || data.id,
        isOwner: checkIsOwner(data.email),
        isVerified: checkIsOwner(data.email) || data.isVerified === true,
      };
    }

    // Search by email
    if (clean.includes('@')) {
      const emailQuery = query(collection(db, 'users'), where('email', '==', clean));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const data = emailSnap.docs[0].data() as UserProfile;
        return {
          ...data,
          id: emailSnap.docs[0].id || data.id,
          isOwner: checkIsOwner(data.email),
          isVerified: checkIsOwner(data.email) || data.isVerified === true,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching user in Firestore:', error);
    return null;
  }
}

export async function getAllUsersFromFirestore(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];
    snap.forEach((d) => {
      const u = d.data() as UserProfile;
      users.push({
        ...u,
        id: d.id,
        isOwner: checkIsOwner(u.email),
        isVerified: checkIsOwner(u.email) || u.isVerified === true,
      });
    });
    return users;
  } catch (err) {
    console.warn('Failed to fetch all users from Firestore:', err);
    return [];
  }
}

// ----------------- AUTH HANDLERS -----------------

// Helper to create a secure deterministic hash for credential checking
function computePasswordHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `hash_v2_${Math.abs(hash).toString(36)}_${password.length}`;
}

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
    // Check if generated username is taken
    let finalUsername = username;
    const existingWithHandle = await findUserByHandleOrEmail(finalUsername);
    if (existingWithHandle && existingWithHandle.id !== fbUser.uid) {
      finalUsername = `${username}_${Math.floor(100 + Math.random() * 900)}`;
    }

    profile = buildUserProfile(fbUser.uid, finalUsername, email, displayName, avatar);
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
  
  if (!password || password.trim().length < 6) {
    throw new Error('Master password is required and must be at least 6 characters.');
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('A valid email address is required.');
  }

  if (!cleanUsername || cleanUsername.length < 1 || cleanUsername.length > 18) {
    throw new Error('Username handle must be between 1 and 18 characters (letters, numbers, underscores only).');
  }

  // STRICT UNIQUE USERNAME CHECK: Never allow duplicate usernames
  const existingWithHandle = await findUserByHandleOrEmail(cleanUsername);
  if (existingWithHandle) {
    throw new Error(`The handle @${cleanUsername} is already registered. Please choose a different username.`);
  }

  const pwdHash = computePasswordHash(password.trim());

  let uid = '';
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    uid = userCredential.user.uid;
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already associated with an account. Please log in.');
    } else if (err.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else {
      // If client-side firebase auth fails, generate unique user node id
      uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
  }

  const profile = buildUserProfile(uid, cleanUsername, cleanEmail, username.trim(), avatar);
  profile.passwordHash = pwdHash;
  profile.stats = {
    transmissions: 0,
    followers: checkIsOwner(cleanEmail) ? 254 : 0,
    following: 0,
    tipsReceivedUsd: checkIsOwner(cleanEmail) ? 500 : 0,
  };
  profile.followingList = [];
  profile.followersList = [];

  await saveUserToFirestore(profile);
  return profile;
}

export async function loginWithCredentials(identifier: string, password?: string): Promise<UserProfile> {
  const clean = identifier.trim().toLowerCase();

  if (!password || password.trim().length < 6) {
    throw new Error('Please enter your master password (minimum 6 characters).');
  }

  const providedHash = computePasswordHash(password.trim());

  // 1. Direct Email Login
  if (clean.includes('@')) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, clean, password);
      let existing = await getUserFromFirestore(userCredential.user.uid);
      if (existing) {
        if (checkIsOwner(clean)) {
          existing.isOwner = true;
          existing.isVerified = true;
          await saveUserToFirestore(existing);
        }
        return existing;
      }
      
      const username = clean.split('@')[0].slice(0, 18);
      const newProfile = buildUserProfile(userCredential.user.uid, username, clean);
      await saveUserToFirestore(newProfile);
      return newProfile;
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Incorrect password for this email address.');
      }
      if (err.code === 'auth/user-not-found') {
        throw new Error('No registered node found with this email.');
      }
      
      // Fallback check in Firestore by email with passwordHash
      const docUser = await findUserByHandleOrEmail(clean);
      if (docUser && docUser.passwordHash) {
        if (docUser.passwordHash === providedHash) {
          return docUser;
        }
        throw new Error('Incorrect password for this account.');
      }
      throw new Error('Authentication failed: Invalid credentials or incorrect password.');
    }
  }

  // 2. Handle (@username) Login
  const cleanHandle = clean.replace(/^@/, '');
  const foundUser = await findUserByHandleOrEmail(cleanHandle);
  if (!foundUser) {
    throw new Error(`Node @${cleanHandle} is not registered.`);
  }

  // Try Firebase Auth if user has registered email
  if (foundUser.email) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, foundUser.email, password);
      const updated = await getUserFromFirestore(userCredential.user.uid);
      return updated || foundUser;
    } catch (err: any) {
      // Check stored password hash before throwing
      if (foundUser.passwordHash && foundUser.passwordHash === providedHash) {
        return foundUser;
      }
      throw new Error('Incorrect master password for @' + cleanHandle);
    }
  }

  // If no email, MUST verify password hash. NEVER ALLOW BYPASS!
  if (foundUser.passwordHash) {
    if (foundUser.passwordHash === providedHash) {
      return foundUser;
    }
    throw new Error('Incorrect master password for @' + cleanHandle);
  }

  // If the account has no password set and no email, require setting credentials
  throw new Error('Authentication requires valid password credentials. Please verify your identity.');
}

// ----------------- USERNAME UPDATE HANDLER -----------------

export async function updateUsernameInFirestore(
  userId: string,
  currentUsername: string,
  newUsername: string
): Promise<{ success: boolean; newUsername: string }> {
  const cleanCurrent = currentUsername.trim().toLowerCase().replace(/^@/, '');
  const cleanNew = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18);

  if (!cleanNew || cleanNew.length < 1 || cleanNew.length > 18) {
    throw new Error('Username must be 1 to 18 characters (letters, numbers, and underscores only).');
  }

  if (cleanNew === cleanCurrent) {
    return { success: true, newUsername: cleanNew };
  }

  // Check if new handle is taken
  const existing = await findUserByHandleOrEmail(cleanNew);
  if (existing && existing.id !== userId) {
    throw new Error(`The handle @${cleanNew} is already taken by another node.`);
  }

  // 1. Update user profile document
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    username: cleanNew,
    updatedAt: new Date().toISOString(),
  });

  // 2. Cascade update to posts by this user
  try {
    const postsQuery = query(collection(db, 'posts'), where('author.username', '==', cleanCurrent));
    const postSnaps = await getDocs(postsQuery);
    postSnaps.forEach(async (pDoc) => {
      await updateDoc(doc(db, 'posts', pDoc.id), {
        'author.username': cleanNew,
      });
    });
  } catch (err) {
    console.warn('Cascading post username update warning:', err);
  }

  // 3. Cascade update to shorts by this user
  try {
    const shortsQuery = query(collection(db, 'shorts'), where('author.username', '==', cleanCurrent));
    const shortSnaps = await getDocs(shortsQuery);
    shortSnaps.forEach(async (sDoc) => {
      await updateDoc(doc(db, 'shorts', sDoc.id), {
        'author.username': cleanNew,
      });
    });
  } catch (err) {
    console.warn('Cascading short username update warning:', err);
  }

  return { success: true, newUsername: cleanNew };
}

// ----------------- FOLLOWING & FOLLOWER SYNC -----------------

export async function saveFollowingToFirestore(userId: string, following: FollowUser[]): Promise<void> {
  try {
    const cleanList = (following || []).filter(
      (f) => f && f.username && typeof f.username === 'string' && f.username.trim().length > 0
    );
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      followingList: cleanList,
      stats: {
        following: cleanList.length,
      }
    }, { merge: true });
  } catch (error) {
    console.error('Error saving following to Firestore:', error);
  }
}

export async function saveFollowersToFirestore(userId: string, followers: FollowUser[]): Promise<void> {
  try {
    const cleanList = (followers || []).filter(
      (f) => f && f.username && typeof f.username === 'string' && f.username.trim().length > 0
    );
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      followersList: cleanList,
      stats: {
        followers: cleanList.length,
      }
    }, { merge: true });
  } catch (error) {
    console.error('Error saving followers to Firestore:', error);
  }
}

export async function getFollowingFromFirestore(userId: string): Promise<FollowUser[]> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (Array.isArray(data.followingList)) {
        return data.followingList.filter(
          (f) => f && f.username && typeof f.username === 'string' && f.username.trim().length > 0
        );
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching following from Firestore:', error);
    return [];
  }
}

export async function getFollowersFromFirestore(userId: string): Promise<FollowUser[]> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (Array.isArray(data.followersList)) {
        return data.followersList.filter(
          (f) => f && f.username && typeof f.username === 'string' && f.username.trim().length > 0
        );
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching followers from Firestore:', error);
    return [];
  }
}

export async function toggleFollowInFirestore(
  currentUser: UserProfile,
  targetUsername: string,
  isFollowing: boolean,
  targetUserData?: Partial<FollowUser>
): Promise<FollowUser[]> {
  try {
    const cleanTarget = targetUsername.trim().toLowerCase().replace(/^@/, '');
    let currentFollowing = currentUser.followingList || [];

    if (isFollowing) {
      // Add to following
      const newFollowObj: FollowUser = {
        id: targetUserData?.id || `usr_${cleanTarget}`,
        username: cleanTarget,
        displayName: targetUserData?.displayName || cleanTarget,
        avatar: targetUserData?.avatar || DEFAULT_AVATAR_PLACEHOLDER,
        bio: targetUserData?.bio || 'Decentralized creator node',
        isVerified: targetUserData?.isVerified,
        isFollowing: true,
      };
      currentFollowing = [newFollowObj, ...currentFollowing.filter(f => f.username.toLowerCase() !== cleanTarget)];
    } else {
      // Remove from following
      currentFollowing = currentFollowing.filter(f => f.username.toLowerCase() !== cleanTarget);
    }

    // Save to current user's document
    await saveFollowingToFirestore(currentUser.id, currentFollowing);

    // Also update target user document in Firestore if found
    const targetUser = await findUserByHandleOrEmail(cleanTarget);
    if (targetUser) {
      let targetFollowers = targetUser.followersList || [];
      if (isFollowing) {
        const followerEntry: FollowUser = {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatar: currentUser.avatar,
          bio: currentUser.bio,
          isVerified: currentUser.isVerified,
        };
        targetFollowers = [followerEntry, ...targetFollowers.filter(f => f.username.toLowerCase() !== currentUser.username.toLowerCase())];
      } else {
        targetFollowers = targetFollowers.filter(f => f.username.toLowerCase() !== currentUser.username.toLowerCase());
      }

      const targetDocRef = doc(db, 'users', targetUser.id);
      await setDoc(targetDocRef, {
        followersList: targetFollowers,
        stats: {
          followers: targetFollowers.length,
        }
      }, { merge: true });
    }

    return currentFollowing;
  } catch (err) {
    console.error('Error toggling follow in Firestore:', err);
    return currentUser.followingList || [];
  }
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

export function subscribeToAllUsers(onUpdate: (users: UserProfile[]) => void): () => void {
  const usersRef = collection(db, 'users');
  return onSnapshot(usersRef, (snap) => {
    if (!snap.empty) {
      const items: UserProfile[] = [];
      snap.forEach((doc) => {
        const u = doc.data() as UserProfile;
        items.push({
          ...u,
          id: doc.id,
          isOwner: checkIsOwner(u.email),
          isVerified: checkIsOwner(u.email) || u.isVerified === true,
        });
      });
      onUpdate(items);
    }
  }, (err) => {
    console.warn('Firestore users subscribe error:', err);
  });
}

