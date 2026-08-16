import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Sparkles, X, ArrowRight, Lock, Mail } from 'lucide-react';
import { playSound } from '../utils/sound';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode: 'signin' | 'signup' | 'google') => void;
  actionName?: string;
}

export function GuestModal({
  isOpen,
  onClose,
  onOpenAuth,
  actionName = 'interact',
}: GuestModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[180] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white dark:bg-zinc-950 rounded-[36px] w-full max-w-md p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.9)] text-center relative overflow-hidden text-zinc-950 dark:text-white"
        >
          {/* Close button */}
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge */}
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/20 flex items-center justify-center mx-auto mb-4 text-zinc-950 dark:text-white shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <Lock className="w-8 h-8 text-zinc-950 dark:text-white" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-950 dark:text-white" /> Guest Read-Only Mode
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white uppercase tracking-tight">
            Sign In Required
          </h3>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed max-w-xs mx-auto">
            Guests are limited to viewing posts and shorts. Create an account or verify with Google/Gmail to {actionName}, post, chat in unfiltered channels, and connect with friends.
          </p>

          <div className="mt-6 space-y-2.5">
            {/* Google / Gmail Sign In */}
            <button
              onClick={() => {
                playSound('chime');
                onClose();
                onOpenAuth('google');
              }}
              className="w-full py-3.5 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.288 1.288-3.136 2.4-6.816 2.4-5.936 0-10.608-4.8-10.608-10.736s4.672-10.736 10.608-10.736c3.232 0 5.616 1.272 7.408 2.976l2.304-2.304C19.168 1.488 15.936 0 12.016 0 5.488 0 0 5.4 0 12s5.488 12 12.016 12c3.536 0 6.224-1.168 8.352-3.392 2.192-2.192 2.88-5.264 2.88-7.728 0-.752-.064-1.472-.176-2.144H12.48z"/>
              </svg>
              <span>Continue with Google / Gmail</span>
            </button>

            {/* Create Sovereign Account */}
            <button
              onClick={() => {
                playSound('click');
                onClose();
                onOpenAuth('signup');
              }}
              className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white font-bold rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
              <span>Create Account (1-18 Letters)</span>
            </button>

            {/* Continue Browsing as Guest */}
            <button
              onClick={() => {
                playSound('pop');
                onClose();
              }}
              className="w-full py-2.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-mono text-[11px] transition-colors cursor-pointer"
            >
              Stay in Guest View
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
