export enum TradingPair {
  BtcUsdt = 'btcUsdt',
  XauUsd = 'xauUsd',
  EurUsd = 'eurUsd',
}

export enum DataSource {
  Binance = 'binance',
  TwelveData = 'twelveData',
}

export enum Timeframe {
  M15 = 'm15',
  H1 = 'h1',
  H4 = 'h4',
  D1 = 'd1',
}

export enum TrendDirection {
  Bullish = 'bullish',
  Bearish = 'bearish',
  Neutral = 'neutral',
}

export enum TrendStrength {
  Weak = 'weak',
  Forming = 'forming',
  Strong = 'strong',
  VeryStrong = 'veryStrong',
}

export enum SignalDirection {
  Buy = 'buy',
  Sell = 'sell',
  Wait = 'wait',
}

export enum SignalQuality {
  Beautiful = 'beautiful',
  Strong = 'strong',
  Normal = 'normal',
  None = 'none',
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ConditionResult {
  index: number;
  name: string;
  passed: boolean;
  detail: string;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  strength: TrendStrength;
  adx: number;
  emaGapPercent: number;
  priceVsEmaPercent: number;
  label: string;
}

export interface TrendMatrix {
  shortTerm: TrendAnalysis;
  mediumTerm: TrendAnalysis;
  longTerm: TrendAnalysis;
}

export interface Signal {
  pair: TradingPair;
  direction: SignalDirection;
  quality: SignalQuality;
  conditions: ConditionResult[];
  adx: number;
  mtf1H: boolean;
  mtf4H: boolean;
  price: number;
  timestamp: string;
  ema20: number;
  ema50: number;
  rsi: number;
  macdHistogram: number;
  atr: number;
  stopLoss?: number;
  takeProfit?: number;
  trendMatrix?: TrendMatrix;
}

export interface ApiUsage {
  usage: number;
  limit: number;
}

export interface Settings {
  twelveDataKey: string;
  emailTo: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
}
