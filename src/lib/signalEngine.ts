import { Candle, ConditionResult, Signal, SignalDirection, SignalQuality, TradingPair, TrendAnalysis, TrendDirection, TrendMatrix, TrendStrength } from '@/types';
import {
  ADX_PERIOD,
  ADX_STRONG_TREND,
  ATR_PERIOD,
  EMA_LONG_PERIOD,
  EMA_MICRO_PERIOD,
  EMA_SHORT_PERIOD,
  MACD_FAST,
  MACD_SIGNAL,
  MACD_SLOW,
  MIN_CANDLES_FOR_SIGNAL,
  PAIR_CONFIG,
  RSI_BUY_MAX,
  RSI_BUY_MIN,
  RSI_OVERBOUGHT,
  RSI_OVERSOLD,
  RSI_PERIOD,
  RSI_SELL_MAX,
  RSI_SELL_MIN,
  STOP_LOSS_MULTIPLIER,
  TAKE_PROFIT_MULTIPLIER,
  VOLUME_AVG_PERIOD,
} from './constants';
import { adx, atr, ema, lastValid, macd, rsi, volumeSma } from './indicators';
import { round } from './utils';

export function computeSignal(
  pair: TradingPair,
  candles15m: Candle[],
  candles1H: Candle[],
  candles4H: Candle[],
  candles1D: Candle[] = [],
): Signal {
  if (candles15m.length < MIN_CANDLES_FOR_SIGNAL) {
    return insufficientData(pair, candles15m);
  }

  const closes = candles15m.map((c) => c.close);
  const lastCandle = candles15m[candles15m.length - 1];

  const ema20List = ema(closes, EMA_SHORT_PERIOD);
  const ema50List = ema(closes, EMA_LONG_PERIOD);
  const rsiList = rsi(candles15m, RSI_PERIOD);
  const macdResult = macd(candles15m, MACD_FAST, MACD_SLOW, MACD_SIGNAL);
  const adxResult = adx(candles15m, ADX_PERIOD);
  const volSmaList = volumeSma(candles15m, VOLUME_AVG_PERIOD);
  const atrList = atr(candles15m, ATR_PERIOD);

  const ema20 = lastValid(ema20List) ?? 0;
  const ema50 = lastValid(ema50List) ?? 0;
  const rsiVal = lastValid(rsiList) ?? 50;
  const macdHist = lastValid(macdResult.histogram) ?? 0;
  const adxVal = lastValid(adxResult.adx) ?? 0;
  const volAvg = lastValid(volSmaList) ?? 0;
  const atrVal = lastValid(atrList) ?? 0;

  const isBuy = ema20 > ema50;
  const isSell = ema20 < ema50;

  const mtf1H = checkMtf(candles1H, isBuy);
  const mtf4H = checkMtf(candles4H, isBuy);
  const mtfOk = mtf1H && mtf4H;

  const conditions: ConditionResult[] = [
    checkTrend(ema20, ema50),
    checkRsi(rsiVal, isBuy),
    checkMacd(macdHist, isBuy),
    checkVolume(lastCandle.volume, volAvg, pair),
    checkPriceVsEma(lastCandle.close, ema20, isBuy),
  ];

  const passedCount = conditions.filter((c) => c.passed).length;
  const adxStrong = adxVal > ADX_STRONG_TREND;

  let direction: SignalDirection;
  let quality: SignalQuality;

  if (passedCount === 5 && mtfOk) {
    direction = isBuy ? SignalDirection.Buy : SignalDirection.Sell;
    quality = adxStrong ? SignalQuality.Beautiful : SignalQuality.Strong;
  } else if (passedCount >= 4 && mtfOk) {
    direction = isBuy ? SignalDirection.Buy : SignalDirection.Sell;
    quality = SignalQuality.Normal;
  } else {
    direction = SignalDirection.Wait;
    quality = SignalQuality.None;
  }

  let stopLoss: number | undefined;
  let takeProfit: number | undefined;

  if (direction !== SignalDirection.Wait && atrVal > 0) {
    if (direction === SignalDirection.Buy) {
      stopLoss = lastCandle.close - STOP_LOSS_MULTIPLIER * atrVal;
      takeProfit = lastCandle.close + TAKE_PROFIT_MULTIPLIER * atrVal;
    } else {
      stopLoss = lastCandle.close + STOP_LOSS_MULTIPLIER * atrVal;
      takeProfit = lastCandle.close - TAKE_PROFIT_MULTIPLIER * atrVal;
    }
  }

  const trendMatrix = computeTrendMatrix(candles15m, candles1H, candles1D);

  return {
    pair,
    direction,
    quality,
    conditions,
    adx: round(adxVal),
    mtf1H,
    mtf4H,
    price: lastCandle.close,
    timestamp: new Date().toISOString(),
    ema20: round(ema20),
    ema50: round(ema50),
    rsi: round(rsiVal),
    macdHistogram: round(macdHist),
    atr: round(atrVal),
    stopLoss: stopLoss != null ? round(stopLoss) : undefined,
    takeProfit: takeProfit != null ? round(takeProfit) : undefined,
    trendMatrix,
  };
}

