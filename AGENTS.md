# AGENTS.md — Trading Signals

## Project overview

Next.js web app phát tín hiệu giao dịch (BUY/SELL/WAIT) cho 3 cặp: BTC/USDT, XAU/USD, EUR/USD. Không login, không backend server (chỉ API route proxy cho email). Lưu local (localStorage). Gửi email khi tín hiệu "ĐẸP".

## Tech stack

- Next.js >= 14 (App Router) + TypeScript
- State management: Zustand
- Charts: lightweight-charts (TradingView)
- Local storage: localStorage (via `src/lib/storage.ts`)
- HTTP: fetch (native)
- WebSocket: native WebSocket API
- Notifications: Web Notifications API
- Email: Resend API (via Next.js API route `/api/email`)
- Styling: Tailwind CSS

## Project structure

```
src/
├── app/               # Next.js App Router (pages + API routes)
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home (dashboard 3 cặp)
│   ├── globals.css    # Tailwind + global styles
│   ├── settings/
│   │   └── page.tsx   # Settings page
│   └── api/email/
│       └── route.ts   # API route proxy cho Resend (ẩn API key)
├── components/        # React components (SignalCard, CandlestickChart, ...)
├── lib/               # Business logic (pure TS, không phụ thuộc React)
│   ├── constants.ts   # Enums, thresholds, endpoints
│   ├── indicators.ts  # EMA, RSI, MACD, ADX, ATR, Volume
│   ├── signalEngine.ts # 5 conditions + ADX + MTF
│   ├── binanceApi.ts  # Binance REST + WebSocket
│   ├── twelveDataApi.ts # Twelve Data REST + quota
│   ├── marketRepository.ts # Facade: WS + polling + cache
│   ├── storage.ts     # localStorage CRUD
│   ├── notifications.ts # Web Notifications + email
│   └── utils.ts       # Format helpers
├── stores/            # Zustand stores
│   ├── settingsStore.ts # API keys, prefs
│   └── marketStore.ts   # Candles, signals, prices
└── types/
    └── index.ts       # TypeScript types (Candle, Signal, ...)
```

**Dependency direction:** Components → Stores → Lib (domain + API). Lib domain layer (indicators, signalEngine) KHÔNG import từ React/stores/components.

## Coding standards

### TypeScript style
- Dùng single quotes cho string literals
- Dùng `const` cho biến không thay đổi, `let` cho biến reassign
- Dùng `interface` cho object shapes, `type` cho unions
- Dùng `enum` cho fixed set of values
- KHÔNG thêm comment trừ khi logic phức tạp
- Strict mode — không dùng `any` trừ khi thực sự cần

### Naming
- Files: `camelCase.ts` (lib) hoặc `PascalCase.tsx` (components)
- Components: `PascalCase`
- Variables/functions: `camelCase`
- Constants: `camelCase` hoặc `UPPER_SNAKE_CASE`
- Enums: `PascalCase`, values `CamelCase`

### Zustand conventions
- `create<T>()` cho mỗi store
- Tách selectors: `useStore((s) => s.field)` để tránh unnecessary re-renders
- Persist middleware cho store cần sync localStorage
- Store tên kết thúc bằng `Store` (ví dụ: `settingsStore`, `marketStore`)

### Component conventions
- `'use client'` directive ở đầu file nếu dùng hooks/browser APIs
- Functional components, hooks-based
- Props destructuring
- Tailwind classes cho styling

### Error handling
- Try-catch ở API layer (lib/*Api.ts)
- Throw `Error` với message rõ ràng
- UI hiển thị error states (loading, error, empty)

## Development rules

### Trước khi edit code
1. Đọc file cần edit trước khi sửa
2. Hiểu context xung quanh (imports, function structure)
3. Mimic code style của file đang sửa

### Sau khi edit code
1. Chạy `npm run typecheck` để check TypeScript
2. Chạy `npm run lint` để check ESLint
3. Đảm bảo không break existing functionality

### API keys
- Twelve Data API key: lưu trong localStorage (client-side, user nhập qua Settings)
- Resend API key: lưu trong `.env.local` (server-side only, KHÔNG expose ra browser)
- KHÔNG hardcode API keys trong code

### Testing
- Prefer viết test cho domain layer (indicators, signalEngine)
- Unit test cho logic tính toán (EMA, RSI, MACD, ADX)
- Test với data thực tế (candle arrays)

## Key constants

Xem `src/lib/constants.ts` cho:
- TradingPair enum (BtcUsdt, XauUsd, EurUsd)
- Timeframe enum (M15, H1, H4)
- Indicator periods (EMA20, EMA50, RSI14, MACD 12/26/9, ADX14)
- Signal thresholds (ADX > 30, RSI 40-70 buy / 30-60 sell)
- API endpoints (Binance, Twelve Data)
- Storage keys
- Polling intervals

## Signal engine logic

5 điều kiện (trên 15m timeframe):
1. EMA20 > EMA50 (BUY) / EMA20 < EMA50 (SELL)
2. RSI trong vùng an toàn (40-70 buy / 30-60 sell)
3. MACD histogram cùng chiều (buy: >0, sell: <0)
4. Volume > VolumeAvg(20) — bỏ qua cho XAU (no volume)
5. Close > EMA20 (BUY) / Close < EMA20 (SELL)

ADX > 30 → trend mạnh → tín hiệu "ĐẸP"
MTF: 1H + 4H EMA20 vs EMA50 phải cùng chiều

Phân loại:
- 5/5 + ADX>30 + MTF → ĐẸP (notification + email)
- 5/5 + MTF → Mạnh (notification)
- 4/5 + MTF → Thường (notification)
- < 4/5 hoặc MTF không đồng ý → WAIT

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Run dev server (localhost:3000)
npm run build            # Production build
npm run start            # Run production server
npm run lint             # ESLint
npm run typecheck        # TypeScript type check
```
