import { NextRequest, NextResponse } from 'next/server';

const HOURLY_INCOME_INR = 60; // ₹60 per hour (gig worker average)

interface LossPrediction {
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
}

function getSeverity(hours: number): LossPrediction['severity'] {
  if (hours === 0) return 'None';
  if (hours <= 2)  return 'Minor';
  if (hours <= 5)  return 'Moderate';
  return 'Severe';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rain   = parseFloat(searchParams.get('rain')   ?? '0');
  const temp   = parseFloat(searchParams.get('temp')   ?? '30');
  const aqi    = parseFloat(searchParams.get('aqi')    ?? '0');
  const trustScore = parseInt(searchParams.get('trustScore') ?? '100', 10);
  const lastClaimTime = parseInt(searchParams.get('lastClaimTime') ?? '0', 10);
  const inactivity = searchParams.get('inactivity') === 'true';

  // Loss hour model (matches spec)
  const rainHours       = rain > 20  ? 2 : 0;
  const heatHours       = temp > 40  ? 3 : 0;
  const aqiHours        = aqi  > 300 ? 1 : 0;
  const inactivityHours = inactivity ? 2 : 0;
  // Combined rain + high AQI bonus
  const combinedBonus   = (rain > 20 && aqi > 100) ? 1 : 0;

  const estimatedHours = rainHours + heatHours + aqiHours + inactivityHours + combinedBonus;
  const estimatedIncomeLoss = estimatedHours * HOURLY_INCOME_INR;

  const triggers: string[] = [];
  if (rainHours > 0)       triggers.push('RAIN');
  if (heatHours > 0)       triggers.push('HEAT');
  if (aqiHours > 0)        triggers.push('AQI');
  if (inactivityHours > 0) triggers.push('NO_ACTIVITY');
  if (combinedBonus > 0)   triggers.push('COMBINED');

  // Fraud detection logic
  const nowSeconds = Math.floor(Date.now() / 1000);
  const hoursSinceLastClaim = lastClaimTime > 0
    ? (nowSeconds - lastClaimTime) / 3600
    : Infinity;

  let fraudRisk: LossPrediction['fraudRisk'] = 'Low';
  if (trustScore < 40)               fraudRisk = 'High';
  else if (hoursSinceLastClaim < 24) fraudRisk = 'Medium';
  else if (trustScore < 70)          fraudRisk = 'Medium';

  const claimStatus: LossPrediction['claimStatus'] =
    fraudRisk === 'High' ? 'Under Review' : 'Verified';

  return NextResponse.json({
    estimatedHours,
    estimatedIncomeLoss,
    breakdown: {
      rainHours,
      heatHours,
      aqiHours,
      combinedBonus,
      inactivityHours,
    },
    triggers,
    severity: getSeverity(estimatedHours),
    fraudRisk,
    claimStatus,
    hourlyIncome: HOURLY_INCOME_INR,
    timestamp: Date.now(),
  } satisfies LossPrediction & { hourlyIncome: number; timestamp: number });
}