function checkMtf(htfCandles: Candle[], isBuy: boolean): boolean {
  if (htfCandles.length < EMA_LONG_PERIOD + 1) return false;

  const closes = htfCandles.map((c) => c.close);
  const ema20 = lastValid(ema(closes, EMA_SHORT_PERIOD));
  const ema50 = lastValid(ema(closes, EMA_LONG_PERIOD));

  if (ema20 == null || ema50 == null) return false;
  return isBuy ? ema20 > ema50 : ema20 < ema50;
}

function checkTrend(ema20: number, ema50: number): ConditionResult {
  const passed = ema20 > ema50;
  return {
    index: 1,
    name: 'EMA Trend',
    passed,
    detail: `EMA20(${ema20.toFixed(2)}) ${passed ? '>' : '<='} EMA50(${ema50.toFixed(2)})`,
  };
}

function checkRsi(rsiVal: number, isBuy: boolean): ConditionResult {
  const passed = isBuy
    ? rsiVal >= RSI_BUY_MIN && rsiVal <= RSI_BUY_MAX
    : rsiVal >= RSI_SELL_MIN && rsiVal <= RSI_SELL_MAX;

  const zone =
    rsiVal > RSI_OVERBOUGHT
      ? 'Overbought'
      : rsiVal < RSI_OVERSOLD
        ? 'Oversold'
        : 'an toan';

  return {
    index: 2,
    name: 'RSI',
    passed,
    detail: `RSI: ${rsiVal.toFixed(2)} (${zone})`,
  };
}

function checkMacd(histogram: number, isBuy: boolean): ConditionResult {
  const passed = isBuy ? histogram > 0 : histogram < 0;
  return {
    index: 3,
    name: 'MACD',
    passed,
    detail: `Histogram: ${histogram.toFixed(2)} (${passed ? 'cung chieu' : 'nguoc chieu'})`,
  };
}

function checkVolume(volume: number, volAvg: number, pair: TradingPair): ConditionResult {
  const config = PAIR_CONFIG[pair];
  if (!config.hasVolume) {
    return {
      index: 4,
      name: 'Volume',
      passed: true,
      detail: 'N/A (khong co volume)',
    };
  }

  const passed = volume > volAvg;
  return {
    index: 4,
    name: 'Volume',
    passed,
    detail: `Vol: ${volume.toFixed(2)} ${passed ? '>' : '<='} Avg(${volAvg.toFixed(2)})`,
  };
}

function checkPriceVsEma(close: number, ema20: number, isBuy: boolean): ConditionResult {
  const passed = isBuy ? close > ema20 : close < ema20;
  return {
    index: 5,
    name: 'Price vs EMA20',
    passed,
    detail: `Close(${close.toFixed(2)}) ${passed ? '>' : '<='} EMA20(${ema20.toFixed(2)})`,
  };
}

