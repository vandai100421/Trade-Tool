import { Candle, SignalDirection, TradingPair, Timeframe } from '@/types';
import { SIGNAL_COOLDOWN_MS } from './constants';

interface LastSignalState {
  timestamp: number;
  direction: SignalDirection;
}

function kvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function pairKey(pair: TradingPair): string {
  return `signal:last:${pair}`;
}

function candleCacheKey(pair: TradingPair, tf: Timeframe): string {
  return `candles:${pair}:${tf}`;
}

export async function getLastSignal(pair: TradingPair): Promise<LastSignalState | null> {
  if (!kvAvailable()) return null;
  try {
    const { kv } = await import('@vercel/kv');
    const raw = await kv.get<LastSignalState>(pairKey(pair));
    return raw ?? null;
  } catch {
    return null;
  }
}

export async function setLastSignal(pair: TradingPair, direction: SignalDirection): Promise<void> {
  if (!kvAvailable()) return;
  try {
    const { kv } = await import('@vercel/kv');
    const state: LastSignalState = { timestamp: Date.now(), direction };
    await kv.set(pairKey(pair), state);
  } catch {
    // ignore
  }
}

export async function isOnCooldownServer(
  pair: TradingPair,
  newDirection: SignalDirection,
): Promise<boolean> {
  const last = await getLastSignal(pair);
  if (!last) return false;

  const directionChanged = last.direction !== newDirection;
  if (directionChanged) return false;

  return Date.now() - last.timestamp < SIGNAL_COOLDOWN_MS;
}

export async function getCachedCandles(
  pair: TradingPair,
  tf: Timeframe,
): Promise<Candle[] | null> {
  if (!kvAvailable()) return null;
  try {
    const { kv } = await import('@vercel/kv');
    const raw = await kv.get<Candle[]>(candleCacheKey(pair, tf));
    return raw ?? null;
  } catch {
    return null;
  }
}

export async function setCachedCandles(
  pair: TradingPair,
  tf: Timeframe,
  candles: Candle[],
  ttlSeconds: number,
): Promise<void> {
  if (!kvAvailable()) return;
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set(candleCacheKey(pair, tf), candles, { ex: ttlSeconds });
  } catch {
    // ignore
  }
}
