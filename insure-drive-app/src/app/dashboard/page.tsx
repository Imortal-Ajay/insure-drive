'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, LogOut, ExternalLink, Activity } from 'lucide-react';

import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { useAIEngine } from '@/hooks/useAIEngine';
import { type Zone } from '@/lib/contract';

import { RiderOverviewCard } from '@/components/RiderOverviewCard';
import { RiskCard } from '@/components/RiskCard';
import { PolicyCard } from '@/components/PolicyCard';
import { WeatherCard } from '@/components/WeatherCard';
import { EventStatusCard } from '@/components/EventStatusCard';
import { ClaimCard } from '@/components/ClaimCard';
import { ImmutableLedger, type LogEntry } from '@/components/ImmutableLedger';
import { LiveStatusBanner } from '@/components/LiveStatusBanner';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';

function nowStr() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function makeLog(tag: string, tagColor: string, message: string, highlight = false): LogEntry {
  return { id: `${Date.now()}-${Math.random()}`, time: nowStr(), tag, tagColor, message, highlight };
}

// Derive live status banner state from all signals
type BannerState = 'monitoring' | 'risk-increasing' | 'critical' | 'claim-ready' | 'processing' | 'verified';

function resolveBannerState(params: {
  riskScore: number;
  isEventActive: boolean;
  isProcessing: boolean;
  lastClaimSuccess: boolean;
  triggeredEvent: string | null;
}): BannerState {
  if (params.lastClaimSuccess) return 'verified';
  if (params.isProcessing) return 'processing';
  if (params.isEventActive) return 'claim-ready';
  if (params.riskScore >= 0.75) return 'critical';
  if (params.riskScore >= 0.5) return 'risk-increasing';
  return 'monitoring';
}