function insufficientData(pair: TradingPair, candles: Candle[]): Signal {
  return {
    pair,
    direction: SignalDirection.Wait,
    quality: SignalQuality.None,
    conditions: [],
    adx: 0,
    mtf1H: false,
    mtf4H: false,
    price: candles.length > 0 ? candles[candles.length - 1].close : 0,
    timestamp: new Date().toISOString(),
    ema20: 0,
    ema50: 0,
    rsi: 0,
    macdHistogram: 0,
    atr: 0,
    trendMatrix: undefined,
  };
}

function computeTrendMatrix(
  candles15m: Candle[],
  candles1H: Candle[],
  candles1D: Candle[],
): TrendMatrix {
  return {
    shortTerm: computeTrendAnalysis(candles15m, EMA_MICRO_PERIOD, EMA_SHORT_PERIOD),
    mediumTerm: computeTrendAnalysis(candles1H, EMA_SHORT_PERIOD, EMA_LONG_PERIOD),
    longTerm: computeTrendAnalysis(candles1D, EMA_SHORT_PERIOD, EMA_LONG_PERIOD),
  };
}

function computeTrendAnalysis(
  candles: Candle[],
  fastPeriod: number,
  slowPeriod: number,
): TrendAnalysis {
  if (candles.length < slowPeriod + 1) {
    return {
      direction: TrendDirection.Neutral,
      strength: TrendStrength.Weak,
      adx: 0,
      emaGapPercent: 0,
      priceVsEmaPercent: 0,
      label: 'Không đủ dữ liệu',
    };
  }

  const closes = candles.map((c) => c.close);
  const lastCandle = candles[candles.length - 1];
  const price = lastCandle.close;

  const fastEmaList = ema(closes, fastPeriod);
  const slowEmaList = ema(closes, slowPeriod);
  const fastEma = lastValid(fastEmaList) ?? 0;
  const slowEma = lastValid(slowEmaList) ?? 0;

  const adxResult = adx(candles, ADX_PERIOD);
  const adxVal = lastValid(adxResult.adx) ?? 0;

  let direction: TrendDirection;
  if (fastEma > slowEma) direction = TrendDirection.Bullish;
  else if (fastEma < slowEma) direction = TrendDirection.Bearish;
  else direction = TrendDirection.Neutral;

  const strength = getTrendStrength(adxVal);

  const emaGapPercent = slowEma !== 0
    ? ((fastEma - slowEma) / slowEma) * 100
    : 0;

  const priceVsEmaPercent = fastEma !== 0
    ? ((price - fastEma) / fastEma) * 100
    : 0;

  const label = buildTrendLabel(direction, strength, priceVsEmaPercent);

  return {
    direction,
    strength,
    adx: round(adxVal),
    emaGapPercent: round(emaGapPercent, 2),
    priceVsEmaPercent: round(priceVsEmaPercent, 2),
    label,
  };
}

function getTrendStrength(adxVal: number): TrendStrength {
  if (adxVal > 50) return TrendStrength.VeryStrong;
  if (adxVal > 30) return TrendStrength.Strong;
  if (adxVal > 20) return TrendStrength.Forming;
  return TrendStrength.Weak;
}

function buildTrendLabel(
  direction: TrendDirection,
  strength: TrendStrength,
  priceVsEmaPercent: number,
): string {
  const dirText = direction === TrendDirection.Bullish
    ? 'Uptrend'
    : direction === TrendDirection.Bearish
      ? 'Downtrend'
      : 'Sideways';

  const strengthText = strength === TrendStrength.VeryStrong
    ? 'rất mạnh'
    : strength === TrendStrength.Strong
      ? 'mạnh'
      : strength === TrendStrength.Forming
        ? 'đang hình thành'
        : 'yếu';

  const overextended = Math.abs(priceVsEmaPercent) > 2;
  const overextText = overextended
    ? `, giá ${priceVsEmaPercent > 0 ? 'overextended +' : 'overextended '}${priceVsEmaPercent.toFixed(1)}%`
    : '';

  return `${dirText} ${strengthText}${overextText}`;
}
