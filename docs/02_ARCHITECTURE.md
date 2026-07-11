# 02 — ARCHITECTURE

## 1. Tổng quan kiến trúc

```
┌──────────────────────────────────────────────────┐
│                 BROWSER (Client)                  │
│                                                   │
│  ┌─────────────┐  ┌───────────┐  ┌─────────────┐ │
│  │  React UI   │←→│  Zustand  │←→│  Services   │ │
│  │ (Components)│  │  Stores   │  │ (API, WS)   │ │
│  └─────────────┘  └───────────┘  └──────┬──────┘ │
│                                         │         │
│                    ┌────────────────────┘         │
│                    ▼                              │
│  ┌─────────────────────────────────────────────┐ │
│  │           Domain Layer (Pure TS)            │ │
│  │   indicators.ts  →  signalEngine.ts         │ │
│  └─────────────────────────────────────────────┘ │
│                    │                              │
│    ┌───────────────┼───────────────┐              │
│    ▼               ▼               ▼              │
│  Binance WS    Twelve Data     localStorage      │
│  (BTC realtime) (XAU/EUR poll)  (settings,       │
│                                   signals, quota) │
└──────────────────────────────────────────────────┘
                         │
                         ▼ (chỉ cho email)
┌──────────────────────────────────────────────────┐
│            NEXT.JS API ROUTE (Server)             │
│                                                   │
│  /api/email → Resend API (API key ẩn trong .env)  │
└──────────────────────────────────────────────────┘
```

**Nguyên tắc:** Domain layer (indicators, signal engine) là pure TypeScript, không phụ thuộc React/browser API. Có thể test độc lập.

## 2. Cấu trúc thư mục

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout, global CSS
│   ├── page.tsx                  # Home (dashboard 3 cặp)
│   ├── globals.css               # Tailwind + global styles
│   ├── settings/
│   │   └── page.tsx              # Settings page
│   └── api/
│       └── email/
│           └── route.ts          # API route proxy cho Resend
├── components/
│   ├── SignalCard.tsx            # Card tín hiệu + 5 điều kiện
│   ├── CandlestickChart.tsx      # lightweight-charts wrapper
│   ├── PairTabs.tsx              # Tab selector 3 cặp
│   ├── TimeframeSelector.tsx     # 15m / 1H / 4H toggle
│   └── ApiUsageBar.tsx           # Twelve Data quota bar
├── lib/
│   ├── constants.ts              # Enums, thresholds, endpoints
│   ├── indicators.ts             # EMA, RSI, MACD, ADX, ATR, Volume
│   ├── signalEngine.ts           # 5 conditions + ADX + MTF
│   ├── binanceApi.ts             # Binance REST + WebSocket
│   ├── twelveDataApi.ts          # Twelve Data REST + quota
│   ├── marketRepository.ts       # Facade: WS + polling + cache
│   ├── storage.ts                # localStorage CRUD
│   ├── notifications.ts          # Web Notifications API
│   └── utils.ts                  # Format helpers
├── stores/
│   ├── settingsStore.ts          # Zustand: API keys, prefs
│   └── marketStore.ts            # Zustand: candles, signals, prices
└── types/
    └── index.ts                  # Candle, Signal, ConditionResult types
```

## 3. Luồng dữ liệu

### 3.1. Lấy giá & tính tín hiệu

```
[marketStore] → [marketRepository] → [binanceApi / twelveDataApi]
                                           │
                                      Candle[]
                                           │
                                     [signalEngine]
                                      ├── indicators (EMA, RSI, MACD, ADX)
                                      ├── 5 Conditions check
                                      ├── ADX > 30 check
                                      └── MTF confirmation (1H + 4H)
                                           │
                                       Signal
                                           │
                                 [marketStore] → [React UI]
                                           │
                      if "ĐẸP" → fetch('/api/email') + [notifications]
                      if thường → [notifications]
```

### 3.2. Realtime price (BTC)

```
[binanceApi WebSocket] → onmessage → [marketStore.updateCandle()]
    → [React UI re-render]
    → Khi nến đóng → [signalEngine.recompute()]
```

### 3.3. Polling (XAU, EUR)

```
[setInterval 30s] → [twelveDataApi.fetchCandles()]
    → [marketStore.updateCandles()]
    → [signalEngine.recompute()]
```

## 4. State Management — Zustand

| Store | Chức năng |
|---|---|
| `settingsStore` | API keys, email/push prefs (persist vào localStorage) |
| `marketStore` | Candles per pair+timeframe, signals, realtime prices, API usage |

Zustand `persist` middleware dùng cho settingsStore — tự động sync với localStorage.

## 5. Quản lý API quota (Twelve Data)

- Free: 800 req/ngày, 8 req/min.
- Chiến lược polling:
  - 15m: mỗi 30s (entry timeframe, cần refresh liên tục)
  - 1H: mỗi 5 phút (confirm timeframe)
  - 4H: mỗi 15 phút (bias timeframe, thay đổi chậm)
- 2 cặp × (2880 + 288 + 96) / ... → tối ưu bằng cách chỉ poll khi tab active.
- `document.visibilitychange` event → pause polling khi tab hidden.
- Đếm req trong ngày (localStorage `quota` key), nếu > 750 → dừng poll, hiện warning.

## 6. Storage Schema (localStorage)

| Key | Type | Mô tả |
|---|---|---|
| `ts_settings` | `JSON` | `{ twelveDataKey, resendKey, emailTo, emailEnabled, pushEnabled }` |
| `ts_signals` | `JSON` | `Signal[]` — lịch sử tín hiệu (tự clear sau 7 ngày) |
| `ts_quota` | `JSON` | `{ date, count }` — đếm Twelve Data requests trong ngày |

## 7. Bảo mật

| API Key | Lưu ở đâu | Ai thấy |
|---|---|---|
| Twelve Data | localStorage (browser) | Chỉ user (client-side only) |
| Resend | `.env.local` (server) | KHÔNG expose ra browser — chỉ Next.js API route đọc được |

Email flow: Browser → `POST /api/email` (Next.js server) → Resend API. API key không bao giờ gửi xuống client.
