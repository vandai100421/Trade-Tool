import { TradingPair, DataSource, Timeframe } from '@/types';

interface PairConfig {
  displayName: string;
  apiSymbol: string;
  name: string;
  source: DataSource;
  hasVolume: boolean;
}

export const PAIR_CONFIG: Record<TradingPair, PairConfig> = {
  [TradingPair.BtcUsdt]: {
    displayName: 'BTC/USDT',
    apiSymbol: 'BTCUSDT',
    name: 'Bitcoin',
    source: DataSource.Binance,
    hasVolume: true,
  },
  [TradingPair.XauUsd]: {
    displayName: 'XAU/USD',
    apiSymbol: 'XAU/USD',
    name: 'Gold',
    source: DataSource.TwelveData,
    hasVolume: false,
  },
  [TradingPair.EurUsd]: {
    displayName: 'EUR/USD',
    apiSymbol: 'EUR/USD',
    name: 'Euro',
    source: DataSource.TwelveData,
    hasVolume: false,
  },
};

interface TimeframeConfig {
  displayName: string;
  binanceInterval: string;
  twelveDataInterval: string;
  seconds: number;
}

export const TIMEFRAME_CONFIG: Record<Timeframe, TimeframeConfig> = {
  [Timeframe.M15]: {
    displayName: '15m',
    binanceInterval: '15m',
    twelveDataInterval: '15min',
    seconds: 15 * 60,
  },
  [Timeframe.H1]: {
    displayName: '1H',
    binanceInterval: '1h',
    twelveDataInterval: '1h',
    seconds: 60 * 60,
  },
  [Timeframe.H4]: {
    displayName: '4H',
    binanceInterval: '4h',
    twelveDataInterval: '4h',
    seconds: 4 * 60 * 60,
  },
  [Timeframe.D1]: {
    displayName: '1D',
    binanceInterval: '1d',
    twelveDataInterval: '1day',
    seconds: 24 * 60 * 60,
  },
};

export const ALL_PAIRS = Object.values(TradingPair);
export const ALL_TIMEFRAMES = Object.values(Timeframe);

export const APP_NAME = 'Trading Signals';

export const BINANCE_BASE_URL = 'https://api.binance.com';
export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
export const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

export const CANDLE_COUNT = 200;

export const POLL_INTERVAL_M15 = 30_000;
export const POLL_INTERVAL_H1 = 300_000;
export const POLL_INTERVAL_H4 = 900_000;
export const POLL_INTERVAL_D1 = 1_800_000;

export const TWELVE_DATA_DAILY_LIMIT = 800;
export const TWELVE_DATA_WARNING_THRESHOLD = 750;

export const SIGNAL_COOLDOWN_MS = 15 * 60 * 1000;

export const ADX_STRONG_TREND = 30;
export const RSI_OVERBOUGHT = 70;
export const RSI_OVERSOLD = 30;
export const RSI_BUY_MIN = 40;
export const RSI_BUY_MAX = 70;
export const RSI_SELL_MIN = 30;
export const RSI_SELL_MAX = 60;

export const EMA_SHORT_PERIOD = 20;
export const EMA_LONG_PERIOD = 50;
export const EMA_MICRO_PERIOD = 9;
export const RSI_PERIOD = 14;
export const MACD_FAST = 12;
export const MACD_SLOW = 26;
export const MACD_SIGNAL = 9;
export const ADX_PERIOD = 14;
export const VOLUME_AVG_PERIOD = 20;
export const ATR_PERIOD = 14;

export const STOP_LOSS_MULTIPLIER = 1.5;
export const TAKE_PROFIT_MULTIPLIER = 3.0;

export const STORAGE_KEYS = {
  settings: 'ts_settings',
  signals: 'ts_signals',
  quota: 'ts_quota',
} as const;

export const MIN_CANDLES_FOR_SIGNAL = 60;
