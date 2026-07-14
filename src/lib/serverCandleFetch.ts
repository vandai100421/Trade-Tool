import { Candle, DataSource, Timeframe, TradingPair } from '@/types';
import {
  CANDLE_COUNT,
  PAIR_CONFIG,
  TIMEFRAME_CONFIG,
  TWELVE_DATA_BASE_URL,
} from './constants';
import { fetchBinanceKlines } from './binanceApi';
import { getCachedCandles, setCachedCandles } from './serverStorage';

const CACHE_TTL_H1 = 3600;
const CACHE_TTL_H4 = 4 * 3600;

export async function fetchCandlesForSignal(
  pair: TradingPair,
  twelveDataApiKey: string,
): Promise<{ c15m: Candle[]; c1H: Candle[]; c4H: Candle[] }> {
  const c15m = await fetchFresh(pair, Timeframe.M15, twelveDataApiKey);

  let c1H = await getCachedCandles(pair, Timeframe.H1);
  if (!c1H) {
    c1H = await fetchFresh(pair, Timeframe.H1, twelveDataApiKey);
    await setCachedCandles(pair, Timeframe.H1, c1H, CACHE_TTL_H1);
  }

  let c4H = await getCachedCandles(pair, Timeframe.H4);
  if (!c4H) {
    c4H = await fetchFresh(pair, Timeframe.H4, twelveDataApiKey);
    await setCachedCandles(pair, Timeframe.H4, c4H, CACHE_TTL_H4);
  }

  return { c15m, c1H, c4H };
}

async function fetchFresh(
  pair: TradingPair,
  tf: Timeframe,
  twelveDataApiKey: string,
): Promise<Candle[]> {
  const config = PAIR_CONFIG[pair];

  if (config.source === DataSource.Binance) {
    return fetchBinanceKlines(config.apiSymbol, TIMEFRAME_CONFIG[tf].binanceInterval, CANDLE_COUNT);
  }

  if (!twelveDataApiKey) {
    throw new Error(`Twelve Data API key required for ${config.displayName}`);
  }

  return fetchTwelveData(pair, tf, twelveDataApiKey);
}

async function fetchTwelveData(
  pair: TradingPair,
  tf: Timeframe,
  apiKey: string,
): Promise<Candle[]> {
  const symbol = PAIR_CONFIG[pair].apiSymbol;
  const interval = TIMEFRAME_CONFIG[tf].twelveDataInterval;
  const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${CANDLE_COUNT}&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status === 'error') {
    throw new Error(data.message || 'Twelve Data error');
  }

  const values = data.values as Array<Record<string, string>>;
  if (!values) return [];

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
