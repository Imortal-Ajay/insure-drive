'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AIRiskData {
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  premiumINR: number;
  breakdown: { rain: number; temp: number; aqi: number };
  rawValues: { rain: number; temp: number; aqi: number };
  triggers: string[];
  zoneModifiers: Record<string, number>;
  timestamp: number;
  _fallback?: boolean;
}

export interface LossData {
  estimatedHours: number;
  estimatedIncomeLoss: number;
  breakdown: {
    rainHours: number;
    heatHours: number;
    aqiHours: number;
    combinedBonus: number;
    inactivityHours: number;
  };
  triggers: string[];
  severity: 'None' | 'Minor' | 'Moderate' | 'Severe';
  fraudRisk: 'Low' | 'Medium' | 'High';
  claimStatus: 'Verified' | 'Under Review';
  hourlyIncome: number;
}

interface UseAIEngineOptions {
  trustScore?: number;
  lastClaimTime?: number;
  inactivityMode?: boolean;
}

export function useAIEngine(options: UseAIEngineOptions = {}) {
  const [aiData, setAiData] = useState<AIRiskData | null>(null);
  const [lossData, setLossData] = useState<LossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch AI risk engine
      const riskRes = await fetch('/api/ai-risk-engine');
      const risk: AIRiskData = await riskRes.json();
      setAiData(risk);

      // Build loss predictor params from live values
      const { rain, temp, aqi } = risk.rawValues;
      const params = new URLSearchParams({
        rain:          String(rain),
        temp:          String(temp),
        aqi:           String(aqi),
        trustScore:    String(options.trustScore ?? 100),
        lastClaimTime: String(options.lastClaimTime ?? 0),
        inactivity:    String(options.inactivityMode ?? false),
      });
      const lossRes = await fetch(`/api/loss-predictor?${params}`);
      const loss: LossData = await lossRes.json();
      setLossData(loss);
      setLastFetched(new Date());
    } catch (err) {
      console.error('[useAIEngine]', err);
    } finally {
      setLoading(false);
    }
  }, [options.trustScore, options.lastClaimTime, options.inactivityMode]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(true), 120_000); // refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Compute zone-adjusted premium for a specific zone
  const getZonePremium = useCallback((zone: string): number => {
    if (!aiData) return 49;
    const mod = aiData.zoneModifiers[zone] ?? 0;
    return Math.round(aiData.premiumINR * (1 + mod));
  }, [aiData]);

  return {
    aiData,
    lossData,
    loading,
    lastFetched,
    getZonePremium,
    refresh: () => fetchAll(),
  };
}
