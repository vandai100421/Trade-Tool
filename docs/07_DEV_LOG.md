# 07 — DEV LOG

## Session 1 — Flutter Project Setup & Full Build

**Ngày:** 2026-07-12

### Đã làm
- Đọc file `note` — hiểu yêu cầu tổng quan.
- Build full Flutter project: 7 docs + 20 Dart files + pubspec.yaml.
- Review & fix bugs: BinanceApi multi-stream, MarketRepository multi-timer, `withValues` → `withOpacity`, cleanup unused imports.

---

## Session 2 — Pivot to Next.js + Full Rewrite

**Ngày:** 2026-07-12

### Yêu cầu thay đổi
- User muốn giao diện web desktop thay vì mobile app.
- Tech stack mới: ReactJS + Next.js (thay Flutter).

### Đã làm
- Xóa toàn bộ Flutter files (`lib/`, `pubspec.yaml`, `analysis_options.yaml`).
- Setup Next.js project:
  - `package.json` — dependencies: next, react, zustand, lightweight-charts, resend, tailwindcss
  - `tsconfig.json` — TypeScript strict mode, `@/*` path alias
  - `tailwind.config.ts` — dark theme colors (buy/sell/wait/accent/ema20/ema50)
  - `next.config.js`, `postcss.config.js`, `.eslintrc.json`, `.gitignore`
  - `.env.local.example` — TWELVE_DATA_API_KEY, RESEND_API_KEY, EMAIL_TO
- Cập nhật 7 file docs cho web stack.
- Viết toàn bộ code (21 file TypeScript/TSX):

| Layer | File | Mô tả |
|---|---|---|
| types | `index.ts` | Candle, Signal, ConditionResult, enums |
| lib | `constants.ts` | PAIR_CONFIG, TIMEFRAME_CONFIG, thresholds, endpoints |
| lib | `utils.ts` | formatPrice, formatTime, round, todayKey |
| lib | `indicators.ts` | EMA, RSI (Wilder), MACD, ADX (+DI/-DI), ATR, SMA, Volume SMA |
| lib | `signalEngine.ts` | 5 conditions + ADX gate + MTF + SL/TP |
| lib | `binanceApi.ts` | REST klines + WebSocket kline stream |
| lib | `twelveDataApi.ts` | REST time_series/price/api_usage + quota tracking |
| lib | `marketRepository.ts` | Facade: Binance WS + Twelve Data polling, cache |
| lib | `storage.ts` | localStorage: settings, signals, quota, cooldown |
| lib | `notifications.ts` | Web Notifications + email via /api/email |
| stores | `settingsStore.ts` | Zustand persist: API keys, prefs |
| stores | `marketStore.ts` | Zustand: candles, signals, prices, watchPair/unwatchPair |
| components | `SignalCard.tsx` | Direction card + 5 conditions + ADX/MTF + SL/TP |
| components | `CandlestickChart.tsx` | lightweight-charts: Candlestick + EMA20/EMA50 lines |
| components | `PairTabs.tsx` | Tab selector 3 cặp + realtime price |
| components | `ApiUsageBar.tsx` | Twelve Data quota progress bar |
| app | `layout.tsx` | Root layout + globals.css |
| app | `page.tsx` | Home: PairTabs + SignalCard + CandlestickChart + TimeframeSelector |
| app | `settings/page.tsx` | Settings: API key form + toggles + usage bar |
| app | `api/email/route.ts` | Next.js API route proxy cho Resend (lazy init) |
| app | `globals.css` | Tailwind directives |

### Bugs fixed trong review
1. **CandlestickChart**: lightweight-charts v4 dùng `addCandlestickSeries()` / `addLineSeries()`, không phải `addSeries(CandlestickSeries, ...)`.
2. **Resend API route**: `new Resend()` throw khi không có API key → fix lazy init (chỉ tạo khi request đến).
3. **marketRepository**: `DataSource` import từ `@/types` không phải `./constants`.
4. **marketStore**: Thiếu import `useSettingsStore` → thêm import.

### Verification
- `npm run typecheck` — PASS (0 errors)
- `npm run lint` — PASS (0 warnings)
- `npm run build` — PASS (6 pages generated)

### Cần làm trước khi chạy
1. Copy `.env.local.example` → `.env.local`, điền `RESEND_API_KEY` (tùy chọn, chỉ cần cho email).
2. `npm run dev` → mở `http://localhost:3000`.
3. Vào Settings → nhập Twelve Data API key → Save.
4. Quay lại Home → dùng app.

---

## Session 3 — Deploy Vercel + PWA cho iPhone

**Ngày:** 2026-07-14

### Yêu cầu thay đổi
- User muốn dùng app trên iPhone khi không ở nhà, không cần bật laptop.
- Cần deploy serverless + cài như app native trên iOS.

### Đã làm

#### Bảo mật repo
- Sửa `.gitignore`: thêm `.env` + `.env.*` (trước đó chỉ ignore `.env.local`, file `.env` chứa LLM key untracked → nguy cơ lộ key).
- Verify `.env.local.example` (file mẫu) vẫn được commit.

#### PWA support (Phase 1 + 2)
- **`src/lib/notifications.ts`**: refactor `showSignalNotification` — dùng `ServiceWorkerRegistration.showNotification()` (MDN khuyến nghị cho mobile), fallback `new Notification()` cho desktop. Trước đó dùng constructor trực tiếp → throw `TypeError` trên iOS.
- **`public/sw.js`**: service worker tối giản — precache shell, runtime cache GET, `notificationclick` focus app.
- **`src/components/ServiceWorkerRegister.tsx`**: client component đăng ký SW (chỉ production), mount vào `layout.tsx`.
- **`src/app/manifest.ts`**: Next.js manifest convention — name, theme_color `#0D1117`, display `standalone`, icons.
- **`public/icon.svg`** + script `sharp` generate: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`.
- **`src/app/layout.tsx`**: thêm metadata `manifest`, `appleWebApp`, `icons`.

#### Tài liệu
- Tạo `docs/DEPLOY.md` — hướng dẫn deploy Vercel + cài PWA lên iPhone + troubleshooting.

### Verification
- `npm run typecheck` — PASS (0 errors)
- `npm run lint` — PASS (0 warnings)
- `npm run build` — PASS (7 pages, `/manifest.webmanifest` route, `/api/email` serverless)

### Lưu ý kiến trúc
- App vẫn thuần client-side, Vercel chỉ chạy `/api/email` làm serverless function.
- localStorage KHÔNG đồng bộ laptop↔iPhone → nhập lại settings 1 lần trên iPhone.
- Notification iOS chỉ chạy trong PWA (Add to Home Screen), không push background.
