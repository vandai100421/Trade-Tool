# Hướng dẫn sử dụng

## Màn hình Home (Dashboard)

### Tab chọn cặp
- **BTC/USDT** — dữ liệu realtime từ Binance (WebSocket)
- **XAU/USD** — Vàng, polling 30s từ Twelve Data
- **EUR/USD** — Euro, polling 30s từ Twelve Data

Dưới tên mỗi cặp hiển thị giá realtime.

### Signal Card

```
┌───────────────────────────────────────────┐
│  BTC/USDT                      $29,050.00 │
│                                           │
│         🟢 BUY  [ĐẸP]                     │
│                                           │
│  5 Điều kiện (5/5)                        │
│  ✅ EMA Trend    EMA20(29050) > EMA50(...)│
│  ✅ RSI          RSI: 55.30 (an toan)     │
│  ✅ MACD         Histogram: 12.50 (...)   │
│  ✅ Volume       Vol: 150 > Avg(100)      │
│  ✅ Price vs EMA Close(29050) > EMA20(...)│
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ ADX: 35.2  | MTF 1H: ✓ | MTF 4H: ✓│  │
│  │ Stop Loss: $28,850                  │  │
│  │ Take Profit: $29,450                │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌── Phân tích Trend 3 lớp ────────────┐  │
│  │         │Ngắn hạn│Trung hạn│Dài hạn│  │
│  │ Hướng   │🟢 Bull │🟢 Bull  │🟢 Bull│  │
│  │ Sức mạnh│ Mạnh   │Rất mạnh │ Mạnh  │  │
│  │ ADX     │ 25.3   │ 35.1    │ 42.0  │  │
│  │ EMA Gap │ +0.8%  │ +1.2%   │ +0.5% │  │
│  │ GiávsEMA│ +0.3%  │ +1.5%   │ +0.2% │  │
│  │ ⚠️/🟢 Summary Alert                │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

### Đọc tín hiệu

| Hiển thị | Ý nghĩa |
|---|---|
| 🟢 **BUY** + Tag "ĐẸP" (vàng) | Tín hiệu tốt nhất: 5/5 + ADX>30 + MTF đồng ý |
| 🟢 **BUY** + Tag "Mạnh" (xanh dương) | 5/5 + MTF, nhưng ADX chưa >30 |
| 🟢 **BUY** + Tag "Thường" (xám) | 4/5 + MTF |
| 🔴 **SELL** + Tag tương ứng | Ngược lại của BUY |
| ⚪ **WAIT** | Chưa đủ điều kiện, nên đứng ngoài |

### Đọc Trend Matrix

Bảng 3 cột: **Ngắn hạn** (15m EMA9/20), **Trung hạn** (1H EMA20/50), **Dài hạn** (1D EMA20/50).

| Hướng | Ý nghĩa |
|---|---|
| 🟢 Bullish | EMA nhanh > EMA chậm → uptrend |
| 🔴 Bearish | EMA nhanh < EMA chậm → downtrend |
| ⚪ Neutral | EMAs giao nhau → sideways |

| Sức mạnh (dựa trên ADX) | Ý nghĩa |
|---|---|
| Yếu | ADX < 20 — không có trend rõ |
| Đang hình thành | ADX 20-30 — trend đang xây |
| Mạnh | ADX 30-50 — trend mạnh |
| Rất mạnh | ADX > 50 — trend cực mạnh |

**EMA Gap %**: khoảng cách giữa EMA nhanh và EMA chậm, tính theo % giá.
- Gap lớn → trend mạnh
- Gap nhỏ → trend yếu

**Giá vs EMA %**: giá hiện tại cách EMA nhanh bao nhiêu %.
- +2% trở lên → overextended (giá chạy quá xa, có thể pullback)
- -2% trở xuống → overextended ngược chiều

### Alert Summary

Cuối bảng Trend Matrix có alert:
- 🟢 **3/3 Bullish** → "Trend cực mạnh, ưu tiên tìm điểm BUY"
- 🔴 **3/3 Bearish** → "Trend cực mạnh, ưu tiên tìm điểm SELL"
- ⚠️ **Conflict** → "Nên chờ cho đến khi đồng thuận hơn"
- ⚪ **Neutral** → "Trend chưa rõ ràng, nên đứng ngoài"

### Biểu đồ nến

- Nến xanh (bullish): Close > Open
- Nến đỏ (bearish): Close < Open
- Đường cam: EMA20
- Đường tím: EMA50
- Hover: hiển thị OHLC
- Kéo để pan, scroll để zoom

Chuyển timeframe: **15m** / **1H** / **4H** / **1D** ( Segmented control góc phải)

## Màn hình Settings

### Twelve Data API Key
- Nhập API key cho XAU/USD và EUR/USD
- Đăng ký free tại twelvedata.com

### Email notification
- Nhập email nhận thông báo
- Bật/tắt "Gửi email khi tín hiệu ĐẸP"
- Resend API key đã cấu hình trên server (.env.local)

### Web notification
- Bật/tắt push notification
- Chỉ gửi khi tín hiệu 4/5 điều kiện trở lên

### API Usage
- Hiển thị số request Twelve Data đã dùng trong ngày
- Vượt 750 → cảnh báo vàng
- Vượt 800 → dừng polling

## Trade trên MT5

App lấy giá từ Binance (BTC) và Twelve Data (XAU/EUR). Khi trade trên MT5:

1. **Chênh lệch giá**: Giá MT5 có thể chênh $50-200 so với Binance cho BTC
2. **Spread**: MT5 có spread, cần cộng thêm vào entry
3. **Kiểm tra lại**: Luôn so sánh giá trên app vs MT5 trước khi vào lệnh
4. **SL/TP**: Giá trị SL/TP trong app là gợi ý, adjust theo spread MT5

### Mẹo thực tế
- Đợi nến 15m đóng → tín hiệu ổn định hơn
- Không vào lệnh khi Trend Matrix conflict
- Ưu tiên tín hiệu "ĐẸP" (5/5 + ADX>30 + MTF)
- Nếu giá overextended (+2% trở lên) → chờ pullback về EMA20
