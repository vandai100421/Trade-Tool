# Trading Signals

Web app phát tín hiệu giao dịch (BUY/SELL/WAIT) cho 3 cặp: **BTC/USDT**, **XAU/USD** (Vàng), **EUR/USD**.

App đóng vai trò "cái còi" — chỉ phát tín hiệu, **KHÔNG** xử lý lệnh, **KHÔNG** quản lý tài khoản.

## Tính năng chính

- **Dashboard 3 cặp** — tín hiệu realtime, giá cập nhật liên tục
- **Signal Engine** — 5 điều kiện + ADX + Multi-timeframe (15m / 1H / 4H)
- **Trend Matrix** — phân tích trend 3 lớp (ngắn hạn / trung hạn / dài hạn)
- **Biểu đồ nến** — Candlestick + EMA20/EMA50 (lightweight-charts)
- **PWA** — cài lên màn hình iPhone (Add to Home Screen), nhận Web Notification
- **Thông báo** — Web Notification khi có tín hiệu BUY/SELL (qua service worker)
- **Email** — gửi email khi tín hiệu "ĐẸP" (5/5 + ADX>30 + MTF)
- **Stop-loss / Take-profit** — gợi ý dựa trên ATR
- **API quota tracking** — theo dõi Twelve Data usage

## Tech Stack

| Mục | Công nghệ |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Ant Design (dark theme) |
| State | Zustand |
| Charts | lightweight-charts (TradingView) |
| Storage | localStorage |
| HTTP | fetch (native) |
| WebSocket | native WebSocket API |
| Email | Resend API (via Next.js API route) |

## Nguồn dữ liệu

| Cặp | Nguồn | Cách thức | API Key |
|---|---|---|---|
| BTC/USDT | Binance | WebSocket realtime + REST | Không cần |
| XAU/USD | Twelve Data | REST, polling 30s | Cần (free 800 req/ngày) |
| EUR/USD | Twelve Data | REST, polling 30s | Cần (free 800 req/ngày) |

## Cài đặt

### Yêu cầu
- Node.js >= 18.17
- npm >= 9

### Chạy local (dev)

```bash
# 1. Clone project
git clone <repo-url>
cd TradeTool

# 2. Install dependencies
npm install

# 3. Cấu hình environment
cp .env.local.example .env.local
# → Chỉ cần điền RESEND_API_KEY (cho email). Xem chi tiết trong file.

# 4. Chạy dev server
npm run dev
```

Mở `http://localhost:3000`.

### Deploy lên Vercel (dùng trên iPhone)

Xem hướng dẫn chi tiết: [`docs/DEPLOY.md`](docs/DEPLOY.md).

Tóm tắt:
1. Push code lên GitHub.
2. Vercel → Import repo → set `RESEND_API_KEY` env var → Deploy.
3. Mở URL Vercel bằng Safari → **Add to Home Screen** → cài như app.
4. Vào Settings nhập lại Twelve Data key + email (localStorage mỗi browser riêng).

### Lấy API keys

| Key | Đăng ký ở đâu | Free? | Dùng cho |
|---|---|---|---|
| Twelve Data API key | https://twelvedata.com | 800 req/ngày | XAU/USD, EUR/USD |
| Resend API key | https://resend.com | 100 email/ngày | Gửi email tín hiệu ĐẸP |

- **Twelve Data key**: nhập qua trang Settings của app (lưu trong browser)
- **Resend key**: dán vào file `.env.local` (server-side, không expose ra browser)

## Sử dụng

1. Mở app → vào **Settings** (icon ⚙️ góc phải)
2. Nhập **Twelve Data API Key** → Save
3. (Tùy chọn) Nhập email + bật email notification
4. Quay lại **Home** → chọn cặp cần trade
5. Xem tín hiệu + trend matrix + biểu đồ

### Đọc tín hiệu

| Tín hiệu | Ý nghĩa | Hành động |
|---|---|---|
| 🟢 **BUY** + "ĐẸP" | 5/5 điều kiện + ADX>30 + MTF đồng ý | Cơ hội tốt, notification + email |
| 🟢 **BUY** + "Mạnh" | 5/5 + MTF (ADX<30) | Tín hiệu tốt, notification |
| 🟢 **BUY** + "Thường" | 4/5 + MTF | Cẩn thận, notification |
| ⚪ **WAIT** | <4/5 hoặc MTF conflict | Chờ thêm |

## Signal Engine logic

5 điều kiện (trên 15m):
1. EMA20 > EMA50 (trend)
2. RSI vùng an toàn (40-70 buy / 30-60 sell)
3. MACD histogram cùng chiều
4. Volume > trung bình 20 nến (bỏ qua cho XAU)
5. Close > EMA20 (buy) / Close < EMA20 (sell)

+ ADX > 30 → trend mạnh → tín hiệu "ĐẸP"
+ MTF: 1H + 4H EMA20 vs EMA50 phải cùng chiều

Chi tiết: `docs/05_SIGNAL_ENGINE.md`

## Cấu trúc project

```
src/
├── app/               # Next.js App Router
│   ├── page.tsx       # Home (dashboard)
│   ├── settings/      # Settings page
│   └── api/email/     # Resend proxy (server-side)
├── components/        # React components (antd)
├── lib/               # Business logic (pure TS)
│   ├── indicators.ts  # EMA, RSI, MACD, ADX, ATR
│   ├── signalEngine.ts # 5 conditions + MTF + trend matrix
│   ├── binanceApi.ts  # Binance REST + WebSocket
│   ├── twelveDataApi.ts # Twelve Data REST
│   └── ...
├── stores/            # Zustand stores
└── types/             # TypeScript types
```

## Commands

```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm run start      # Run production server
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```

## Documentation

Xem thư mục `docs/`:

### Hướng dẫn sử dụng
- [`SETUP.md`](docs/SETUP.md) — Cài đặt & chạy từng bước
- [`USAGE.md`](docs/USAGE.md) — Hướng dẫn đọc tín hiệu, trend matrix, trade MT5
- [`DEVELOPMENT.md`](docs/DEVELOPMENT.md) — Hướng dẫn phát triển cho developer

### Tài liệu kỹ thuật
- [`01_PRD.md`](docs/01_PRD.md) — Product Requirements
- [`02_ARCHITECTURE.md`](docs/02_ARCHITECTURE.md) — Kiến trúc & flow
- [`03_API_SPECS.md`](docs/03_API_SPECS.md) — Binance, Twelve Data, Resend
- [`04_INDICATORS.md`](docs/04_INDICATORS.md) — Công thức indicators
- [`05_SIGNAL_ENGINE.md`](docs/05_SIGNAL_ENGINE.md) — Logic tín hiệu
- [`06_UI_GUIDE.md`](docs/06_UI_GUIDE.md) — UI guide
- [`07_DEV_LOG.md`](docs/07_DEV_LOG.md) — Dev log

## Lưu ý quan trọng

- App chỉ là công cụ hỗ trợ, **KHÔNG phải lời khuyên đầu tư**
- Tín hiệu dựa trên phân tích kỹ thuật, không đảm bảo kết quả
- Luôn tự kiểm tra trên MT5 trước khi vào lệnh (giá có thể chênh Binance)
- Quản lý rủi ro: không risking quá 1-2% tài khoản/lệnh
