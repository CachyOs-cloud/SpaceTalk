import React from 'react';
import { motion } from 'motion/react';
import { FileText, Play, Plus, MessageSquare, UserPlus } from 'lucide-react';
import { playSound } from '../utils/sound';

interface NavBarProps {
  active: string;
  setTab: (tab: string) => void;
  onOpenAddPost: () => void;
  glass: string;
  unreadInboxCount?: number;
  pendingFriendsCount?: number;
  onRequireAuth?: (action: string) => void;
  isGuest?: boolean;
}

export function NavBar({
  active,
  setTab,
  onOpenAddPost,
  glass,
  unreadInboxCount = 0,
  pendingFriendsCount = 0,
  onRequireAuth,
  isGuest = false,
}: NavBarProps) {
  const tabs = [
    { id: 'posts', icon: FileText, label: 'Posts' },
    { id: 'shorts', icon: Play, label: 'Shorts' },
    { id: 'add', icon: Plus, label: 'Transmit', isPrimary: true },
    { id: 'inbox', icon: MessageSquare, label: 'Inbox', badge: unreadInboxCount, requiresAuth: true },
    { id: 'friends', icon: UserPlus, label: 'Friend Requests', badge: pendingFriendsCount, requiresAuth: true },
  ];

  return (
    <nav
      id="bottom-nav-bar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-md h-20 flex items-center justify-around px-3 rounded-[40px] z-50 bg-white/90 dark:bg-black/90 backdrop-blur-[35px] border border-zinc-200/90 dark:border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-colors"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;

        if (tab.isPrimary) {
          return (
            <motion.button
              key={tab.id}
              id="nav-btn-transmit"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (isGuest && onRequireAuth) {
                  onRequireAuth('create posts');
                  return;
                }
                playSound('laser');
                onOpenAddPost();
              }}
              className="relative -top-6 group p-1 cursor-pointer"
              title="Broadcast Transmission"
            >
              <div className="w-16 h-16 bg-zinc-950 dark:bg-white rounded-[26px] flex items-center justify-center text-white dark:text-black shadow-[0_10px_25px_rgba(0,0,0,0.25)] dark:shadow-[0_0_30px_rgba(255,255,255,0.4)] rotate-45 group-hover:rotate-90 transition-transform duration-500 ease-out border border-zinc-800 dark:border-white">
                <div className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500 ease-out">
                  <Icon className="w-7 h-7 text-white dark:text-black stroke-[2.5]" />
                </div>
              </div>
            </motion.button>
          );
        }

        return (
          <motion.button
            key={tab.id}
            id={`nav-btn-${tab.id}`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (isGuest && tab.requiresAuth && onRequireAuth) {
                onRequireAuth(`access ${tab.label}`);
                return;
              }
              playSound('click');
              setTab(tab.id);
            }}
            className={`relative p-3 transition-colors duration-200 flex flex-col items-center justify-center cursor-pointer ${
              isActive ? 'text-zinc-950 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title={tab.label}
          >
            <div className="relative">
              <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              {tab.badge !== undefined && tab.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black text-[9px] font-black flex items-center justify-center shadow-md"
                >
                  {tab.badge}
                </motion.span>
              )}
            </div>

            {isActive && (
              <motion.div
                layoutId="nav-glow-bubble"
                className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-2xl -z-10 shadow-sm border border-black/10 dark:border-white/20"
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
