import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LOGOS } from './Logos';
import { X, Zap, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { playSound } from '../utils/sound';

interface TipModalProps {
  targetUser: {
    username: string;
    displayName?: string;
    avatar?: string;
  };
  glassBase: string;
  onClose: () => void;
  onTipSuccess: (amountUsd: number, currency: string, note?: string) => void;
}

export function TipModal({
  targetUser,
  glassBase,
  onClose,
  onTipSuccess,
}: TipModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<'BTC' | 'ETH' | 'XMR' | 'SOL'>('ETH');
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [tipNote, setTipNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const quickAmounts = [1, 5, 10, 25, 50, 100];

  const cryptoRates: Record<string, number> = {
    BTC: 96500,
    ETH: 3400,
    XMR: 180,
    SOL: 210,
  };

  const amountUsd = parseFloat(customAmount) || 0;
  const cryptoEquivalent = (amountUsd / cryptoRates[selectedCurrency]).toFixed(
    selectedCurrency === 'BTC' || selectedCurrency === 'ETH' ? 5 : 3
  );

  const handleSendTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountUsd <= 0) return;

    playSound('tip');
    setIsSuccess(true);
    setTimeout(() => {
      onTipSuccess(amountUsd, selectedCurrency, tipNote);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-950 rounded-[36px] w-full max-w-md p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative text-zinc-950 dark:text-white"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white dark:text-black" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-950 dark:text-white">Transmission Confirmed</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Sent ${amountUsd} worth of {selectedCurrency} to @{targetUser.username}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3">
              <img
                src={targetUser.avatar || 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=200&auto=format&fit=crop&q=80'}
                alt={targetUser.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-zinc-300 dark:border-zinc-700 grayscale"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-extrabold text-zinc-950 dark:text-white">Tip @{targetUser.username}</h3>
                  <Zap className="w-4 h-4 text-zinc-950 dark:text-white fill-zinc-950 dark:fill-white" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Instant P2P Ledger Ingress</p>
              </div>
            </div>

            <form onSubmit={handleSendTip} className="mt-6 space-y-4">
              {/* Crypto Selector */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-2">
                  Select Currency Gateway
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'BTC', name: 'BTC', logo: LOGOS.Bitcoin },
                    { id: 'ETH', name: 'ETH', logo: LOGOS.Ethereum },
                    { id: 'XMR', name: 'XMR', logo: LOGOS.Monero },
                    { id: 'SOL', name: 'SOL', logo: LOGOS.Solana },
                  ].map((coin) => {
                    const isSelected = selectedCurrency === coin.id;
                    const Icon = coin.logo;
                    return (
                      <button
                        key={coin.id}
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setSelectedCurrency(coin.id as any);
                        }}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-zinc-950 bg-zinc-100 dark:border-white dark:bg-zinc-800 shadow-sm'
                            : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <Icon className="w-5 h-5 fill-zinc-950 dark:fill-white" />
                        <span className="text-[11px] font-bold font-mono text-zinc-950 dark:text-white">{coin.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Presets */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-2">
                  Tip Amount (USD Equivalent)
                </label>
                <div className="grid grid-cols-6 gap-1.5 mb-2.5">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        playSound('pop');
                        setCustomAmount(amt.toString());
                      }}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        customAmount === amt.toString()
                          ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-black dark:border-white'
                          : 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div className="relative">
                  <span className="absolute left-4 top-3 text-zinc-400 dark:text-zinc-500 font-mono text-sm">$</span>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Custom amount"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-8 pr-28 py-2.5 rounded-2xl text-sm font-mono text-zinc-950 dark:text-white outline-none focus:border-zinc-950 dark:focus:border-white"
                  />
                  <span className="absolute right-4 top-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    ≈ {cryptoEquivalent} {selectedCurrency}
                  </span>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 block mb-1">
                  Public Transmission Note (Optional)
                </label>
                <input
                  type="text"
                  value={tipNote}
                  onChange={(e) => setTipNote(e.target.value)}
                  placeholder="Keep building sovereign media..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-2xl text-xs text-zinc-950 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-950 dark:focus:border-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={amountUsd <= 0}
                className="w-full py-4 bg-zinc-950 text-white dark:bg-white dark:text-black font-extrabold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md disabled:opacity-40 cursor-pointer"
              >
                Transmit ${amountUsd} ({cryptoEquivalent} {selectedCurrency})
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
