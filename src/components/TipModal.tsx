import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LOGOS } from './Logos';
import { X, Copy, Check, QrCode, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';
import { playSound } from '../utils/sound';
import { UserBadge } from './UserBadge';

interface TipModalProps {
  targetUser: {
    username: string;
    displayName?: string;
    avatar?: string;
    isVerified?: boolean;
    isOwner?: boolean;
    isVerifiedGoogle?: boolean;
    isVerifiedGmail?: boolean;
    email?: string;
    wallets?: {
      btc?: string;
      eth?: string;
      xmr?: string;
      sol?: string;
    };
  };
  glassBase?: string;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export function TipModal({
  targetUser,
  onClose,
  onShowToast,
}: TipModalProps) {
  const [copiedCoin, setCopiedCoin] = useState<string | null>(null);
  const [activeQrCoin, setActiveQrCoin] = useState<{ name: string; address: string } | null>(null);

  const wallets = targetUser.wallets || {};
  const coinList = [
    { key: 'btc', name: 'Bitcoin', symbol: 'BTC', address: wallets.btc, logo: LOGOS.Bitcoin },
    { key: 'eth', name: 'Ethereum / EVM', symbol: 'ETH', address: wallets.eth, logo: LOGOS.Ethereum },
    { key: 'sol', name: 'Solana', symbol: 'SOL', address: wallets.sol, logo: LOGOS.Solana },
    { key: 'xmr', name: 'Monero', symbol: 'XMR', address: wallets.xmr, logo: LOGOS.Monero },
  ];

  const configuredCoins = coinList.filter(c => Boolean(c.address && c.address.trim()));

  const handleCopy = (symbol: string, address: string) => {
    playSound('pop');
    navigator.clipboard.writeText(address);
    setCopiedCoin(symbol);
    if (onShowToast) {
      onShowToast(`Copied ${symbol} address!`);
    }
    setTimeout(() => setCopiedCoin(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="bg-white dark:bg-zinc-950 rounded-[36px] w-full max-w-lg p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative text-zinc-950 dark:text-white max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="absolute top-5 right-5 p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Creator Header */}
        <div className="flex items-center gap-3.5 pr-10">
          <img
            src={targetUser.avatar || 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=200&auto=format&fit=crop&q=80'}
            alt={targetUser.username}
            className="w-13 h-13 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700 grayscale flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-extrabold text-zinc-950 dark:text-white truncate">
                {targetUser.displayName || targetUser.username}
              </h3>
              <UserBadge
                isOwner={targetUser.isOwner}
                isVerified={targetUser.isVerified || targetUser.isVerifiedGoogle || targetUser.isVerifiedGmail}
                email={targetUser.email}
                username={targetUser.username}
                size="xs"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
              @{targetUser.username}
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-5 p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
          <Wallet className="w-4 h-4 text-zinc-900 dark:text-white mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            Copy any public wallet address below to donate directly to <strong>@{targetUser.username}</strong> from your crypto wallet app (e.g. MetaMask, Phantom, Trust Wallet).
          </p>
        </div>

        {/* Wallet Address List */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Configured Wallet Addresses
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {configuredCoins.length} available
            </span>
          </div>

          {configuredCoins.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-center space-y-1.5">
              <p className="text-sm font-bold text-zinc-950 dark:text-white">No Public Wallets Set Up</p>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                @{targetUser.username} hasn&apos;t added any public wallet addresses to their profile yet.
              </p>
            </div>
          ) : (
            configuredCoins.map((coin) => {
              const Icon = coin.logo;
              const isCopied = copiedCoin === coin.symbol;

              return (
                <div
                  key={coin.key}
                  className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-950 dark:text-white">
                        {coin.name} ({coin.symbol})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setActiveQrCoin({ name: `${coin.name} (${coin.symbol})`, address: coin.address! });
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        title="View QR Code"
                      >
                        <QrCode className="w-3 h-3" />
                        <span className="hidden sm:inline">QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(coin.symbol, coin.address!)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
                          isCopied
                            ? 'bg-emerald-600 text-white border border-emerald-600'
                            : 'bg-zinc-950 text-white dark:bg-white dark:text-black hover:opacity-90'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 break-all select-all">
                    {coin.address}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal QR Code Sub-modal */}
        <AnimatePresence>
          {activeQrCoin && (
            <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="bg-white dark:bg-zinc-950 rounded-[32px] w-full max-w-xs p-6 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 relative shadow-2xl text-zinc-950 dark:text-white"
              >
                <button
                  onClick={() => setActiveQrCoin(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <h4 className="text-sm font-bold text-zinc-950 dark:text-white">{activeQrCoin.name}</h4>

                {/* Minimal QR representation */}
                <div className="p-4 bg-zinc-100 dark:bg-white rounded-2xl mx-auto w-44 h-44 flex items-center justify-center shadow-inner">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-zinc-950 rounded-xl">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                            ? 'bg-white'
                            : 'bg-zinc-950'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Address</span>
                  <p className="text-[11px] font-mono text-zinc-900 dark:text-white break-all">{activeQrCoin.address}</p>
                </div>

                <button
                  onClick={() => {
                    handleCopy('QR Address', activeQrCoin.address);
                    setActiveQrCoin(null);
                  }}
                  className="w-full py-2.5 bg-zinc-950 text-white dark:bg-white dark:text-black font-bold rounded-xl hover:opacity-90 text-xs cursor-pointer"
                >
                  Copy Address
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            Direct Peer-to-Peer Ingress
          </span>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold font-mono cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
