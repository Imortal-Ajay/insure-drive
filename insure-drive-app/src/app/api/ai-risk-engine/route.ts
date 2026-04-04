import { NextResponse } from 'next/server';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const LAT = 13.0827;
const LON = 80.2707;

/** Normalize a value to [0, 1] given a min/max range */
function normalize(value: number, min: number, max: number): number {
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

function getRiskLevel(score: number): RiskLevel {
  if (score < 0.3) return 'Low';
  if (score < 0.55) return 'Medium';
  if (score < 0.75) return 'High';
  return 'Critical';
}

export async function GET() {
  try {
    // Fetch weather + AQI in parallel
    const [wRes, aqiRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`, { next: { revalidate: 60 } }),
      fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${LAT}&lon=${LON}&appid=${API_KEY}`, { next: { revalidate: 60 } }),
    ]);

    if (!wRes.ok || !aqiRes.ok) throw new Error('Failed to fetch weather/AQI data');

    const [wData, aqiData] = await Promise.all([wRes.json(), aqiRes.json()]);

    const rain: number = wData.rain?.['1h'] ?? 0;
    const temp: number = wData.main?.temp ?? 30;
    const aqiLevel: number = aqiData.list?.[0]?.main?.aqi ?? 1;
    // Map AQI level (1-5) to approx numeric AQI
    const aqiBands = [0, 50, 100, 150, 200, 300];
    const aqi: number = aqiBands[aqiLevel] ?? 0;

    // Normalize each factor on its triggering scale
    const normRain = normalize(rain, 0, 50);    // 0–50mm/hr
    const normTemp = normalize(temp, 20, 50);   // 20–50°C
    const normAqi  = normalize(aqi, 0, 300);    // 0–300 AQI

    // Weighted risk score (matches spec)
    const riskScore = 0.4 * normRain + 0.3 * normTemp + 0.3 * normAqi;

    // AI-adjusted premium: base ₹49 + up to ₹20 based on risk
    const premiumINR = Math.round(49 + riskScore * 20);

    const riskLevel = getRiskLevel(riskScore);

    // Individual trigger flags
    const triggers: string[] = [];
    if (rain > 20)  triggers.push('RAIN');
    if (temp > 40)  triggers.push('HEAT');
    if (aqi > 150)  triggers.push('AQI');
    if (rain > 20 && aqi > 100) triggers.push('COMBINED');

    // Historical zone modifier table (maps to zones the contract knows)
    const zoneModifiers: Record<string, number> = {
      'Anna Nagar':   -0.1,
      'T Nagar':       0.0,
      'Velachery':     0.15,
      'Marina Beach':  0.25,
      'Tambaram':     -0.05,
    };

    return NextResponse.json({
      riskScore: parseFloat(riskScore.toFixed(4)),
      riskLevel,
      premiumINR,
      breakdown: {
        rain:  parseFloat((0.4 * normRain).toFixed(4)),
        temp:  parseFloat((0.3 * normTemp).toFixed(4)),
        aqi:   parseFloat((0.3 * normAqi).toFixed(4)),
      },
      rawValues: { rain, temp, aqi },
      triggers,
      zoneModifiers,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI engine error';
    console.error('[/api/ai-risk-engine]', message);
    // Return safe defaults so UI never crashes
    return NextResponse.json({
      riskScore: 0.35,
      riskLevel: 'Medium',
      premiumINR: 56,
      breakdown: { rain: 0, temp: 0.15, aqi: 0.1 },
      rawValues: { rain: 0, temp: 35, aqi: 100 },
      triggers: [],
      zoneModifiers: {},
      timestamp: Date.now(),
      _fallback: true,
      error: message,
    });
  }
}
