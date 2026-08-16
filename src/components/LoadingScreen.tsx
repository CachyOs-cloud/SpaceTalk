import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LOGOS } from './Logos';
import { ShieldCheck, Cpu, Wifi } from 'lucide-react';

interface LoadingScreenProps {
  glassBase: string;
  onComplete?: () => void;
}

export function LoadingScreen({ glassBase }: LoadingScreenProps) {
  const [telemetryStep, setTelemetryStep] = useState(0);

  const steps = [
    'Establishing Tor Onion & IPFS Node Mesh...',
    'Cloudflare Bot Management & SSL Handshake Active...',
    'Synchronizing Planetary Ring Nodes...',
    'Zero-Knowledge Identity Vault Ready.'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 650);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div id="loading-screen" className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100] px-4">
      {/* Background ambient lighting - subtle monochromatic vignette */}
      <div className="absolute w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        animate={{ scale: [0.95, 1.05, 0.95], rotate: 360 }}
        transition={{ scale: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 16, repeat: Infinity, ease: 'linear' } }}
        className="relative"
      >
        <LOGOS.SpaceTalk className="w-20 h-20" />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-2xl font-black tracking-widest uppercase font-mono text-white"
      >
        SpaceTalk
      </motion.h1>

      <div className="mt-8 w-72 h-1 bg-zinc-900 rounded-full overflow-hidden p-[1px] relative border border-zinc-800">
        <motion.div 
          className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)]"
          initial={{ width: '5%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.4, ease: 'easeInOut' }}
        />
      </div>

      <div className="mt-5 flex items-center gap-2 text-zinc-400 text-xs font-mono">
        <Wifi className="w-3.5 h-3.5 animate-pulse text-white" />
        <span>{steps[telemetryStep]}</span>
      </div>

      <div className={`mt-8 px-4 py-2 ${glassBase} rounded-full flex items-center gap-4 text-[10px] text-zinc-400 font-mono border border-zinc-800`}>
        <span className="flex items-center gap-1 text-zinc-300">
          <ShieldCheck className="w-3 h-3 text-white" /> E2E Encrypted
        </span>
        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
        <span className="flex items-center gap-1 text-zinc-300">
          <Cpu className="w-3 h-3 text-white" /> Decentralized Mesh
        </span>
      </div>
    </div>
  );
}
