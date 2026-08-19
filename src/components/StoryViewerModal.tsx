import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoryItem } from '../types';
import { X, ChevronLeft, ChevronRight, Heart, Send, Sparkles } from 'lucide-react';
import { playSound } from '../utils/sound';

interface StoryViewerModalProps {
  stories: StoryItem[];
  initialStoryIndex: number;
  onClose: () => void;
}

export function StoryViewerModal({
  stories,
  initialStoryIndex,
  onClose,
}: StoryViewerModalProps) {
  const [groupIndex, setGroupIndex] = useState(initialStoryIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [storyComment, setStoryComment] = useState('');
  const [hasLiked, setHasLiked] = useState(false);

  const currentGroup = stories[groupIndex];
  const currentSlide = currentGroup?.stories[slideIndex];

  // Auto progression timer
  useEffect(() => {
    if (isPaused || !currentSlide) return;

    const timer = setTimeout(() => {
      handleNextSlide();
    }, 4500);

    return () => clearTimeout(timer);
  }, [groupIndex, slideIndex, isPaused, currentSlide]);

  const handleNextSlide = () => {
    playSound('pop');
    if (slideIndex < currentGroup.stories.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else if (groupIndex < stories.length - 1) {
      setGroupIndex(prev => prev + 1);
      setSlideIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevSlide = () => {
    playSound('pop');
    if (slideIndex > 0) {
      setSlideIndex(prev => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setSlideIndex(stories[groupIndex - 1].stories.length - 1);
    }
  };

  const handleSendReaction = (emoji: string) => {
    playSound('pop');
    setStoryComment(`Reacted ${emoji}`);
  };

  if (!currentGroup || !currentSlide) return null;

  return (
    <div className="fixed inset-0 z-[180] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Close button */}
      <button
        onClick={() => {
          playSound('click');
          onClose();
        }}
        className="absolute top-5 right-5 z-30 p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Container Frame */}
      <div 
        className="relative w-full h-full sm:h-[88vh] sm:max-w-md sm:rounded-[36px] overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl border border-zinc-800"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story Background Media */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentSlide.mediaUrl}
            alt="Story transmission"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
        </div>

        {/* Top Controls & Story Progress */}
        <div className="relative z-20 p-4 space-y-3">
          {/* Progress Indicators */}
          <div className="flex gap-1.5">
            {currentGroup.stories.map((s, idx) => (
              <div key={s.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  initial={{ width: idx < slideIndex ? '100%' : '0%' }}
                  animate={{ 
                    width: idx === slideIndex ? (isPaused ? '50%' : '100%') : idx < slideIndex ? '100%' : '0%' 
                  }}
                  transition={{ duration: idx === slideIndex ? 4.5 : 0, ease: 'linear' }}
                />
              </div>
            ))}
          </div>

          {/* User Info Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={currentGroup.userAvatar}
                alt={currentGroup.username}
                className="w-9 h-9 rounded-full object-cover border border-white/40"
              />
              <div>
                <span className="font-extrabold text-white text-xs block">
                  @{currentGroup.username}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {currentSlide.timestamp}
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-white">
              Node Broadcast
            </span>
          </div>
        </div>

        {/* Story Caption / Overlay Message */}
        {currentSlide.caption && (
          <div className="relative z-20 px-6 my-auto text-center">
            <div className="inline-block p-4 rounded-3xl bg-black/80 backdrop-blur-xl border border-zinc-800 text-white font-sans text-sm sm:text-base font-semibold leading-relaxed shadow-2xl max-w-xs">
              {currentSlide.caption}
            </div>
          </div>
        )}

        {/* Tap zones for left/right progression */}
        <div className="absolute inset-y-20 left-0 w-1/3 z-10" onClick={handlePrevSlide} />
        <div className="absolute inset-y-20 right-0 w-1/3 z-10" onClick={handleNextSlide} />

        {/* Bottom Reaction & Quick Reply Bar */}
        <div className="relative z-20 p-4 pt-0 space-y-3">
          <div className="flex justify-around py-1 bg-black/60 backdrop-blur-md rounded-2xl border border-zinc-800">
            {['🛰️', '⚡', '🖤', '🔥', '✨'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={storyComment}
              onChange={(e) => setStoryComment(e.target.value)}
              placeholder={`Send message to @${currentGroup.username}...`}
              className="flex-1 bg-black/80 backdrop-blur-xl border border-zinc-800 px-4 py-2.5 rounded-full text-xs text-white placeholder-zinc-500 outline-none focus:border-white"
            />
            <button
              onClick={() => {
                playSound('pop');
                setHasLiked(!hasLiked);
              }}
              className={`p-2.5 rounded-full border transition-all ${
                hasLiked ? 'bg-white text-black border-white' : 'bg-black/80 text-white border-zinc-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-black' : ''}`} />
            </button>
            <button
              onClick={() => {
                if (storyComment) {
                  playSound('laser');
                  setStoryComment('');
                }
              }}
              className="p-2.5 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
