import React from 'react';
import { ShieldCheck, Crown } from 'lucide-react';

interface UserBadgeProps {
  isVerified?: boolean;
  isOwner?: boolean;
  email?: string;
  username?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function isSpecialVerifiedUser(email?: string, username?: string): boolean {
  const cleanEmail = email?.toLowerCase().trim() || '';
  const cleanUser = username?.toLowerCase().trim().replace(/^@/, '') || '';
  // STRICT RULE: Only @1 or fxruzzo@gmail.com gets the TikTok verified badge
  return cleanEmail === 'fxruzzo@gmail.com' || cleanUser === '1' || cleanUser === 'fxruzzo';
}

export function isOwnerUser(email?: string, username?: string, isOwner?: boolean): boolean {
  const cleanEmail = email?.toLowerCase().trim() || '';
  const cleanUser = username?.toLowerCase().trim().replace(/^@/, '') || '';
  // STRICT RULE: Only fxruzzo@gmail.com or @1 account has Sovereign Owner status
  if (cleanEmail === 'fxruzzo@gmail.com' || cleanUser === '1') {
    return true;
  }
  if (isOwner && (cleanEmail === 'fxruzzo@gmail.com' || cleanUser === '1')) {
    return true;
  }
  return false;
}

export function isVerifiedUser(email?: string, username?: string, isVerified?: boolean, isOwner?: boolean): boolean {
  if (isSpecialVerifiedUser(email, username)) return true;
  if (isOwnerUser(email, username, isOwner)) return true;
  return Boolean(isVerified);
}

// Iconic TikTok-style Cyan Verified Badge Component
export function TikTokVerifiedIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      {/* Cyan Starburst / Scalloped Badge Background */}
      <path
        d="M12 1.5l1.9 2.4 3-.7.9 3 2.8 1.3-.2 3.1 2.3 2.1-1.3 2.8.9 3-2.9 1.1-1 2.9-3.1-.1L12 24.5l-2.4-1.9-3.1.1-1-2.9-2.9-1.1.9-3-1.3-2.8 2.3-2.1-.2-3.1 2.8-1.3.9-3 3 .7L12 1.5z"
        fill="#20D5EC"
      />
      {/* High contrast crisp white checkmark */}
      <path
        d="M10.1 16.2l-3.6-3.6 1.4-1.4 2.2 2.2 5.3-5.3 1.4 1.4-6.7 6.7z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function UserBadge({
  isVerified,
  isOwner,
  email,
  username,
  className = '',
  size = 'sm',
  showText = false,
}: UserBadgeProps) {
  const isSpecial = isSpecialVerifiedUser(email, username);
  const hasOwner = isOwnerUser(email, username, isOwner);
  const hasVerified = isVerifiedUser(email, username, isVerified, isOwner);

  if (!isSpecial && !hasOwner && !hasVerified) return null;

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const badgeSize = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-1.5 align-middle select-none ${className}`}>
      {/* Extra Special TikTok Verified Badge (Exclusively for @1 / fxruzzo@gmail.com) */}
      {isSpecial && (
        <span
          title="✨ Official Verified Badge (@1 / fxruzzo@gmail.com)"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/15 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 dark:border-cyan-400/40 text-[10px] font-mono font-bold shadow-xs cursor-help"
        >
          <TikTokVerifiedIcon className={`${badgeSize} drop-shadow-[0_0_8px_rgba(32,213,236,0.6)]`} />
          {showText && <span className="uppercase tracking-wider text-cyan-600 dark:text-cyan-300 font-black">Verified</span>}
        </span>
      )}

      {/* Owner Crown Badge (Strictly for @1 / fxruzzo@gmail.com) */}
      {hasOwner && (
        <span
          title="👑 Platform Owner & Founder (fxruzzo@gmail.com)"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30 text-[10px] font-mono font-bold shadow-xs cursor-help"
        >
          <Crown className={`${badgeSize} fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]`} />
          {showText && <span className="uppercase tracking-wider">Owner</span>}
        </span>
      )}

      {/* Standard Verified Checkmark Badge for other standard verified nodes */}
      {!isSpecial && hasVerified && (
        <span
          title="Verified Sovereign Node"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono font-bold shadow-xs"
        >
          <ShieldCheck className={`${badgeSize} text-zinc-950 dark:text-white`} />
          {showText && <span className="uppercase tracking-wider">Verified</span>}
        </span>
      )}
    </div>
  );
}
