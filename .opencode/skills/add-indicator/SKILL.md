---
name: add-indicator
description: Use when adding a new technical indicator (EMA, RSI, MACD, ADX, ATR, Bollinger, Stochastic, etc.) to the domain layer. Triggers on phrases like "add indicator", "thêm indicator", "new indicator", or when editing src/lib/indicators.ts.
---

# Add Indicator Skill

Workflow for adding a new technical indicator to the Trading Signals web app.

## Steps

### 1. Read existing indicators file

Read `src/lib/indicators.ts` to understand:
- Existing patterns (exported functions, return types, NaN handling)
- How `lastValid()` helper works
- Naming conventions (`ema`, `rsi`, `macd`, `adx`, `atr`)

### 2. Implement the indicator

Add a new exported function following these rules:

- Signature: `export function indicatorName(candles: Candle[], period: number): number[]` or return an interface for multi-value indicators (like `MacdResult`, `AdxResult`).
- Return `new Array(candles.length).fill(NaN)` if not enough data.
- Use Wilder's smoothing for RSI/ADX-style indicators.
- No external dependencies — pure TypeScript only.
- Do NOT add comments unless the formula is non-obvious.

Example pattern:
```typescript
export function bollingerBands(candles: Candle[], period: number, multiplier: number = 2): BollingerResult {
  if (candles.length < period) {
    return { upper: new Array(candles.length).fill(NaN), middle: ..., lower: ... };
  }
  // ... implementation
}
```

### 3. Add constants

If the indicator has configurable params, add them to `src/lib/constants.ts`:

```typescript
export const BOLLINGER_PERIOD = 20;
export const BOLLINGER_MULTIPLIER = 2.0;
```

### 4. Integrate into Signal Engine (if needed)

If the indicator is part of signal conditions, edit `src/lib/signalEngine.ts`:

- Call the indicator in `computeSignal()`.
- Add a new `ConditionResult` to the `conditions` array.
- Update the `passedCount` logic if the condition count changes (currently 5).
- If condition count changes beyond 5, update docs `05_SIGNAL_ENGINE.md`.

### 5. Display in UI (if needed)

If the indicator should show on chart or signal card:
- **Chart**: Add a `LineSeries` in `src/components/CandlestickChart.tsx`.
- **Signal card**: Add a row in `src/components/SignalCard.tsx` condition list.
- Add color to `tailwind.config.ts` if needed.

### 6. Update docs

Update `docs/04_INDICATORS.md` with:
- Formula
- Parameters
- How it's used in signal engine (if applicable)
- Edge cases

### 7. Verify

- Run `npm run typecheck` to check TypeScript.
- Run `npm run lint` to check ESLint.
- Check for unused imports.
- Ensure no circular dependencies (domain must not import stores/components).
