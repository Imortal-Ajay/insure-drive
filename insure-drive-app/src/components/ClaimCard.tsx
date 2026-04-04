'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CheckCircle2, Loader2, ExternalLink,
  AlertTriangle, Coins, ShieldCheck, ShieldAlert, Clock
} from 'lucide-react';
import type { EventData } from '@/hooks/useContract';
import type { LossData } from '@/hooks/useAIEngine';

interface ClaimCardProps {
  eventData: EventData | null;
  isEnrolled: boolean;
  isLoading: boolean;
  txHash: string | null;
  lossData: LossData | null;
  trustScore?: number;
  onClaim: () => void;
}

function FraudBadge({ status, fraudRisk }: { status: LossData['claimStatus']; fraudRisk: LossData['fraudRisk'] }) {
  if (status === 'Verified') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          <p className="text-[10px] font-bold text-emerald-400">Claim Verified</p>
          <p className="text-[9px] text-slate-500">AI fraud check passed</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
      <div>
        <p className="text-[10px] font-bold text-amber-400">Under Review</p>
        <p className="text-[9px] text-slate-500">
          {fraudRisk === 'High' ? 'Low trust score flagged' : 'Recent claim detected'}
        </p>
      </div>
    </div>
  );
}

export function ClaimCard({ eventData, isEnrolled, isLoading, txHash, lossData, onClaim }: ClaimCardProps) {
  const isActive = eventData?.isActive ?? false;
  const payout   = eventData?.payoutPerEvent ?? '0';
  const payoutFormatted = parseFloat(payout).toFixed(6);

  const claimStatus  = lossData?.claimStatus  ?? 'Verified';
  const fraudRisk    = lossData?.fraudRisk     ?? 'Low';
  const estimatedLoss = lossData?.estimatedIncomeLoss ?? 0;
  const estimatedHours = lossData?.estimatedHours ?? 0;
  const severity     = lossData?.severity ?? 'None';

  const canClaim = isEnrolled && isActive && !isLoading && claimStatus === 'Verified';
  const isBlocked = isActive && claimStatus === 'Under Review';

  const severityColor =
    severity === 'Severe'   ? 'text-rose-400' :
    severity === 'Moderate' ? 'text-orange-400' :
    severity === 'Minor'    ? 'text-amber-400' :
    'text-slate-500';

  return (
    <motion.div
      className={`glass-card rounded-[2rem] p-7 space-y-5 transition-all duration-500 ${
        isActive ? 'border-emerald-500/30 shadow-[0_0_40px_rgba(52,211,153,0.1)]' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-2">
          <Wallet className="w-4 h-4" /> Intelligent Claim
        </h2>
        {isActive && (
          <motion.span
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-pulse"
          >
            🚨 Claim Ready
          </motion.span>
        )}
      </div>

      {/* Auto-detection banner */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-3 flex items-start gap-3"
        >
          <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-300">Auto-detected disruption</p>
            <p className="text-[10px] text-slate-400">
              AI model triggered claim — zero manual intervention required
            </p>
          </div>
        </motion.div>
      )}

      {/* AI Loss estimate */}
      {lossData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a0710]/60 border border-white/[0.04] rounded-2xl p-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">AI Loss Estimate</p>
            <p className={`text-xl font-bold ${severityColor}`}>
              ₹{estimatedLoss}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {estimatedHours}h × ₹60/hr
            </p>
          </div>
          <div className="bg-[#0a0710]/60 border border-white/[0.04] rounded-2xl p-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Severity</p>
            <p className={`text-xl font-bold ${severityColor}`}>{severity}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {lossData.triggers.length > 0 ? lossData.triggers.join(' + ') : 'No active triggers'}
            </p>
          </div>
        </div>
      )}

      {/* Fraud status */}
      {isEnrolled && lossData && (
        <FraudBadge status={claimStatus} fraudRisk={fraudRisk} />
      )}

      {/* Payout display */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-1 py-4"
          >
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Smart Contract Payout</p>
            <div className="flex items-end justify-center gap-2">
              <span className="text-3xl text-emerald-400 font-light">Ξ</span>
              <motion.p
                className="text-5xl font-extrabold font-mono text-white tracking-tight drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                key={payoutFormatted}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {payoutFormatted}
              </motion.p>
            </div>
            <p className="text-xs text-slate-400">ETH · Direct to wallet · Zero-touch</p>
          </motion.div>
        ) : (
          <motion.div
            key="inactive"
            exit={{ opacity: 0 }}
            className="text-center py-6 space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto">
              <Coins className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Monitoring Conditions</p>
            <p className="text-xs text-slate-600 max-w-[200px] mx-auto leading-relaxed">
              {!isEnrolled
                ? 'Enroll to be eligible for automated payouts'
                : 'AI engine scanning for trigger conditions…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim / blocked button */}
      {isBlocked ? (
        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <Clock className="w-5 h-5 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold">Claim Under Review</p>
            <p className="text-xs opacity-70">AI fraud guard active · Please wait</p>
          </div>
        </div>
      ) : (
        <button
          id="claim-payout-btn"
          onClick={onClaim}
          disabled={!canClaim}
          className={`relative w-full overflow-hidden rounded-2xl p-[1px] group active:scale-[0.98] transition-all duration-300 ${
            !canClaim ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className={`absolute inset-0 transition-all ${
            canClaim
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-80 group-hover:opacity-100'
              : 'bg-white/10'
          }`} />
          <div className={`relative transition-colors px-6 py-4 rounded-2xl flex items-center justify-center gap-2 ${
            canClaim ? 'bg-[#050f0c] group-hover:bg-transparent' : 'bg-[#0a0f0a]'
          }`}>
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin text-emerald-300" /><span className="text-white font-bold">Processing…</span></>
            ) : canClaim ? (
              <><CheckCircle2 className="w-5 h-5 text-emerald-200" /><span className="text-white font-bold">Claim Now · Ξ{payoutFormatted}</span></>
            ) : (
              <span className="text-slate-500 font-semibold text-sm">
                {!isEnrolled ? 'Enrollment Required' : 'No Active Event'}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Transaction hash */}
      <AnimatePresence>
        {txHash && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest mb-1">⛓ Transaction Confirmed</p>
                <p className="text-xs font-mono text-slate-300 truncate max-w-[180px]">
                  {txHash.slice(0, 12)}…{txHash.slice(-8)}
                </p>
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl"
              >
                Etherscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isEnrolled && (
        <div className="flex items-start gap-2 text-amber-300/70 text-[10px]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Enroll as a rider first to be eligible for automated parametric payouts.
        </div>
      )}
    </motion.div>
  );
}
