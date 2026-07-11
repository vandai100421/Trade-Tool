import { Signal, SignalDirection, TradingPair } from '@/types';
import { SIGNAL_COOLDOWN_MS, STORAGE_KEYS, TWELVE_DATA_DAILY_LIMIT } from './constants';
import { todayKey } from './utils';

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — ignore
  }
}

export function getSettings(): { twelveDataKey: string; emailTo: string; emailEnabled: boolean; pushEnabled: boolean } {
  return readJSON(STORAGE_KEYS.settings, {
    twelveDataKey: '',
    emailTo: '',
    emailEnabled: false,
    pushEnabled: true,
  });
}

export function saveSettings(settings: {
  twelveDataKey: string;
  emailTo: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
}): void {
  writeJSON(STORAGE_KEYS.settings, settings);
}

export function getLastSignalTime(pair: TradingPair): number | null {
  const key = `ts_lastSignal_${pair}`;
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(key);
  return val ? parseInt(val, 10) : null;
}

export function setLastSignalTime(pair: TradingPair, timestamp: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`ts_lastSignal_${pair}`, timestamp.toString());
}

export function getLastSignalDirection(pair: TradingPair): SignalDirection | null {
  const key = `ts_lastDir_${pair}`;
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(key);
  if (!val) return null;
  try {
    return val as SignalDirection;
  } catch {
    return null;
  }
}

export function setLastSignalDirection(pair: TradingPair, direction: SignalDirection): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`ts_lastDir_${pair}`, direction);
}

export function isOnCooldown(pair: TradingPair): boolean {
  const lastTime = getLastSignalTime(pair);
  if (!lastTime) return false;
  return Date.now() - lastTime < SIGNAL_COOLDOWN_MS;
}

export function saveSignal(signal: Signal): void {
  const signals = readJSON<Signal[]>(STORAGE_KEYS.signals, []);
  signals.push(signal);
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = signals.filter((s) => new Date(s.timestamp).getTime() > cutoff);
  writeJSON(STORAGE_KEYS.signals, filtered);
}

export function getSignalHistory(pair: TradingPair): Signal[] {
  const signals = readJSON<Signal[]>(STORAGE_KEYS.signals, []);
  return signals.filter((s) => s.pair === pair).slice(-50);
}

interface QuotaData {
  date: string;
  count: number;
}

export function getTodayQuota(): number {
  const data = readJSON<QuotaData>(STORAGE_KEYS.quota, { date: '', count: 0 });
  if (data.date !== todayKey()) return 0;
  return data.count;
}

export function incrementQuota(): void {
  const today = todayKey();
  const data = readJSON<QuotaData>(STORAGE_KEYS.quota, { date: today, count: 0 });
  if (data.date !== today) {
    data.date = today;
    data.count = 0;
  }
  data.count++;
  writeJSON(STORAGE_KEYS.quota, data);
}

export function setQuota(count: number): void {
  writeJSON(STORAGE_KEYS.quota, { date: todayKey(), count });
}

export function getQuotaInfo(): { count: number; limit: number } {
  return { count: getTodayQuota(), limit: TWELVE_DATA_DAILY_LIMIT };
}
