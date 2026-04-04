'use client';

import { useState, useCallback } from 'react';
import { ethers, JsonRpcSigner } from 'ethers';
import toast from 'react-hot-toast';
import { getContract, encodeZone, ENROLL_PREMIUM_ETH } from '@/lib/contract';

export interface RiderData {
  isEnrolled: boolean;
  weeklyPremium: string; // formatted ETH
  coverageHours: number;
  totalClaimed: string;   // formatted ETH
  lastClaimTime: number;  // unix timestamp
  trustScore: number;
  zone: string;           // bytes32 hex
}

export interface EventData {
  isActive: boolean;
  payoutPerEvent: string; // formatted ETH
  timestamp: number;
}

export interface ContractHook {
  riderData: RiderData | null;
  eventData: EventData | null;
  loading: boolean;
  txHash: string | null;
  enrollRider: (zone: string) => Promise<boolean>;
  triggerVoteEvent: (eventType: string, zone: string, value: number) => Promise<boolean>;
  claimPayout: () => Promise<boolean>;
  fetchRiderData: (address: string) => Promise<void>;
  fetchEventData: (zone: string) => Promise<void>;
}

export function useContract(signer: JsonRpcSigner | null): ContractHook {
  const [riderData, setRiderData] = useState<RiderData | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchRiderData = useCallback(async (address: string) => {
    if (!signer) return;
    try {
      const contract = getContract(signer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rider: any = await contract.getRider(address);
      setRiderData({
        isEnrolled: Boolean(rider[0] ?? rider.isEnrolled),
        weeklyPremium: ethers.formatEther(rider[1] ?? rider.weeklyPremium ?? 0n),
        coverageHours: Number(rider[2] ?? rider.coverageHours ?? 0),
        totalClaimed: ethers.formatEther(rider[3] ?? rider.totalClaimed ?? 0n),
        lastClaimTime: Number(rider[4] ?? rider.lastClaimTime ?? 0),
        trustScore: Number(rider[5] ?? rider.trustScore ?? 0),
        zone: String(rider[6] ?? rider.zone ?? ''),
      });
    } catch (err) {
      console.error('[fetchRiderData]', err);
    }
  }, [signer]);

  const fetchEventData = useCallback(async (zone: string) => {
    if (!signer) return;
    try {
      const contract = getContract(signer);
      const zoneKey = encodeZone(zone);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev: any = await contract.getFunction('getEvent')(zoneKey);
      
      const isActive = Boolean(ev[0] ?? ev.isActive);
      const hours = Number(ev[1] ?? ev.payoutPerEvent ?? 0n);
      
      // Smart contract pays PAY_PER_HOUR (0.01 ETH) per hour of payout
      const payoutEth = (hours * 0.01).toString();
      
      setEventData({
        isActive: isActive,
        payoutPerEvent: payoutEth,
        timestamp: Number(ev[2] ?? ev.timestamp ?? 0),
      });

    } catch (err) {
      console.error('[fetchEventData]', err);
    }
  }, [signer]);

  const enrollRider = useCallback(async (zone: string): Promise<boolean> => {
    if (!signer) {
      toast.error('Wallet not connected');
      return false;
    }
    setLoading(true);
    setTxHash(null);
    const toastId = toast.loading('Enrolling rider — confirm in MetaMask...');
    try {
      const contract = getContract(signer);
      const value = ethers.parseEther(ENROLL_PREMIUM_ETH);
      const tx = await contract.enrollRider(zone, { value });
      toast.loading(`Transaction submitted — waiting for confirmation...`, { id: toastId });
      setTxHash(tx.hash);
      await tx.wait();
      toast.success(`🎉 Enrolled in ${zone}! Policy is now active.`, { id: toastId, duration: 5000 });
      const address = await signer.getAddress();
      await fetchRiderData(address);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Enrollment failed';
      const friendly = message.includes('user rejected') ? 'Transaction rejected.' : `Enrollment failed: ${message.slice(0, 60)}`;
      toast.error(friendly, { id: toastId });
      return false;
    } finally {
      setLoading(false);
    }
  }, [signer, fetchRiderData]);

  const triggerVoteEvent = useCallback(async (
    eventType: string,
    zone: string,
    value: number
  ): Promise<boolean> => {
    if (!signer) {
      toast.error('Wallet not connected');
      return false;
    }
    setLoading(true);
    const toastId = toast.loading(`Triggering ${eventType} event — confirm in MetaMask...`);
    try {
      const contract = getContract(signer);
      const tx = await contract.voteEvent(eventType, zone, BigInt(Math.round(value)));
      toast.loading('Waiting for confirmation...', { id: toastId });
      setTxHash(tx.hash);
      await tx.wait();
      toast.success(`✅ ${eventType} event confirmed on-chain!`, { id: toastId, duration: 5000 });
      await fetchEventData(zone);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('user rejected')) {
        toast.error('Transaction rejected.', { id: toastId });
      } else {
        toast.error(`Transaction failed (Check if you are an Oracle): ${message.slice(0, 100)}…`, { id: toastId, duration: 6000 });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [signer, fetchEventData]);

  const claimPayout = useCallback(async (): Promise<boolean> => {
    if (!signer) {
      toast.error('Wallet not connected');
      return false;
    }
    setLoading(true);
    setTxHash(null);
    const toastId = toast.loading('Claiming payout — confirm in MetaMask...');
    try {
      const contract = getContract(signer);
      const tx = await contract.claimPayout();
      toast.loading('Waiting for on-chain confirmation...', { id: toastId });
      setTxHash(tx.hash);
      await tx.wait();
      toast.success('💰 Payout received! Funds in your wallet.', { id: toastId, duration: 6000 });
      const address = await signer.getAddress();
      await fetchRiderData(address);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Claim failed';
      const friendly = message.includes('user rejected')
        ? 'Transaction rejected.'
        : message.includes('Cooldown')
        ? 'Claim cooldown active. Try again later.'
        : `Claim failed: ${message.slice(0, 80)}`;
      toast.error(friendly, { id: toastId, duration: 5000 });
      return false;
    } finally {
      setLoading(false);
    }
  }, [signer, fetchRiderData]);

  return {
    riderData,
    eventData,
    loading,
    txHash,
    enrollRider,
    triggerVoteEvent,
    claimPayout,
    fetchRiderData,
    fetchEventData,
  };
}
