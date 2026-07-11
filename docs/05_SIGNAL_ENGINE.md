# 05 — SIGNAL ENGINE

Implement trong `src/lib/signalEngine.ts`.

## 1. Tổng quan

```
Input:  Candle[] (15m) + Candle[] (1H) + Candle[] (4H)
Process: Tính indicators → kiểm tra 5 điều kiện → kiểm tra ADX → kiểm tra MTF
Output: Signal (BUY / SELL / WAIT + quality + conditions detail)
```

## 2. Timeframe strategy (Multi-Timeframe)

| Timeframe | Vai trò | Cách dùng |
|---|---|---|
| **15m** | Entry timeframe | Tính 5 điều kiện + ADX tại đây |
| **1H** | Trend confirmation | EMA20 vs EMA50 phải cùng chiều |
| **4H** | Bias (big picture) | EMA20 vs EMA50 phải cùng chiều |

### MTF Confirmation Rule
- **MTF đồng ý (BUY):** 15m = 5/5 BUY + 1H EMA20 > EMA50 + 4H EMA20 > EMA50
- **MTF đồng ý (SELL):** 15m = 5/5 SELL + 1H EMA20 < EMA50 + 4H EMA20 < EMA50
- **MTF không đồng ý:** 1 trong 2 HTF ngược chiều → hạ tín hiệu xuống WAIT

## 3. 5 Điều kiện (trên timeframe 15m)

### Điều kiện #1 — Trend (EMA)
- **BUY:** EMA20 > EMA50
- **SELL:** EMA20 < EMA50

### Điều kiện #2 — RSI an toàn
- **BUY:** 40 ≤ RSI ≤ 70
- **SELL:** 30 ≤ RSI ≤ 60

### Điều kiện #3 — MACD cùng chiều
- **BUY:** MACD histogram > 0
- **SELL:** MACD histogram < 0

### Điều kiện #4 — Volume xác nhận
- **BUY/SELL:** Volume nến hiện tại > VolumeAvg(20)
- **Edge case:** XAU/USD → luôn `true`

### Điều kiện #5 — Price vs EMA20
- **BUY:** Close > EMA20
- **SELL:** Close < EMA20

## 4. ADX Gate

- ADX > 30 → trend đủ mạnh → điều kiện cho "tín hiệu ĐẸP".
- ADX ≤ 30 → trend chưa đủ mạnh → chỉ có thể là tín hiệu thường/mạnh.

## 5. Signal Classification

| Điều kiện | ADX | MTF | Kết quả | Thông báo |
|---|---|---|---|---|
| 5/5 | > 30 | ✓ | **ĐẸP (BUY/SELL)** | Notification + Email |
| 5/5 | ≤ 30 | ✓ | **Mạnh (BUY/SELL)** | Notification |
| 5/5 | — | ✗ | **WAIT** | — |
| 4/5 | — | ✓ | **Thường (BUY/SELL)** | Notification |
| 4/5 | — | ✗ | **WAIT** | — |
| ≤ 3/5 | — | — | **WAIT** | — |

## 6. TypeScript Types

```typescript
enum SignalDirection { Buy = 'buy', Sell = 'sell', Wait = 'wait' }

enum SignalQuality {
  Beautiful = 'beautiful',
  Strong = 'strong',
  Normal = 'normal',
  None = 'none',
}

interface ConditionResult {
  index: number;
  name: string;
  passed: boolean;
  detail: string;
}

interface Signal {
  pair: TradingPair;
  direction: SignalDirection;
  quality: SignalQuality;
  conditions: ConditionResult[];
  adx: number;
  mtf1H: boolean;
  mtf4H: boolean;
  price: number;
  timestamp: string; // ISO string
  ema20: number;
  ema50: number;
  rsi: number;
  macdHistogram: number;
  atr: number;
  stopLoss?: number;
  takeProfit?: number;
}
```

## 7. Stop-loss / Take-profit

Khi tín hiệu BUY/SELL:
- **Stop-loss:** Entry ∓ (1.5 × ATR)
- **Take-profit:** Entry ± (3 × ATR) (RR = 1:2)

## 8. Cooldown logic

Tránh spam thông báo:
- Sau khi phát tín hiệu cho 1 cặp, **cooldown 15 phút**.
- Nếu tín hiệu đổi chiều (BUY → SELL): reset cooldown, gửi ngay.
- Lưu `lastSignalTime` và `lastSignalDirection` cho từng pair trong localStorage.
