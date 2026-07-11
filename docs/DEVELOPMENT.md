# Hướng dẫn phát triển (Developer Guide)

## Kiến trúc tổng quan

```
Browser (Client)
├── React UI (Ant Design)
│   └── Components → Stores (Zustand) → Lib (domain + API)
│                                   │
│                    ┌──────────────┼──────────────┐
│                    ▼              ▼              ▼
│              Binance WS    Twelve Data      localStorage
│              (BTC realtime) (XAU/EUR poll)  (settings, cache)
│
Next.js API Route (Server)
└── /api/email → Resend API (key ẩn trong .env)
```

**Nguyên tắc cốt lõi:** Domain layer (`indicators.ts`, `signalEngine.ts`) là pure TypeScript — không import React, không import store, không import browser API. Có thể test độc lập.

## Cấu trúc thư mục

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout + AntdThemeProvider
│   ├── page.tsx                  # Home page
│   ├── globals.css               # Global styles (minimal)
│   ├── settings/
│   │   └── page.tsx              # Settings page
│   └── api/email/
│       └── route.ts              # Resend proxy (server-side)
├── components/                   # React components
│   ├── AntdThemeProvider.tsx     # ConfigProvider dark theme
│   ├── SignalCard.tsx            # Signal + conditions + SL/TP
│   ├── CandlestickChart.tsx      # lightweight-charts wrapper
│   ├── PairTabs.tsx              # Tab selector
│   ├── TrendMatrixTable.tsx      # 3-layer trend analysis
│   └── ApiUsageBar.tsx           # Quota progress bar
├── lib/                          # Business logic
│   ├── constants.ts              # Enums, configs, thresholds
│   ├── indicators.ts             # EMA, RSI, MACD, ADX, ATR
│   ├── signalEngine.ts           # 5 conditions + MTF + trend matrix
│   ├── binanceApi.ts             # Binance REST + WebSocket
│   ├── twelveDataApi.ts          # Twelve Data REST + quota
│   ├── marketRepository.ts       # Facade: WS + polling + cache
│   ├── storage.ts                # localStorage CRUD
│   ├── notifications.ts          # Web Notifications + email
│   └── utils.ts                  # Format helpers
├── stores/                       # Zustand stores
│   ├── settingsStore.ts          # API keys, prefs (persist)
│   └── marketStore.ts            # Candles, signals, prices
└── types/
    └── index.ts                  # TypeScript types & enums
```

## Luồng dữ liệu

### 1. Lấy giá & tính tín hiệu

```
User chọn pair (tab)
  → marketStore.watchPair(pair)
  → marketRepository.watch(pair, 15m/1H/4H/D1)
    → Binance WebSocket (BTC) hoặc Twelve Data polling (XAU/EUR)
    → Candles update
  → marketStore.recomputeSignal(pair)
    → signalEngine.computeSignal(pair, c15m, c1H, c4H, c1D)
      → Tính indicators (EMA, RSI, MACD, ADX, ATR)
      → Check 5 conditions
      → Check ADX > 30
      → Check MTF (1H + 4H)
      → Compute Trend Matrix (short/medium/long)
      → Compute SL/TP (ATR-based)
    → Signal
  → marketStore.set(signal)
  → React re-render SignalCard
```

### 2. Notification flow

```
Signal computed
  → handleSignalEffects(signal)
    → If direction == Wait → return
    → Check cooldown (15min per pair)
    → If direction changed → reset cooldown
    → If pushEnabled → showSignalNotification()
    → If quality == Beautiful && emailEnabled → sendSignalEmail()
      → fetch('/api/email', { to, subject, html })
      → Next.js API route → Resend API
    → Save signal to localStorage
```

## Coding conventions

### TypeScript
- Single quotes cho string literals
- `enum` cho fixed values (TradingPair, Timeframe, SignalDirection...)
- `interface` cho object shapes, `type` cho unions
- Strict mode — không dùng `any`
- KHÔNG thêm comment trừ khi logic phức tạp

### Components
- `'use client'` directive ở đầu file nếu dùng hooks/browser APIs
- Functional components, hooks-based
- Props destructuring
- Ant Design components cho UI

### Zustand
- `create<T>()` cho mỗi store
- Selectors: `useStore((s) => s.field)` để tránh unnecessary re-renders
- Persist middleware cho store cần sync localStorage

### Lib (domain layer)
- Pure TypeScript — không import React/store/browser
- Export functions, không export classes (trừ MarketRepository)
- Input: `Candle[]`, Output: `number[]` hoặc interface

## Thêm indicator mới

Xem skill `.opencode/skills/add-indicator/SKILL.md` hoặc:

1. Thêm function vào `src/lib/indicators.ts`:
   ```typescript
   export function bollingerBands(candles: Candle[], period: number): BollingerResult {
     // ...
   }
   ```

2. Thêm constants vào `src/lib/constants.ts` nếu cần

3. (Nếu dùng cho signal) Tích hợp vào `src/lib/signalEngine.ts`

4. (Nếu hiển thị chart) Thêm LineSeries vào `CandlestickChart.tsx`

5. Cập nhật `docs/04_INDICATORS.md`

## Thêm cặp giao dịch mới

Xem skill `.opencode/skills/add-trading-pair/SKILL.md` hoặc:

1. Thêm vào `TradingPair` enum (`src/types/index.ts`):
   ```typescript
   export enum TradingPair {
     BtcUsdt = 'btcUsdt',
     XauUsd = 'xauUsd',
     EurUsd = 'eurUsd',
     EthUsdt = 'ethUsdt',  // mới
   }
   ```

2. Thêm config vào `PAIR_CONFIG` (`src/lib/constants.ts`)

3. UI tự động cập nhật (PairTabs iterate enum)

## Chạy test

### Unit test cho indicators

Chưa setup test framework. Để thêm:

```bash
npm install -D vitest
```

Tạo `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'node' },
});
```

Tạo test files trong `test/` và chạy:
```bash
npx vitest
```

## Debug

### Xem candles raw
```typescript
// Trong browser console:
const store = document.querySelector('#__next')._reactRootContainer
// Hoặc dùng React DevTools → Zustand store
```

### Check WebSocket connection
- DevTools → Network → WS → xem stream `btcusdt@kline_15m`

### Check localStorage
- DevTools → Application → Local Storage → localhost:3000
  - `ts_settings`: API keys + prefs
  - `ts_signals`: lịch sử tín hiệu
  - `ts_quota`: Twelve Data usage

### Log signal computation
Thêm tạm vào `signalEngine.ts`:
```typescript
console.log('Signal:', { ema20, ema50, rsi: rsiVal, adx: adxVal, passedCount });
```

## Build & Deploy

### Production build
```bash
npm run build
npm run start    # Chạy production server
```

### Deploy lên Vercel
1. Push code lên GitHub
2. Vào https://vercel.com → New Project → import repo
3. Thêm Environment Variable: `RESEND_API_KEY`
4. Deploy

### Deploy self-hosted
```bash
npm run build
npm run start -- -p 3000
```
Dùng PM2 hoặc systemd để chạy như service.
