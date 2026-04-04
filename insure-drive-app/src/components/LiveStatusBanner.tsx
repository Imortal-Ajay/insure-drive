'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Eye, AlertTriangle, CheckCircle, TrendingUp, Zap } from 'lucide-react';

type BannerState = 'monitoring' | 'risk-increasing' | 'critical' | 'claim-ready' | 'processing' | 'verified';

interface LiveStatusBannerProps {
  state: BannerState;
  riskScore?: number;
  riskLevel?: string;
  triggeredEvent?: string | null;
  zoneName?: string;
}

const BANNER_CONFIG: Record<BannerState, {
  icon: React.ElementType;
  message: (ctx: LiveStatusBannerProps) => string;
  subtext: string;
  colors: string;
  pulse: boolean;
}> = {
  monitoring: {
    icon: Eye,
    message: (ctx) => `🔍 AI Engine monitoring conditions across ${ctx.zoneName ?? 'Chennai'} zones…`,
    subtext: 'Real-time weather + AQI data feeds active · Smart contract ready',
    colors: 'bg-indigo-500/8 border-indigo-500/20 text-indigo-200',
    pulse: false,
  },
  'risk-increasing': {
    icon: TrendingUp,
    message: (ctx) => `⚠️ Risk increasing — ${ctx.riskLevel} score detected in ${ctx.zoneName ?? 'your zone'}`,
    subtext: 'Weather thresholds approaching trigger levels · Monitor closely',
    colors: 'bg-amber-500/10 border-amber-500/25 text-amber-200',
    pulse: true,
  },
  critical: {
    icon: AlertTriangle,
    message: () => '🚨 Critical conditions detected — parametric trigger threshold exceeded',
    subtext: 'Oracle is querying on-chain data · Claim may be available shortly',
    colors: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
    pulse: true,
  },
  'claim-ready': {
    icon: Zap,
    message: (ctx) => `💰 ${ctx.triggeredEvent ?? 'Disruption'} detected — claim available now`,
    subtext: 'Smart contract event confirmed · Zero-touch payout ready to process',
    colors: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    pulse: true,
  },
  processing: {
    icon: Zap,
    message: () => '⚡ Processing claim — smart contract executing payout…',
    subtext: 'Transaction submitted to Sepolia · Funds will arrive shortly',
    colors: 'bg-purple-500/10 border-purple-500/30 text-purple-200',
    pulse: true,
  },
  verified: {
    icon: CheckCircle,
    message: () => '✅ Payout verified and transferred to your wallet',
    subtext: 'Transaction confirmed on Sepolia · Policy coverage reset',
    colors: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    pulse: false,
  },
};

export function LiveStatusBanner({ state, riskScore, riskLevel, triggeredEvent, zoneName }: LiveStatusBannerProps) {
  const cfg = BANNER_CONFIG[state];
  const Icon = cfg.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.35 }}
        className={`relative overflow-hidden rounded-2xl border px-5 py-4 ${cfg.colors}`}
      >
        {/* Animated scan line */}
        {cfg.pulse && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <div className="relative z-10 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.pulse ? 'animate-pulse' : ''} bg-white/5 border border-white/10`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">
              {cfg.message({ state, riskScore, riskLevel, triggeredEvent, zoneName })}
            </p>
            <p className="text-[11px] opacity-60 mt-0.5">{cfg.subtext}</p>
          </div>

          {/* Risk score badge */}
          {riskScore !== undefined && state !== 'verified' && (
            <div className="shrink-0 text-right hidden md:block">
              <p className="text-[10px] opacity-50 uppercase tracking-widest">Risk Score</p>
              <p className="text-lg font-bold font-mono">{Math.round(riskScore * 100)}</p>
            </div>
          )}

          {/* Pulse dot */}
          {cfg.pulse && (
            <div className="w-2.5 h-2.5 rounded-full bg-current shrink-0 animate-pulse" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
