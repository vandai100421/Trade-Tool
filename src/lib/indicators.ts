import { Candle } from '@/types';
import {
  MACD_FAST,
  MACD_SIGNAL,
  MACD_SLOW,
} from './constants';

export function sma(values: number[], period: number): number[] {
  const result = new Array(values.length).fill(NaN);
  if (values.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    result[i] = sum / period;
  }
  return result;
}

export function ema(values: number[], period: number): number[] {
  const result = new Array(values.length).fill(NaN);
  if (values.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result[period - 1] = sum / period;

  const alpha = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * alpha + result[i - 1] * (1 - alpha);
  }
  return result;
}

export function rsi(candles: Candle[], period: number): number[] {
  const result = new Array(candles.length).fill(NaN);
  if (candles.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

export interface MacdResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export function macd(
  candles: Candle[],
  fast: number = MACD_FAST,
  slow: number = MACD_SLOW,
  signal: number = MACD_SIGNAL,
): MacdResult {
  const closes = candles.map((c) => c.close);
  const fastEma = ema(closes, fast);
  const slowEma = ema(closes, slow);

  const macdLine = new Array(candles.length).fill(NaN);
  for (let i = 0; i < candles.length; i++) {
    if (!isNaN(fastEma[i]) && !isNaN(slowEma[i])) {
      macdLine[i] = fastEma[i] - slowEma[i];
    }
  }

  const firstValid = macdLine.findIndex((v) => !isNaN(v));
  const signalLine = new Array(candles.length).fill(NaN);

  if (firstValid >= 0) {
    const validMacd = macdLine.slice(firstValid).filter((v) => !isNaN(v));
    if (validMacd.length >= signal) {
      const signalEma = ema(validMacd, signal);
      for (let i = 0; i < signalEma.length; i++) {
        if (!isNaN(signalEma[i])) {
          signalLine[firstValid + i] = signalEma[i];
        }
      }
    }
  }

  const histogram = new Array(candles.length).fill(NaN);
  for (let i = 0; i < candles.length; i++) {
    if (!isNaN(macdLine[i]) && !isNaN(signalLine[i])) {
      histogram[i] = macdLine[i] - signalLine[i];
    }
  }

  return { macdLine, signalLine, histogram };
}

export interface AdxResult {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
}

export function adx(candles: Candle[], period: number): AdxResult {
  const nan = new Array(candles.length).fill(NaN);
  if (candles.length < period * 2 + 1) {
    return { adx: nan, plusDI: nan, minusDI: nan };
  }

  const plusDM = new Array(candles.length).fill(0);
  const minusDM = new Array(candles.length).fill(0);
  const tr = new Array(candles.length).fill(0);

  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;

    tr[i] = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close),
    );
  }

  const plusDIResult = new Array(candles.length).fill(NaN);
  const minusDIResult = new Array(candles.length).fill(NaN);
  const dxValues: number[] = [];

  let smoothTR = 0;
  let smoothPlusDM = 0;
  let smoothMinusDM = 0;

  for (let i = 1; i <= period; i++) {
    smoothTR += tr[i];
    smoothPlusDM += plusDM[i];
    smoothMinusDM += minusDM[i];
  }

  let pDI = smoothTR === 0 ? 0 : (100 * smoothPlusDM) / smoothTR;
  let mDI = smoothTR === 0 ? 0 : (100 * smoothMinusDM) / smoothTR;
  let dx = pDI + mDI === 0 ? 0 : (100 * Math.abs(pDI - mDI)) / (pDI + mDI);

  plusDIResult[period] = pDI;
  minusDIResult[period] = mDI;
  dxValues.push(dx);

  for (let i = period + 1; i < candles.length; i++) {
    smoothTR = smoothTR - smoothTR / period + tr[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];

    pDI = smoothTR === 0 ? 0 : (100 * smoothPlusDM) / smoothTR;
    mDI = smoothTR === 0 ? 0 : (100 * smoothMinusDM) / smoothTR;
    dx = pDI + mDI === 0 ? 0 : (100 * Math.abs(pDI - mDI)) / (pDI + mDI);

    plusDIResult[i] = pDI;
    minusDIResult[i] = mDI;
    dxValues.push(dx);
  }

  const adxResult = new Array(candles.length).fill(NaN);

  if (dxValues.length >= period) {
    let adxVal = 0;
    for (let i = 0; i < period; i++) adxVal += dxValues[i];
    adxVal /= period;
    adxResult[2 * period - 1] = adxVal;

    for (let i = period; i < dxValues.length; i++) {
      adxVal = (adxVal * (period - 1) + dxValues[i]) / period;
      adxResult[period + i] = adxVal;
    }
  }

  return { adx: adxResult, plusDI: plusDIResult, minusDI: minusDIResult };
}

export function atr(candles: Candle[], period: number): number[] {
  const result = new Array(candles.length).fill(NaN);
  if (candles.length < period + 1) return result;

  const trValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    trValues.push(
      Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close),
      ),
    );
  }

  if (trValues.length < period) return result;

  let atrVal = 0;
  for (let i = 0; i < period; i++) atrVal += trValues[i];
  atrVal /= period;
  result[period] = atrVal;

  for (let i = period; i < trValues.length; i++) {
    atrVal = (atrVal * (period - 1) + trValues[i]) / period;
    result[i + 1] = atrVal;
  }
  return result;
}

export function volumeSma(candles: Candle[], period: number): number[] {
  const volumes = candles.map((c) => c.volume);
  return sma(volumes, period);
}

export function lastValid(values: number[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    if (!isNaN(values[i])) return values[i];
  }
  return null;
}
