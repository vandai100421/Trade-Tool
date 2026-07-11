import { ApiUsage, Candle, Timeframe, TradingPair } from '@/types';
import {
  CANDLE_COUNT,
  PAIR_CONFIG,
  TIMEFRAME_CONFIG,
  TWELVE_DATA_BASE_URL,
  TWELVE_DATA_DAILY_LIMIT,
  TWELVE_DATA_WARNING_THRESHOLD,
} from './constants';
import { todayKey } from './utils';

class TwelveDataApi {
  private dailyCount = 0;
  private currentDate = todayKey();

  get dailyRequestCount(): number {
    this.checkDate();
    return this.dailyCount;
  }

  get remainingRequests(): number {
    return TWELVE_DATA_DAILY_LIMIT - this.dailyCount;
  }

  get isQuotaWarning(): boolean {
    return this.dailyCount >= TWELVE_DATA_WARNING_THRESHOLD;
  }

  get isQuotaExceeded(): boolean {
    return this.dailyCount >= TWELVE_DATA_DAILY_LIMIT;
  }

  private checkDate(): void {
    const today = todayKey();
    if (today !== this.currentDate) {
      this.dailyCount = 0;
      this.currentDate = today;
    }
  }

  private incrementCount(): void {
    this.checkDate();
    this.dailyCount++;
  }

  setCount(count: number): void {
    this.dailyCount = count;
    this.currentDate = todayKey();
  }

  async fetchTimeSeries(
    pair: TradingPair,
    timeframe: Timeframe,
    apiKey: string,
    outputsize: number = CANDLE_COUNT,
  ): Promise<Candle[]> {
    this.checkDate();
    if (this.isQuotaExceeded) {
      throw new Error(`Twelve Data quota exceeded: ${this.dailyCount}/${TWELVE_DATA_DAILY_LIMIT}`);
    }

    const symbol = PAIR_CONFIG[pair].apiSymbol;
    const interval = TIMEFRAME_CONFIG[timeframe].twelveDataInterval;
    const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;

    const res = await fetch(url);
    this.incrementCount();

    const data = await res.json();
    if (data.status === 'error') {
      throw new Error(data.message || 'Twelve Data error');
    }

    const values = data.values as Array<Record<string, string>>;
    const candles: Candle[] = values.map((v) => ({
      timestamp: new Date(v.datetime).getTime(),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume || '0'),
    }));

    candles.sort((a, b) => a.timestamp - b.timestamp);
    return candles;
  }

  async fetchPrice(pair: TradingPair, apiKey: string): Promise<number> {
    this.checkDate();
    if (this.isQuotaExceeded) {
      throw new Error(`Twelve Data quota exceeded: ${this.dailyCount}/${TWELVE_DATA_DAILY_LIMIT}`);
    }

    const symbol = PAIR_CONFIG[pair].apiSymbol;
    const url = `${TWELVE_DATA_BASE_URL}/price?symbol=${symbol}&apikey=${apiKey}`;

    const res = await fetch(url);
    this.incrementCount();

    const data = await res.json();
    if (data.status === 'error') {
      throw new Error(data.message || 'Twelve Data error');
    }
    return parseFloat(data.price);
  }

  async fetchApiUsage(apiKey: string): Promise<ApiUsage> {
    const url = `${TWELVE_DATA_BASE_URL}/api_usage?apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const usage = data.usage ?? 0;
    this.setCount(usage);
    return { usage, limit: TWELVE_DATA_DAILY_LIMIT };
  }
}

export const twelveDataApi = new TwelveDataApi();
