import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LOGOS } from './Logos';
import { UserProfile } from '../types';
import { playSound } from '../utils/sound';
import { DEFAULT_AVATAR_PLACEHOLDER, DEFAULT_BANNER_PLACEHOLDER } from '../utils/placeholders';
import { 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Upload, 
  X,
  AlertCircle,
  LogIn,
  UserPlus,
  Radio
} from 'lucide-react';

interface AuthSectionProps {
  status: string;
  setStatus: (status: string) => void;
  setUser: (user: UserProfile) => void;
  glassBase: string;
  rounded: string;
  onSetGuestMode?: () => void;
}

export function AuthSection({ 
  status, 
  setStatus, 
  setUser, 
  glassBase, 
  rounded,
  onSetGuestMode 
}: AuthSectionProps) {
  // Tab within Auth: 'create' | 'login'
  const [authMode, setAuthMode] = useState<'create' | 'login'>('create');

  // Form states
  const [username, setUsername] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR_PLACEHOLDER);
  
  // Verification states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showGmailOtpModal, setShowGmailOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isGmailVerified, setIsGmailVerified] = useState(false);
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          playSound('pop');
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateUsername = (name: string): boolean => {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 18) {
      setAuthError('Username must be strictly 1 to 18 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setAuthError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    setAuthError(null);
    return true;
  };

  const handleSendGmailCode = () => {
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please provide a valid Gmail / email address');
      return;
    }
    playSound('laser');
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setShowGmailOtpModal(true);
  };

  const handleConfirmOtp = () => {
    if (otpCode === generatedOtp || otpCode === '123456') {
      playSound('chime');
      setIsGmailVerified(true);
      setShowGmailOtpModal(false);
      setAuthError(null);
    } else {
      playSound('pop');
      setAuthError('Invalid 6-digit code. Please enter the generated token.');
    }
  };

  const handleGoogleSuccess = (googleEmail: string, googleName: string, googleAvatar: string) => {
    playSound('chime');
    setIsGoogleVerified(true);
    setIsGmailVerified(true);
    setEmail(googleEmail);
    setShowGoogleModal(false);

    const sanitizedName = googleName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18) || 'user';
    setUsername(sanitizedName);

    const newUser: UserProfile = {
      id: `usr_google_${Date.now()}`,
      username: sanitizedName,
      displayName: googleName,
      avatar: googleAvatar || DEFAULT_AVATAR_PLACEHOLDER,
      banner: DEFAULT_BANNER_PLACEHOLDER,
      bio: 'Sovereign node verified via Google Identity handshake.',
      joinedDate: 'Stardate 2026.08',
      location: 'Sovereign Node',
      isVerified: true,
      isVerifiedGoogle: true,
      isVerifiedGmail: true,
      email: googleEmail,
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

    setUser(newUser);
    setStatus('active');
  };

  const handleCompleteRegistration = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateUsername(username)) return;

    playSound('chime');
    const finalUsername = username.trim();

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      username: finalUsername,
      displayName: finalUsername,
      avatar: selectedAvatar || DEFAULT_AVATAR_PLACEHOLDER,
      banner: DEFAULT_BANNER_PLACEHOLDER,
      bio: 'Sovereign node on the decentralized mesh.',
      joinedDate: 'Stardate 2026.08',
      location: 'Sovereign Node',
      isVerified: isGoogleVerified || isGmailVerified,
      isVerifiedGoogle: isGoogleVerified,
      isVerifiedGmail: isGmailVerified,
      email: email.trim(),
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

    setUser(newUser);
    setStatus('active');
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const handle = loginIdentifier.trim().replace(/^@/, '');
    if (!handle) {
      setAuthError('Please enter your username or email');
      return;
    }
    if (!password.trim()) {
      setAuthError('Please enter your master password');
      return;
    }

    playSound('chime');
    const cleanHandle = handle.slice(0, 18);

    const loggedInUser: UserProfile = {
      id: `usr_${Date.now()}`,
      username: cleanHandle,
      displayName: cleanHandle,
      avatar: DEFAULT_AVATAR_PLACEHOLDER,
      banner: DEFAULT_BANNER_PLACEHOLDER,
      bio: 'Sovereign node authenticated.',
      joinedDate: 'Stardate 2026.08',
      location: 'Sovereign Node',
      isVerified: true,
      isVerifiedGoogle: false,
      isVerifiedGmail: cleanHandle.includes('@'),
      email: cleanHandle.includes('@') ? cleanHandle : '',
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

    setUser(loggedInUser);
    setStatus('active');
  };

  const handleEnterAsGuest = () => {
    playSound('pop');
    if (onSetGuestMode) {
      onSetGuestMode();
    }
  };

  return (
    <div id="auth-section" className="flex items-center justify-center min-h-screen px-4 py-8 relative z-20">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className={`${glassBase} ${rounded} w-full max-w-md p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white/95 dark:bg-zinc-950/95 text-zinc-950 dark:text-white`}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-5">
          <LOGOS.SpaceTalk className="w-12 h-12 mb-2" />
          <h1 className="text-xl font-black tracking-widest uppercase font-mono text-zinc-950 dark:text-white">
            SpaceTalk
          </h1>
          <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
            Sovereign Planetary Network
          </p>
        </div>

        {/* Mode Switcher: Create Account vs Sign In */}
        <div className="w-full grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-5">
          <button
            type="button"
            onClick={() => {
              playSound('click');
              setAuthMode('create');
              setAuthError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'create'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              setAuthMode('login');
              setAuthError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        </div>

        {authError && (
          <div className="w-full bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-2 mb-4 text-left">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Quick Google Sign In */}
        <button
          id="btn-google-auth"
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="w-full py-3.5 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] uppercase tracking-wider text-xs mb-4 cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.288 1.288-3.136 2.4-6.816 2.4-5.936 0-10.608-4.8-10.608-10.736s4.672-10.736 10.608-10.736c3.232 0 5.616 1.272 7.408 2.976l2.304-2.304C19.168 1.488 15.936 0 12.016 0 5.488 0 0 5.4 0 12s5.488 12 12.016 12c3.536 0 6.224-1.168 8.352-3.392 2.192-2.192 2.88-5.264 2.88-7.728 0-.752-.064-1.472-.176-2.144H12.48z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex py-1 items-center w-full mb-4">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-mono tracking-wider">
            Or with handle & passphrase
          </span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        <AnimatePresence mode="wait">
          {authMode === 'create' ? (
            <motion.form
              key="create-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleCompleteRegistration}
              className="w-full space-y-3.5 text-left"
            >
              {/* Profile Picture Placeholder & Custom Upload */}
              <div className="flex items-center gap-3.5 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <img
                      src={selectedAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-mono uppercase text-zinc-700 dark:text-zinc-400 block mb-0.5 font-bold">
                    Profile Picture
                  </span>
                  <p className="text-[10px] text-zinc-500 mb-1.5 truncate">
                    Default placeholder or upload custom image
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-mono text-[10px] flex items-center gap-1 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Username (1-18 characters) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono uppercase text-zinc-700 dark:text-zinc-400 font-bold">
                    Choose Handle (1-18 Letters)
                  </label>
                  <span className={`text-[10px] font-mono ${
                    username.length >= 1 && username.length <= 18 ? 'text-zinc-950 dark:text-white font-bold' : 'text-zinc-500'
                  }`}>
                    {username.length}/18 chars
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-zinc-400 dark:text-zinc-500 font-mono text-sm">@</span>
                  <input
                    id="input-create-handle"
                    maxLength={18}
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18);
                      setUsername(val);
                      validateUsername(val);
                    }}
                    placeholder="your_handle"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-3 rounded-2xl focus:border-zinc-950 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Gmail / Email (Optional for Verification) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono uppercase text-zinc-700 dark:text-zinc-400 font-bold">
                    Gmail / Email (Optional)
                  </label>
                  {isGmailVerified && (
                    <span className="text-[10px] font-mono text-zinc-950 dark:text-white flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
                  <input
                    id="input-create-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsGmailVerified(false);
                    }}
                    placeholder="email@example.com"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-11 pr-24 py-3 rounded-2xl focus:border-zinc-950 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all font-mono"
                  />
                  {email.includes('@') && !isGmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendGmailCode}
                      className="absolute right-2 top-2 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-950 dark:text-white transition-all cursor-pointer"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>

              {/* Password (Infinite Length) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono uppercase text-zinc-700 dark:text-zinc-400 font-bold">
                    Master Password
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Infinite length allowed
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
                  <input
                    id="input-create-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure master passphrase"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-11 pr-11 py-3 rounded-2xl focus:border-zinc-950 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Create Account */}
              <button
                id="btn-submit-create"
                type="submit"
                disabled={username.length < 1 || username.length > 18}
                className="w-full py-4 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.3)] mt-2 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                <span>Create Account & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleLoginSubmit}
              className="w-full space-y-3.5 text-left"
            >
              {/* Login Handle / Email */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-700 dark:text-zinc-400 font-bold block mb-1">
                  Handle or Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-zinc-400 dark:text-zinc-500 font-mono text-sm">@</span>
                  <input
                    id="input-login-handle"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="handle or email"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-3 rounded-2xl focus:border-zinc-950 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Login Password */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-700 dark:text-zinc-400 font-bold block mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your passphrase"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-11 pr-11 py-3 rounded-2xl focus:border-zinc-950 dark:focus:border-white focus:bg-white dark:focus:bg-zinc-800 text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Login */}
              <button
                id="btn-submit-login"
                type="submit"
                className="w-full py-4 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.3)] mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to SpaceTalk</span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Read-Only Guest Access */}
        <div className="w-full pt-4 mt-2 border-t border-zinc-200 dark:border-zinc-800/80">
          <button
            id="btn-guest-browse"
            type="button"
            onClick={handleEnterAsGuest}
            className="w-full py-2.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-mono text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Or browse as Guest (Read-Only)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* Google OAuth Modal Simulator */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-[190] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-sm p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-left relative text-zinc-950 dark:text-white"
          >
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.288 1.288-3.136 2.4-6.816 2.4-5.936 0-10.608-4.8-10.608-10.736s4.672-10.736 10.608-10.736c3.232 0 5.616 1.272 7.408 2.976l2.304-2.304C19.168 1.488 15.936 0 12.016 0 5.488 0 0 5.4 0 12s5.488 12 12.016 12c3.536 0 6.224-1.168 8.352-3.392 2.192-2.192 2.88-5.264 2.88-7.728 0-.752-.064-1.472-.176-2.144H12.48z"/>
              </svg>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">Google Identity Handshake</h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
              Choose an account to authenticate with SpaceTalk.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleGoogleSuccess(
                  'fxruzzo@gmail.com', 
                  'Fx Ruzzo', 
                  DEFAULT_AVATAR_PLACEHOLDER
                )}
                className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex items-center gap-3 text-left group cursor-pointer shadow-xs"
              >
                <img
                  src={DEFAULT_AVATAR_PLACEHOLDER}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover grayscale border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-zinc-950 dark:text-white">Fx Ruzzo</span>
                    <ShieldCheck className="w-3 h-3 text-zinc-950 dark:text-white" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                    fxruzzo@gmail.com
                  </span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Gmail OTP Verification Modal */}
      {showGmailOtpModal && (
        <div className="fixed inset-0 z-[190] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-sm p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-left relative text-zinc-950 dark:text-white"
          >
            <button
              onClick={() => setShowGmailOtpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-zinc-950 dark:text-white" />
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">Gmail Security Token</h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
              Verification packet sent to <strong className="text-zinc-950 dark:text-white">{email}</strong>.
            </p>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center mb-4">
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block">Security Handshake Code:</span>
              <span className="text-xl font-black font-mono tracking-widest text-zinc-950 dark:text-white mt-1 block">
                {generatedOtp}
              </span>
              <button
                type="button"
                onClick={() => setOtpCode(generatedOtp)}
                className="text-[10px] font-mono text-zinc-950 dark:text-white underline mt-1 cursor-pointer font-bold"
              >
                Auto-fill Code
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter 6-digit code"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-center text-lg font-mono tracking-widest text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white"
              />

              <button
                type="button"
                onClick={handleConfirmOtp}
                className="w-full py-3.5 bg-zinc-950 text-white dark:bg-white dark:text-black font-bold rounded-2xl hover:opacity-90 text-xs uppercase tracking-wider shadow-md dark:shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer"
              >
                Verify & Confirm Handshake
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
