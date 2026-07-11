import { create } from 'zustand';
import { Candle, Signal, SignalDirection, SignalQuality, Timeframe, TradingPair } from '@/types';
import { marketRepository } from '@/lib/marketRepository';
import { computeSignal } from '@/lib/signalEngine';
import { twelveDataApi } from '@/lib/twelveDataApi';
import {
  isOnCooldown,
  getLastSignalDirection,
  setLastSignalTime,
  setLastSignalDirection,
  saveSignal,
  getQuotaInfo,
  incrementQuota,
} from '@/lib/storage';
import { showSignalNotification, sendSignalEmail } from '@/lib/notifications';
import { PAIR_CONFIG } from '@/lib/constants';
import { useSettingsStore } from './settingsStore';

interface CandleKey {
  pair: TradingPair;
  timeframe: Timeframe;
}

interface MarketState {
  candles: Record<string, Candle[]>;
  signals: Partial<Record<TradingPair, Signal>>;
  prices: Partial<Record<TradingPair, number>>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  apiUsage: { count: number; limit: number } | null;
  unsubscribeCallbacks: Record<string, () => void>;

  watchPair: (pair: TradingPair) => void;
  unwatchPair: (pair: TradingPair) => void;
  recomputeSignal: (pair: TradingPair) => void;
  refreshApiUsage: (apiKey: string) => Promise<void>;
}

function candleKey(pair: TradingPair, tf: Timeframe): string {
  return `${pair}_${tf}`;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  candles: {},
  signals: {},
  prices: {},
  loading: {},
  error: {},
  apiUsage: null,
  unsubscribeCallbacks: {},

  watchPair: (pair: TradingPair) => {
    const state = get();
    const timeframes = [Timeframe.M15, Timeframe.H1, Timeframe.H4, Timeframe.D1];

    timeframes.forEach((tf) => {
      const key = candleKey(pair, tf);
      if (state.unsubscribeCallbacks[key]) return;

      set((s) => ({
        loading: { ...s.loading, [key]: true },
        error: { ...s.error, [key]: null },
      }));

      const unsubscribe = marketRepository.watch(pair, tf, (newCandles) => {
        set((s) => ({
          candles: { ...s.candles, [key]: newCandles },
          loading: { ...s.loading, [key]: false },
        }));

        const config = PAIR_CONFIG[pair];
        if (config.source === 'twelveData') {
          incrementQuota();
          set({ apiUsage: getQuotaInfo() });
        }

        get().recomputeSignal(pair);
      });

      set((s) => ({
        unsubscribeCallbacks: { ...s.unsubscribeCallbacks, [key]: unsubscribe },
      }));
    });
  },

  unwatchPair: (pair: TradingPair) => {
    const state = get();
    const timeframes = [Timeframe.M15, Timeframe.H1, Timeframe.H4, Timeframe.D1];

    timeframes.forEach((tf) => {
      const key = candleKey(pair, tf);
      const unsub = state.unsubscribeCallbacks[key];
      if (unsub) {
        unsub();
        set((s) => {
          const newCallbacks = { ...s.unsubscribeCallbacks };
          delete newCallbacks[key];
          return { unsubscribeCallbacks: newCallbacks };
        });
      }
    });
  },

  recomputeSignal: (pair: TradingPair) => {
    const state = get();
    const c15 = state.candles[candleKey(pair, Timeframe.M15)];
    const c1H = state.candles[candleKey(pair, Timeframe.H1)];
    const c4H = state.candles[candleKey(pair, Timeframe.H4)];
    const c1D = state.candles[candleKey(pair, Timeframe.D1)] ?? [];

    if (!c15 || !c1H || !c4H || c15.length === 0) return;

    const signal = computeSignal(pair, c15, c1H, c4H, c1D);

    set((s) => ({
      signals: { ...s.signals, [pair]: signal },
      prices: { ...s.prices, [pair]: signal.price },
    }));

    handleSignalEffects(signal);
  },

  refreshApiUsage: async (apiKey: string) => {
    try {
      const usage = await twelveDataApi.fetchApiUsage(apiKey);
      set({ apiUsage: { count: usage.usage, limit: usage.limit } });
    } catch {
      set({ apiUsage: getQuotaInfo() });
    }
  },
}));

async function handleSignalEffects(signal: Signal): Promise<void> {
  if (signal.direction === SignalDirection.Wait) return;
  if (signal.quality === SignalQuality.None) return;

  const pair = signal.pair;
  const lastDirection = getLastSignalDirection(pair);
  const directionChanged = lastDirection != null && lastDirection !== signal.direction;
  const onCooldown = isOnCooldown(pair);

  if (onCooldown && !directionChanged) return;

  const settings = useSettingsStore.getState();

  if (settings.pushEnabled) {
    showSignalNotification(signal);
  }

  if (
    signal.quality === SignalQuality.Beautiful &&
    settings.emailEnabled &&
    settings.emailTo
  ) {
    sendSignalEmail(signal, settings.emailTo);
  }

  setLastSignalTime(pair, Date.now());
  setLastSignalDirection(pair, signal.direction);
  saveSignal(signal);
}
