import { Candle, DataSource, Timeframe, TradingPair } from '@/types';
import { PAIR_CONFIG } from './constants';
import { fetchBinanceKlines, subscribeBinanceKline } from './binanceApi';
import { twelveDataApi } from './twelveDataApi';
import {
  CANDLE_COUNT,
  POLL_INTERVAL_D1,
  POLL_INTERVAL_H1,
  POLL_INTERVAL_H4,
  POLL_INTERVAL_M15,
} from './constants';

type UpdateCallback = (candles: Candle[]) => void;

interface Watcher {
  candles: Candle[];
  intervalId: ReturnType<typeof setInterval> | null;
  ws: WebSocket | null;
  callbacks: Set<UpdateCallback>;
}

export class MarketRepository {
  private watchers = new Map<string, Watcher>();
  private twelveDataApiKey: string | null = null;

  setTwelveDataApiKey(key: string | null): void {
    this.twelveDataApiKey = key;
  }

  private key(pair: TradingPair, tf: Timeframe): string {
    return `${pair}_${tf}`;
  }

  async fetchCandles(pair: TradingPair, timeframe: Timeframe): Promise<Candle[]> {
    const config = PAIR_CONFIG[pair];

    if (config.source === DataSource.Binance) {
      return fetchBinanceKlines(config.apiSymbol, getBinanceInterval(timeframe));
    }

    if (!this.twelveDataApiKey) {
      throw new Error(`Twelve Data API key required for ${config.displayName}`);
    }
    return twelveDataApi.fetchTimeSeries(pair, timeframe, this.twelveDataApiKey);
  }

  watch(pair: TradingPair, timeframe: Timeframe, callback: UpdateCallback): () => void {
    const k = this.key(pair, timeframe);
    let watcher = this.watchers.get(k);

    if (watcher) {
      watcher.callbacks.add(callback);
      callback(watcher.candles);
      return () => this.unwatch(k, callback);
    }

    watcher = { candles: [], intervalId: null, ws: null, callbacks: new Set([callback]) };
    this.watchers.set(k, watcher);

    this.startWatching(pair, timeframe, watcher);

    return () => this.unwatch(k, callback);
  }

  private async startWatching(pair: TradingPair, timeframe: Timeframe, watcher: Watcher): Promise<void> {
    const config = PAIR_CONFIG[pair];

    try {
      const candles = await this.fetchCandles(pair, timeframe);
      watcher.candles = candles;
      this.notify(watcher);
    } catch (e) {
      console.error(`Failed to fetch candles for ${pair}_${timeframe}:`, e);
    }

    if (config.source === DataSource.Binance) {
      watcher.ws = subscribeBinanceKline(
        pair,
        timeframe,
        (candle, isClosed) => {
          this.updateCandle(watcher, candle, isClosed);
        },
        (error) => {
          console.error(`WebSocket error for ${pair}_${timeframe}:`, error);
        },
      );
    } else {
      const interval = getPollInterval(timeframe);
      watcher.intervalId = setInterval(async () => {
        if (document.hidden) return;
        try {
          const candles = await this.fetchCandles(pair, timeframe);
          watcher.candles = candles;
          this.notify(watcher);
        } catch (e) {
          console.error(`Poll error for ${pair}_${timeframe}:`, e);
        }
      }, interval);
    }
  }

  private updateCandle(watcher: Watcher, candle: Candle, isClosed: boolean): void {
    if (watcher.candles.length === 0) return;

    const last = watcher.candles[watcher.candles.length - 1];
    if (candle.timestamp === last.timestamp) {
      watcher.candles[watcher.candles.length - 1] = candle;
    } else if (candle.timestamp > last.timestamp) {
      watcher.candles.push(candle);
      if (watcher.candles.length > CANDLE_COUNT * 2) {
        watcher.candles.shift();
      }
    }
    this.notify(watcher);
  }

  private notify(watcher: Watcher): void {
    const snapshot = [...watcher.candles];
    watcher.callbacks.forEach((cb) => cb(snapshot));
  }

  private unwatch(k: string, callback: UpdateCallback): void {
    const watcher = this.watchers.get(k);
    if (!watcher) return;

    watcher.callbacks.delete(callback);
    if (watcher.callbacks.size > 0) return;

    if (watcher.intervalId) clearInterval(watcher.intervalId);
    if (watcher.ws) {
      watcher.ws.close();
    }
    this.watchers.delete(k);
  }

  dispose(): void {
    for (const watcher of this.watchers.values()) {
      if (watcher.intervalId) clearInterval(watcher.intervalId);
      if (watcher.ws) watcher.ws.close();
    }
    this.watchers.clear();
  }
}

function getBinanceInterval(tf: Timeframe): string {
  switch (tf) {
    case Timeframe.M15: return '15m';
    case Timeframe.H1: return '1h';
    case Timeframe.H4: return '4h';
    case Timeframe.D1: return '1d';
  }
}

function getPollInterval(tf: Timeframe): number {
  switch (tf) {
    case Timeframe.M15: return POLL_INTERVAL_M15;
    case Timeframe.H1: return POLL_INTERVAL_H1;
    case Timeframe.H4: return POLL_INTERVAL_H4;
    case Timeframe.D1: return POLL_INTERVAL_D1;
  }
}

export const marketRepository = new MarketRepository();
