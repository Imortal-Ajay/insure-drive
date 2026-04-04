'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, RefreshCw, Cpu, Droplets, Thermometer, Wind } from 'lucide-react';
import type { AIRiskData } from '@/hooks/useAIEngine';
import type { Zone } from '@/lib/contract';

interface RiskCardProps {
  aiData: AIRiskData | null;
  loading: boolean;
  selectedZone: Zone;
  zonePremium: number;
  lastFetched: Date | null;
  onRefresh: () => void;
}

function RiskMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score < 0.3  ? '#34d399' :  // emerald
    score < 0.55 ? '#fbbf24' :  // amber
    score < 0.75 ? '#f97316' :  // orange
    '#f43f5e';                   // rose

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
          {/* Progress */}
          <motion.circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 50}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - score) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-extrabold font-mono"
            style={{ color }}
            key={pct}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {pct}
          </motion.span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">/ 100</span>
        </div>
      </div>
    </div>
  );
}

const LEVEL_CONFIG = {
  Low:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]' },
  Medium:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' },
  High:     { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]' },
  Critical: { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]' },
};

export function RiskCard({ aiData, loading, selectedZone, zonePremium, lastFetched, onRefresh }: RiskCardProps) {
  const level = aiData?.riskLevel ?? 'Medium';
  const cfg = LEVEL_CONFIG[level];
  const score = aiData?.riskScore ?? 0.35;

  const breakdownItems = [
    { label: 'Rainfall (40%)',    icon: Droplets,    value: aiData?.breakdown.rain ?? 0, color: 'text-sky-400',     barColor: '#38bdf8' },
    { label: 'Temperature (30%)', icon: Thermometer,  value: aiData?.breakdown.temp ?? 0, color: 'text-orange-400',  barColor: '#fb923c' },
    { label: 'Air Quality (30%)', icon: Wind,         value: aiData?.breakdown.aqi  ?? 0, color: 'text-fuchsia-400', barColor: '#d946ef' },
  ];

  return (
    <motion.div
      className={`glass-card rounded-[2rem] p-7 space-y-5 transition-all duration-500 ${cfg.glow}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-2">
          <Brain className="w-4 h-4" /> AI Risk Engine
        </h2>
        <div className="flex items-center gap-2">
          {/* Live pulse */}
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.07] flex items-center justify-center transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main content — vertical meter and info */}
      <div className="flex flex-col items-center gap-6">

        {/* Risk gauge */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" className="w-36 h-36 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-purple-400 animate-pulse" />
              </motion.div>
            ) : (
              <motion.div key="meter" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <RiskMeter score={score} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Risk level badge */}
          <div className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {level} Risk
          </div>
        </div>

        {/* Right: breakdown + premium */}
        <div className="flex-1 w-full space-y-4">
          {/* Breakdown bars */}
          <div className="space-y-3">
            {breakdownItems.map((item) => (
              <div key={item.label} className="space-y-1" style={{ '--bar-color': item.barColor } as React.CSSProperties}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <item.icon className={`w-3 h-3 ${item.color}`} /> {item.label}
                  </span>
                  <span className={`font-bold ${item.color}`}>{Math.round(item.value * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(item.value * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Premium display */}
          <div className="border-t border-white/[0.05] pt-4 flex flex-col space-y-3 sm:space-y-0 sm:flex-row items-start sm:items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                AI-Adjusted Premium · {selectedZone}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-slate-400 text-sm">₹</span>
                <motion.span
                  key={zonePremium}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`text-3xl font-extrabold ${cfg.color}`}
                >
                  {zonePremium}
                </motion.span>
                <span className="text-slate-500 text-xs">/ week</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 mb-1">Base ₹49 + Risk Δ</p>
              <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +₹{zonePremium - 49} adjustment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row items-start sm:items-center justify-between text-[10px] text-slate-600 border-t border-white/[0.03] pt-3">
        <span className="flex items-center gap-1.5 min-w-0">
          <Brain className="w-3 h-3 text-purple-500 shrink-0" />
          <span className="truncate">Weighted ML model · Rain×0.4 + Temp×0.3 + AQI×0.3</span>
        </span>
        {lastFetched && <span className="shrink-0">Updated {lastFetched.toLocaleTimeString()}</span>}
      </div>
    </motion.div>
  );
}
