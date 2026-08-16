import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { PostItem, UserProfile } from '../types';
import { X, Image, Upload, Sparkles, Send, Trash2, Plus } from 'lucide-react';
import { playSound } from '../utils/sound';

interface CreatePostModalProps {
  user: UserProfile;
  glassBase: string;
  onClose: () => void;
  onPostCreated: (newPost: PostItem) => void;
  onShowToast: (msg: string) => void;
}

export function CreatePostModal({
  user,
  glassBase,
  onClose,
  onPostCreated,
  onShowToast,
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    playSound('pop');
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        onShowToast('Please upload an image file (PNG, JPG, WEBP)');
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    playSound('pop');
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      onShowToast('Please enter text or upload an image');
      return;
    }

    playSound('laser');

    const newPost: PostItem = {
      id: `p_${Date.now()}`,
      author: {
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isVerifiedGoogle: user.isVerifiedGoogle,
        isVerifiedGmail: user.isVerifiedGmail,
        walletAddress: user.wallets.eth || user.wallets.btc,
      },
      content: content.trim(),
      images: images.length > 0 ? images : undefined,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      isBookmarked: false,
      tipsUsd: 0,
      commentsCount: 0,
      comments: [],
    };

    onPostCreated(newPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-950 rounded-[36px] w-full max-w-lg p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-950 dark:text-white"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover grayscale border-2 border-zinc-300 dark:border-zinc-700"
          />
          <div>
            <h3 className="text-base font-black text-zinc-950 dark:text-white">{user.displayName}</h3>
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">@{user.username}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Post Text Area */}
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your transmission... (Text and photos)"
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-sm text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white resize-none"
          />

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Uploaded Photos ({images.length})
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-mono text-zinc-950 dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add More
                </button>
              </div>

              <div className={`grid gap-2 ${
                images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video sm:aspect-square bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={img}
                      alt={`Uploaded ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag and drop upload box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-zinc-950 dark:border-white bg-zinc-100 dark:bg-white/10'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-950 dark:text-white">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-950 dark:text-white">Click or drag images to upload</p>
                <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">Supports PNG, JPG, GIF, WEBP</p>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!content.trim() && images.length === 0}
            className="w-full py-4 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Publish Post</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
