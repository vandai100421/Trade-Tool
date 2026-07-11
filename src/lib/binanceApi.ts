import { Candle, Timeframe, TradingPair } from '@/types';
import { BINANCE_BASE_URL, BINANCE_WS_URL, CANDLE_COUNT, PAIR_CONFIG, TIMEFRAME_CONFIG } from './constants';

export async function fetchBinanceKlines(
  symbol: string,
  interval: string,
  limit: number = CANDLE_COUNT,
): Promise<Candle[]> {
  const url = `${BINANCE_BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);

  const data: unknown[][] = await res.json();
  return data.map((raw) => ({
    timestamp: raw[0] as number,
    open: parseFloat(raw[1] as string),
    high: parseFloat(raw[2] as string),
    low: parseFloat(raw[3] as string),
    close: parseFloat(raw[4] as string),
    volume: parseFloat(raw[5] as string),
  }));
}

export async function fetchBinancePrice(symbol: string): Promise<number> {
  const url = `${BINANCE_BASE_URL}/api/v3/ticker/price?symbol=${symbol}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance price error: ${res.status}`);
  const data = await res.json();
  return parseFloat(data.price);
}

interface BinanceKlineMessage {
  k: {
    t: number;
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    x: boolean;
  };
}

export function subscribeBinanceKline(
  pair: TradingPair,
  timeframe: Timeframe,
  onUpdate: (candle: Candle, isClosed: boolean) => void,
  onError?: (error: Event) => void,
): WebSocket {
  const symbol = PAIR_CONFIG[pair].apiSymbol.toLowerCase();
  const interval = TIMEFRAME_CONFIG[timeframe].binanceInterval;
  const stream = `${symbol}@kline_${interval}`;
  const wsUrl = `${BINANCE_WS_URL}/${stream}`;

  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const msg: BinanceKlineMessage = JSON.parse(event.data);
      const k = msg.k;
      const candle: Candle = {
        timestamp: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      };
      onUpdate(candle, k.x);
    } catch {
      // ignore parse errors
    }
  };

  ws.onerror = (error) => {
    onError?.(error);
  };

  return ws;
}