export default function DashboardPage() {
  const router = useRouter();
  const wallet = useWallet();
  const contract = useContract(wallet.signer);

  const [selectedZone, setSelectedZone] = useState<Zone>('Velachery');
  const [liveRiskFlags, setLiveRiskFlags] = useState<string[]>([]);
  const [lastClaimSuccess, setLastClaimSuccess] = useState(false);
  const [triggeredEvent, setTriggeredEvent] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([
    makeLog('[SYSTEM]', 'text-indigo-400', 'Insure Drive AI node initialized. Blockchain handshake complete.'),
    makeLog('[AI]', 'text-purple-400', 'Risk engine online. Fetching live weather + AQI feeds for Chennai.'),
    makeLog('[LEDGER]', 'text-emerald-400', 'Policy engine active. Monitoring zones per smart contract.'),
  ]);

  const addLog = useCallback((tag: string, tagColor: string, message: string, highlight = false) => {
    setLogs(prev => [...prev.slice(-40), makeLog(tag, tagColor, message, highlight)]);
  }, []);

  // ── AI Engine ──────────────────────────────────────────────────────────────
  const riderTrustScore = contract.riderData?.trustScore ?? 100;
  const riderLastClaim = contract.riderData?.lastClaimTime ?? 0;

  const ai = useAIEngine({
    trustScore: riderTrustScore,
    lastClaimTime: riderLastClaim,
    inactivityMode: false,
  });

  const zonePremium = useMemo(
    () => ai.getZonePremium(selectedZone),
    [ai, selectedZone]
  );

  // ── Auth redirect ─────────────────────────────────────────────────────────
  // Only redirect after the silent eth_accounts check completes (isInitialized).
  // Without isInitialized guard, the dashboard boots the user out before the
  // shared WalletContext has had a chance to silently reconnect MetaMask.
  useEffect(() => {
    if (wallet.isInitialized && !wallet.isConnected) router.replace('/');
  }, [wallet.isInitialized, wallet.isConnected, router]);

  // ── Load on connect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (wallet.address && wallet.signer) {
      contract.fetchRiderData(wallet.address);
      contract.fetchEventData(selectedZone);
      addLog('[SYSTEM]', 'text-indigo-400', `Identity verified: ${wallet.address.slice(0, 10)}… Encryption active.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address, wallet.signer]);

  // ── Refresh events on zone change ──────────────────────────────────────────
  useEffect(() => {
    if (wallet.signer) contract.fetchEventData(selectedZone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone]);

  // ── Log AI engine results when data first arrives ─────────────────────────
  useEffect(() => {
    if (ai.aiData) {
      addLog(
        '[AI]', 'text-purple-400',
        `Risk score computed: ${ai.aiData.riskScore.toFixed(3)} (${ai.aiData.riskLevel}) · Premium ₹${ai.aiData.premiumINR} → Zone-adj ₹${zonePremium}.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.aiData?.timestamp]);

  // ── Computed state ─────────────────────────────────────────────────────────
  const isEnrolled = contract.riderData?.isEnrolled ?? false;
  const isEventActive = contract.eventData?.isActive ?? false;

  const displayEventData = contract.eventData;

  const bannerState = resolveBannerState({
    riskScore: ai.aiData?.riskScore ?? 0,
    isEventActive,
    isProcessing: contract.loading,
    lastClaimSuccess,
    triggeredEvent,
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEnroll = async () => {
    addLog('[AI]', 'text-purple-400', `AI enrollment check: Zone ${selectedZone} · Risk ${ai.aiData?.riskLevel ?? '?'} · Premium ₹${zonePremium}.`);
    addLog('[LEDGER]', 'text-sky-400', `Enrollment initiated for zone: ${selectedZone}…`);
    const ok = await contract.enrollRider(selectedZone);
    if (ok) {
      addLog('[LEDGER]', 'text-emerald-400', `Policy activated for ${selectedZone}. Smart contract tracking begins.`, true);
    } else {
      addLog('[ERROR]', 'text-rose-400', 'Enrollment transaction failed or was rejected.');
    }
  };

  const handleSimulate = async (eventType: string, value: number) => {
    setTriggeredEvent(eventType);
    addLog('[ORACLE]', 'text-fuchsia-400', `Oracle querying: ${eventType} event in ${selectedZone} (value: ${value})…`);
    const ok = await contract.triggerVoteEvent(eventType, selectedZone, value);
    if (ok) {
      addLog('[ORACLE]', 'text-rose-400', `SMART CONTRACT EXECUTED: ${eventType} confirmed on block. Payout available.`, true);
    } else {
      addLog('[ERROR]', 'text-rose-400', `Oracle execution failed: ensure you have oracle rights to execute ${eventType}.`);
    }
  };

  const handleClaim = async () => {
    setLastClaimSuccess(false);
    addLog('[SYSTEM]', 'text-indigo-400', 'Claim submitted to smart contract…');
    const ok = await contract.claimPayout();
    if (ok) {
      setLastClaimSuccess(true);
      setTriggeredEvent(null);
      addLog('[LEDGER]', 'text-emerald-400', `Payout confirmed. Tx: ${contract.txHash?.slice(0, 12)}…`, true);
    } else {
      addLog('[ERROR]', 'text-rose-400', 'Claim failed. Cooldown may be active or no event on-chain.');
    }
  };

  const handleRiskDetected = useCallback((flags: string[]) => {
    setLiveRiskFlags(flags);
    flags.forEach(f =>
      addLog('[WEATHER]', 'text-orange-400', `Live data: ${f} threshold exceeded. Trigger available.`)
    );
  }, [addLog]);

  const handleRefreshEvent = useCallback(() => {
    if (wallet.signer) contract.fetchEventData(selectedZone);
  }, [contract, selectedZone, wallet.signer]);

  // Show spinner while wallet context is doing the silent eth_accounts check
  if (!wallet.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 uppercase tracking-widest">Initializing AI Engine…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background blobs */}
      <div className="blob bg-indigo-500/15 w-[500px] h-[500px] top-0 left-0" />
      <div className="blob bg-fuchsia-500/15 w-80 h-80 bottom-0 right-0" style={{ animationDelay: '-10s' }} />
      <div className="blob bg-sky-500/10 w-96 h-96 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '-5s' }} />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-5">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.header
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-5 md:px-8 rounded-[2rem]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-40 rounded-full" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-indigo-300 drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Insure Drive<span className="text-indigo-500">.</span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                AI-Powered · {selectedZone} · Sepolia Testnet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="glass-panel px-5 py-3 rounded-2xl flex-1 md:flex-none flex items-center gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Wallet Balance</p>
                <p className="text-xl font-bold font-mono text-white">{wallet.ethBalance} ETH</p>
              </div>
              {ai.aiData && (
                <div className="border-l border-white/10 pl-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">AI Premium</p>
                  <p className="text-xl font-bold text-purple-300">₹{zonePremium}<span className="text-xs text-slate-500">/wk</span></p>
                </div>
              )}
            </div>

            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank" rel="noopener noreferrer"
              className="w-11 h-11 rounded-2xl glass-panel flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
              title="View contract on Etherscan"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>

            <button
              onClick={() => { wallet.disconnect(); router.replace('/'); }}
              className="w-11 h-11 rounded-2xl glass-panel flex items-center justify-center hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors shrink-0"
              title="Disconnect wallet"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </motion.header>

        {/* ── Network warning ───────────────────────────────────────────── */}
        {wallet.isConnected && !wallet.isCorrectNetwork && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            <Activity className="w-5 h-5 animate-pulse shrink-0" />
            Wrong network. Switch MetaMask to <strong className="mx-1">Sepolia Testnet</strong> and reload.
          </div>
        )}

        {/* ── Live Status Banner ────────────────────────────────────────── */}
        <LiveStatusBanner
          state={bannerState}
          riskScore={ai.aiData?.riskScore}
          riskLevel={ai.aiData?.riskLevel}
          triggeredEvent={triggeredEvent}
          zoneName={selectedZone}
        />

        {/* ── Row 1: Rider Profile | AI Risk Engine | Policy | Weather ──── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <RiderOverviewCard
            address={wallet.address ?? ''}
            riderData={contract.riderData}
            selectedZone={selectedZone}
            onZoneChange={setSelectedZone}
            onEnroll={handleEnroll}
            isEnrolling={contract.loading}
            ethBalance={wallet.ethBalance}
            aiData={ai.aiData}
            zonePremium={zonePremium}
          />
          <RiskCard
            aiData={ai.aiData}
            loading={ai.loading}
            selectedZone={selectedZone}
            zonePremium={zonePremium}
            lastFetched={ai.lastFetched}
            onRefresh={ai.refresh}
          />
          <PolicyCard
            riderData={contract.riderData}
            zonePremium={zonePremium}
          />
          <WeatherCard onRiskDetected={handleRiskDetected} />
        </div>

        {/* ── Row 2: Automated Trigger Oracle (3 triggers) ─────────────── */}
        <EventStatusCard
          eventData={displayEventData ?? null}
          selectedZone={selectedZone}
          isEnrolled={isEnrolled}
          isLoading={contract.loading}
          liveRiskFlags={liveRiskFlags}
          onSimulate={handleSimulate}
          onLiveDetect={handleSimulate}
          onRefreshEvent={handleRefreshEvent}
        />

        {/* ── Row 3: Intelligent Claim | Immutable Ledger ───────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-2">
            <ClaimCard
              eventData={displayEventData ?? null}
              isEnrolled={isEnrolled}
              isLoading={contract.loading}
              txHash={contract.txHash}
              lossData={ai.lossData}
              trustScore={riderTrustScore}
              onClaim={handleClaim}
            />
          </div>
          <div className="xl:col-span-3">
            <ImmutableLedger logs={logs} />
          </div>
        </div>

      </div>
    </div>
  );
}
