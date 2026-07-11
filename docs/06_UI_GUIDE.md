# 06 — UI GUIDE

## 1. Design principles

- **Tối giản, tối ưu cho desktop** — trader xem nhanh trên trình duyệt.
- **Dark theme** mặc định (dễ nhìn khi trading đêm).
- **Màu sắc rõ ràng** — xanh = BUY, đỏ = SELL, xám = WAIT.
- **Responsive** — tối ưu cho màn hình desktop 1280px+.

## 2. Color palette (Tailwind)

| Mục đích | Class | Hex |
|---|---|---|
| Background | `bg-background` | `#0D1117` |
| Surface (card) | `bg-surface` | `#161B22` |
| Surface variant | `bg-surface-variant` | `#21262D` |
| BUY | `text-buy` / `bg-buy` | `#22C55E` |
| SELL | `text-sell` / `bg-sell` | `#EF4444` |
| WAIT | `text-wait` | `#6B7280` |
| Accent | `text-accent` | `#3B82F6` |
| Text primary | `text-text-primary` | `#F9FAFB` |
| Text secondary | `text-text-secondary` | `#9CA3AF` |
| EMA20 | `text-ema20` | `#F59E0B` |
| EMA50 | `text-ema50` | `#8B5CF6` |
| Warning | `text-warning` | `#EAB308` |

## 3. Pages

### 3.1. Home Page (Dashboard)

```
┌─────────────────────────────────────────────────────────┐
│  Trading Signals                              ⚙️ Settings│  ← Navbar
├─────────────────────────────────────────────────────────┤
│  [BTC/USDT]  [XAU/USD]  [EUR/USD]                       │  ← Pair tabs
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  BTC/USDT                               $29,050.00│  │  ← Signal Card
│  │                                                    │  │
│  │      🟢 BUY                                        │  │
│  │      Tín hiệu ĐẸP                                  │  │
│  │                                                    │  │
│  │  ✅ EMA20 > EMA50                                 │  │  ← 5 conditions
│  │  ✅ RSI: 55.3 (an toàn)                           │  │
│  │  ✅ MACD histogram > 0                            │  │
│  │  ✅ Volume > trung bình                           │  │
│  │  ✅ Close > EMA20                                 │  │
│  │                                                    │  │
│  │  ADX: 35.2  |  MTF: 1H ✓  4H ✓                   │  │
│  │  SL: $28,850 | TP: $29,450                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Biểu đồ nến        [15m] [1H] [4H]               │  │  ← Chart section
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │          📈 Candlestick (lightweight-charts)│  │  │
│  │  │          + EMA20 line (orange)              │  │  │
│  │  │          + EMA50 line (purple)              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Cập nhật: 14:32:05                                    │
└─────────────────────────────────────────────────────────┘
```

### 3.2. Settings Page

```
┌─────────────────────────────────────────────────────────┐
│  ← Settings                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 DATA SOURCE                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Twelve Data API Key                              │  │
│  │  [____________________________________]           │  │
│  │  Dùng cho XAU/USD, EUR/USD                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  📧 EMAIL NOTIFICATION                                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Email nhận thông báo                             │  │
│  │  [____________________________________]           │  │
│  │  (Resend API key đã cấu hình trên server)         │  │
│  │  Bật email tín hiệu ĐẸP              [ toggle ]   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  🔔 NOTIFICATION                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Web notification                     [ toggle ]   │  │
│  │  Chỉ tín hiệu 4/5 trở lên                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  📈 API USAGE (Twelve Data)                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Hôm nay: 123 / 800 requests                      │  │
│  │  ████████████░░░░░░░░░░░                          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [Lưu cài đặt]                                          │
└─────────────────────────────────────────────────────────┘
```

## 4. Component specs

### SignalCard
- Container: `bg-surface` với border màu theo direction.
- Direction text: `text-2xl font-bold`, màu tương ứng.
- Quality badge: "ĐẸP" (`text-warning`), "Mạnh" (`text-accent`), "Thường" (`text-wait`).
- Conditions: list với ✓ (`text-buy`) / ✗ (`text-sell`).
- ADX + MTF: footer row.
- SL/TP: text nhỏ, `text-text-secondary`.

### CandlestickChart
- Library: `lightweight-charts` (TradingView).
- Bullish candle: xanh, bearish: đỏ.
- EMA20: line overlay, orange, width 2.
- EMA50: line overlay, purple, width 2.
- Crosshair: hiển thị OHLCV khi hover.
- Time scale: zoom/pan.

### PairTabs
- 3 tab buttons, mỗi tab = 1 cặp.
- Tab active: `border-b-2 border-accent text-accent`.
- Hiển thị giá realtime nhỏ dưới tên cặp.

## 5. Trạng thái UI

| Trạng thái | Hiển thị |
|---|---|
| Loading | Skeleton shimmer hoặc spinner |
| Error | Card đỏ: "Lỗi kết nối — kiểm tra API key" |
| No data | "Chưa có dữ liệu — refresh để tải lại" |
| Quota exceeded | Banner vàng: "Twelve Data: đã dùng 750/800 req" |
| Offline | Banner: "Mất kết nối — hiển thị dữ liệu cache" |
