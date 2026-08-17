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

export function isOwnerUser(email?: string, username?: string, isOwner?: boolean): boolean {
  const cleanEmail = email?.toLowerCase().trim() || '';
  // STRICT RULE: Only authentication with fxruzzo@gmail.com grants the Owner Crown
  if (cleanEmail === 'fxruzzo@gmail.com') {
    return true;
  }
  if (isOwner && cleanEmail === 'fxruzzo@gmail.com') {
    return true;
  }
  return false;
}

export function isVerifiedUser(email?: string, username?: string, isVerified?: boolean, isOwner?: boolean): boolean {
  if (isOwnerUser(email, username, isOwner)) return true;
  return Boolean(isVerified);
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
  const hasOwner = isOwnerUser(email, username, isOwner);
  const hasVerified = isVerifiedUser(email, username, isVerified, isOwner);

  if (!hasOwner && !hasVerified) return null;

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const badgeSize = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-1.5 align-middle select-none ${className}`}>
      {/* Owner Crown Badge */}
      {hasOwner && (
        <span
          title="👑 Platform Owner & Founder (fxruzzo@gmail.com)"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30 text-[10px] font-mono font-bold shadow-xs cursor-help"
        >
          <Crown className={`${badgeSize} fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]`} />
          {showText && <span className="uppercase tracking-wider">Owner</span>}
        </span>
      )}

      {/* Standard Verified Checkmark Badge */}
      {hasVerified && (
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
