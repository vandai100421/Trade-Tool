---
name: test-signal-engine
description: Use when writing unit tests for the signal engine or indicators (EMA, RSI, MACD, ADX). Triggers on phrases like "test signal", "viết test", "unit test indicator", "test signal engine", or when creating files in test/ or __tests__/.
---

# Test Signal Engine Skill

Workflow for writing unit tests for the domain layer (indicators + signal engine).

## Steps

### 1. Install test dependencies (if not installed)

```bash
npm install -D vitest @testing-library/react
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
  },
});
```

### 2. Create test directory structure

```
test/
├── helpers/
│   └── candleData.ts         # Reusable candle generators
├── indicators.test.ts        # Indicator unit tests
└── signalEngine.test.ts      # Signal engine integration tests
```

### 3. Candle test data helpers

Create `test/helpers/candleData.ts`:

```typescript
import { Candle } from '@/types';

export function generateUptrendCandles(count: number = 100, startPrice: number = 100): Candle[] {
  // Generates candles with steady uptrend (EMA20 > EMA50, RSI ~55-65)
}

export function generateDowntrendCandles(count: number = 100, startPrice: number = 100): Candle[] {
  // Generates candles with steady downtrend (EMA20 < EMA50, RSI ~35-45)
}

export function generateSidewaysCandles(count: number = 100, basePrice: number = 100): Candle[] {
  // Generates candles with no clear trend (ADX < 20)
}
```

### 4. Indicator tests

Test each indicator in `test/indicators.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { ema, rsi, macd, adx } from '@/lib/indicators';
import { generateUptrendCandles } from './helpers/candleData';

describe('EMA', () => {
  test('returns NaN for insufficient data', () => {
    const candles = generateUptrendCandles(10);
    const result = ema(candles.map(c => c.close), 20);
    expect(result.every(v => isNaN(v))).toBe(true);
  });

  test('seed value equals SMA for first valid point', () => {
    const candles = generateUptrendCandles(30);
    const closes = candles.map(c => c.close);
    const emaResult = ema(closes, 20);
    // ... verify seed = SMA
  });
});

describe('RSI', () => {
  test('returns 100 when all gains, no losses', () => { ... });
  test('returns 0 when all losses, no gains', () => { ... });
  test('returns ~50 for sideways market', () => { ... });
});

describe('MACD', () => {
  test('histogram positive in uptrend', () => { ... });
  test('histogram negative in downtrend', () => { ... });
});

describe('ADX', () => {
  test('above 30 in strong trend', () => { ... });
  test('below 20 in sideways market', () => { ... });
});
```

### 5. Signal engine tests

Test `src/lib/signalEngine.ts` in `test/signalEngine.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { computeSignal } from '@/lib/signalEngine';
import { TradingPair, SignalDirection, SignalQuality } from '@/types';
import { generateUptrendCandles, generateDowntrendCandles } from './helpers/candleData';

describe('computeSignal', () => {
  test('returns BUY for perfect uptrend with MTF confirmation', () => {
    const signal = computeSignal(
      TradingPair.BtcUsdt,
      generateUptrendCandles(100),
      generateUptrendCandles(100),
      generateUptrendCandles(100),
    );
    expect(signal.direction).toBe(SignalDirection.Buy);
    expect(signal.conditions.filter(c => c.passed).length).toBe(5);
    expect(signal.mtf1H).toBe(true);
    expect(signal.mtf4H).toBe(true);
  });

  test('returns WAIT when MTF disagrees', () => {
    const signal = computeSignal(
      TradingPair.BtcUsdt,
      generateUptrendCandles(100),
      generateUptrendCandles(100),
      generateDowntrendCandles(100), // 4H conflict
    );
    expect(signal.direction).toBe(SignalDirection.Wait);
  });

  test('quality is beautiful when ADX > 30', () => { ... });
  test('XAU/USD auto-passes volume condition', () => { ... });
  test('returns insufficient data for < 60 candles', () => { ... });
});
```

### 6. Run tests

```bash
npm test
npm test -- --coverage
```

### 7. Edge cases to always cover

- Insufficient data (< period)
- All-zero values
- Division by zero (avgLoss = 0 in RSI)
- Empty candle array
- Single candle
- Exactly `period` candles (boundary)
- NaN propagation
