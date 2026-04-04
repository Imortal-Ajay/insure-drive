'use client';

import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle, XCircle, TrendingDown, Award } from 'lucide-react';
import type { RiderData } from '@/hooks/useContract';

interface PolicyCardProps {
  riderData: RiderData | null;
  zonePremium: number;
}

const MAX_HOURS = 40;

function PolicyStat({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-[#0a0710]/50 border border-white/[0.04] rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-8 h-8 rounded-xl ${color.replace('text-', 'bg-').replace('400', '500/10')} border border-white/[0.04] flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export function PolicyCard({ riderData, zonePremium }: PolicyCardProps) {
  const isEnrolled   = riderData?.isEnrolled ?? false;
  const coverageHours = riderData?.coverageHours ?? 0;
  const totalClaimed  = riderData?.totalClaimed  ?? '0';
  const trustScore    = riderData?.trustScore    ?? 0;
  const premium       = riderData?.weeklyPremium;

  const usedHours = Math.max(MAX_HOURS - coverageHours, 0);
  const pct       = MAX_HOURS > 0 ? Math.min((usedHours / MAX_HOURS) * 100, 100) : 0;
  const barColor  = pct < 50 ? '#34d399' : pct < 80 ? '#fbbf24' : '#f87171';

  const isExhausted = coverageHours === 0 && isEnrolled;
  const status = !isEnrolled ? 'Not Enrolled' : isExhausted ? 'Exhausted' : 'Active';
  const statusColor =
    status === 'Active'    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
    status === 'Exhausted' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
    'text-slate-400 bg-slate-500/10 border-slate-500/20';

  const displayPremium = premium && parseFloat(premium) > 0
    ? `${parseFloat(premium).toFixed(4)} ETH`
    : `₹${zonePremium} / wk`;

  return (
    <motion.div
      className="glass-card rounded-[2rem] p-7 space-y-5 hover:border-indigo-500/20 transition-colors duration-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-4 h-4" /> Policy Dashboard
        </h2>
        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border ${statusColor}`}>
          {status === 'Active' && <CheckCircle className="w-3 h-3 inline mr-1" />}
          {status === 'Exhausted' && <XCircle className="w-3 h-3 inline mr-1" />}
          {status}
        </span>
      </div>

      {/* Premium + trust */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Weekly Premium</p>
          <p className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-300 tracking-tight">
            {displayPremium}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Trust Score</p>
          <div className="flex items-center gap-1 justify-end">
            <Award className={`w-4 h-4 ${trustScore >= 70 ? 'text-emerald-400' : trustScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`} />
            <span className={`text-xl font-bold ${trustScore >= 70 ? 'text-emerald-400' : trustScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
              {isEnrolled ? `${trustScore}/100` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {isEnrolled ? (
        <div className="grid grid-cols-2 gap-3">
          <PolicyStat
            label="Total Coverage"
            value={`${MAX_HOURS}h`}
            sub="Per policy cycle"
            icon={Clock}
            color="text-sky-400"
          />
          <PolicyStat
            label="Remaining"
            value={`${coverageHours}h`}
            sub={`${usedHours}h utilized`}
            icon={TrendingDown}
            color={coverageHours > 10 ? 'text-emerald-400' : 'text-rose-400'}
          />
        </div>
      ) : (
        <div className="text-center py-6 text-slate-600 text-xs">Enroll to view policy details</div>
      )}

      {/* Coverage bar */}
      {isEnrolled && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Coverage Utilized</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Total claimed */}
      {isEnrolled && (
        <div className="flex items-center justify-between text-xs border-t border-white/[0.05] pt-4">
          <span className="text-slate-400">Total Claimed</span>
          <span className="font-mono font-bold text-emerald-400">
            Ξ{parseFloat(totalClaimed).toFixed(6)} ETH
          </span>
        </div>
      )}
    </motion.div>
  );
}
