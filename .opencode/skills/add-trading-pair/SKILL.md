---
name: add-trading-pair
description: Use when adding a new trading pair (e.g. SOL/USDT, GBP/USD, ETH/USDT) to the app. Triggers on phrases like "add pair", "thêm cặp", "new trading pair", or when editing the TradingPair enum in src/types/index.ts or src/lib/constants.ts.
---

# Add Trading Pair Skill

Workflow for adding a new trading pair to the Trading Signals web app.

## Steps

### 1. Determine data source

Identify which API provides data for the new pair:

- **Binance** (crypto pairs like ETH/USDT, SOL/USDT, BNB/USDT): WebSocket realtime + REST history, no API key needed.
- **Twelve Data** (forex/commodities like GBP/USD, USD/JPY, GBP/JPY): REST polling, requires API key, counts against 800 req/day quota.

### 2. Add to TradingPair enum

Edit `src/types/index.ts`:

```typescript
export enum TradingPair {
  BtcUsdt = 'btcUsdt',
  XauUsd = 'xauUsd',
  EurUsd = 'eurUsd',
  EthUsdt = 'ethUsdt',  // Add new pair here
}
```

### 3. Add pair config

Edit `src/lib/constants.ts`, add entry to `PAIR_CONFIG`:

```typescript
[TradingPair.EthUsdt]: {
  displayName: 'ETH/USDT',
  apiSymbol: 'ETHUSDT',
  name: 'Ethereum',
  source: DataSource.Binance,
  hasVolume: true,
},
```

Fields: `displayName` (UI label), `apiSymbol` (API query symbol), `name` (full name), `source` (binance or twelveData), `hasVolume` (false for Twelve Data forex).

### 4. Verify API symbol

- **Binance**: Check `https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT` returns valid response.
- **Twelve Data**: Check `https://api.twelvedata.com/price?symbol=ETH/USD&apikey=...` returns valid response.

### 5. UI auto-updates

The following update automatically from the enum — NO manual changes needed:
- `PairTabs` component (iterates `Object.values(TradingPair)`).
- `marketStore.watchPair()` (accepts any `TradingPair`).
- Signal computation (uses `PAIR_CONFIG[pair]`).

Just verify the tab appears and data loads.

### 6. Update docs

Update `docs/01_PRD.md` section 3 (Cặp giao dịch & Nguồn dữ liệu) table to include the new pair.

Update `docs/03_API_SPECS.md` mapping tables if a new API source is introduced.

### 7. Test

- `npm run dev` → open browser → verify new tab appears.
- Select the new tab → verify candles load.
- Verify signal computes (check signal card shows 5 conditions).
- If Twelve Data: verify quota counter increments.

### 8. Quota consideration

If adding multiple Twelve Data pairs, recalculate daily API usage:
- Each pair × 3 timeframes × polling intervals.
- Free plan = 800 req/day.
- If exceeded, consider upgrading plan or reducing polling frequency in `src/lib/constants.ts` (`POLL_INTERVAL_*`).
