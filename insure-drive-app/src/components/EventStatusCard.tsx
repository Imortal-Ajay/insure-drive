'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain, Thermometer, Wind, Zap, Radio,
  CheckCircle2, AlertTriangle, Loader2, UserX, Activity
} from 'lucide-react';
import type { EventData } from '@/hooks/useContract';

interface EventStatusCardProps {
  eventData: EventData | null;
  selectedZone: string;
  isEnrolled: boolean;
  isLoading: boolean;
  liveRiskFlags: string[];
  onSimulate: (eventType: string, value: number) => Promise<void>;
  onLiveDetect: (eventType: string, value: number) => Promise<void>;
  onRefreshEvent: () => void;
}

const EVENT_TYPES = [
  {
    key: 'RAIN',
    icon: CloudRain, title: 'Torrential Rain',
    threshold: '>20mm/hr', value: 25,
    color: 'text-sky-400', accent: 'bg-sky-500/10', border: 'border-sky-500/20',
    glow: 'shadow-[0_0_30px_rgba(14,165,233,0.15)]',
    desc: 'OpenWeather API',
    mockOnly: false,
    payout: '4 Hrs (Ξ0.04)',
  },
  {
    key: 'HEAT',
    icon: Thermometer, title: 'Heatwave',
    threshold: '>40°C', value: 42,
    color: 'text-orange-400', accent: 'bg-orange-500/10', border: 'border-orange-500/20',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]',
    desc: 'Hyperlocal Sensors',
    mockOnly: false,
    payout: '6 Hrs (Ξ0.06)',
  },
  {
    key: 'AQI',
    icon: Wind, title: 'Toxic Smog',
    threshold: 'AQI>300', value: 350,
    color: 'text-fuchsia-400', accent: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20',
    glow: 'shadow-[0_0_30px_rgba(192,38,211,0.15)]',
    desc: 'Urban Air Sensors',
    mockOnly: false,
    payout: '3 Hrs (Ξ0.03)',
  },
];

export function EventStatusCard({
  eventData,
  selectedZone,
  isEnrolled,
  isLoading,
  liveRiskFlags,
  onSimulate,
  onLiveDetect,
  onRefreshEvent,
}: EventStatusCardProps) {
  const [simulatingKey, setSimulatingKey] = useState<string | null>(null);

  const handleSimulate = async (key: string, value: number) => {
    if (!isEnrolled) return;
    setSimulatingKey(key);

    await onSimulate(key, value);
    setSimulatingKey(null);
    onRefreshEvent();
  };

  const handleLiveDetect = async (key: string, value: number) => {
    if (!isEnrolled || !liveRiskFlags.includes(key)) return;
    setSimulatingKey(key);
    await onLiveDetect(key, value);
    setSimulatingKey(null);
    onRefreshEvent();
  };

  const isEventActive = eventData?.isActive ?? false;
  // Let Oracles interact with simulation buttons even if they haven't bought a policy themselves
  const canInteract = !isLoading && !simulatingKey;

  return (
    <motion.div
      className="glass-card rounded-[2rem] p-7 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-2">
          <Radio className="w-4 h-4" /> Automated Trigger Oracle · 3 Active Protocols
        </h2>
        <div className="flex items-center gap-2">
          {isEventActive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="w-3 h-3 animate-pulse" />
              {selectedZone} · Active Event
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-3 h-3" />
              No Disruption
            </span>
          )}
        </div>
      </div>

      {/* Active event banner */}
      <AnimatePresence>
        {isEventActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-300">Parametric Event Active — Payout Ready</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {eventData?.isActive
                  ? `Smart contract confirmed · Ξ${parseFloat(eventData.payoutPerEvent).toFixed(6)} ETH per claim`
                  : 'Monitoring conditions…'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger cards — 3 core triggers configured for contract */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EVENT_TYPES.map(({ key, icon: Icon, title, threshold, value, color, accent, border, glow, desc, payout }) => {
          const isSimulating = simulatingKey === key;
          const liveTriggered = liveRiskFlags.includes(key);
          const isTriggered = liveTriggered;

          return (
            <div
              key={key}
              className={`relative rounded-2xl p-4 border ${isTriggered ? `${border} ${glow}` : 'border-white/[0.04]'} bg-[#0a0710]/60 flex flex-col gap-3 transition-all duration-300`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl ${accent} border ${border} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{title}</p>
                  <p className={`text-[10px] font-semibold ${color}`}>{threshold}</p>
                </div>
              </div>

              {isTriggered && (
                <div className={`flex items-center gap-1.5 text-[10px] ${color} font-semibold`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Live threshold exceeded
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{desc}</span>
                <span className="text-emerald-400 font-semibold">{payout}</span>
              </div>

              {/* Simulate button */}
              <button
                id={`simulate-${key.toLowerCase()}-btn`}
                onClick={() => handleSimulate(key, value)}
                disabled={!canInteract}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 border ${border} ${accent} ${color} hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isSimulating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Triggering…</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Simulate {key}</>
                )}
              </button>

              {/* Live detect button */}
              {liveTriggered && (
                <button
                  onClick={() => handleLiveDetect(key, value)}
                  disabled={!canInteract}
                  className="w-full py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Radio className="w-3 h-3 text-emerald-400" /> Trigger from Live Data
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!isEnrolled && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Enroll as a rider to activate oracle triggers and claim payouts
        </div>
      )}
    </motion.div>
  );
}
