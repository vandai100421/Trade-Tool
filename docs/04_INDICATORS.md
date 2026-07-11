# 04 — INDICATORS

Tài liệu mô tả các chỉ báo kỹ thuật. Implement trong `src/lib/indicators.ts` — pure TypeScript, nhận `Candle[]`, trả `number[]` hoặc object.

## 1. EMA (Exponential Moving Average)

### Công thức
```
EMA[t] = Price[t] × α + EMA[t-1] × (1 - α)
α = 2 / (period + 1)
```

### Tham số
| EMA | Period | Mục đích |
|---|---|---|
| EMA20 | 20 | Short-term trend |
| EMA50 | 50 | Mid-term trend |

### Logic
- EMA20 > EMA50 → **Uptrend** (bullish)
- EMA20 < EMA50 → **Downtrend** (bearish)

### Edge cases
- Cần ít nhất `period` nến để tính EMA đầu tiên (seed = SMA).
- Nếu `< period` nến → trả `NaN`.

---

## 2. RSI (Relative Strength Index)

### Công thức
```
RS = AvgGain / AvgLoss
RSI = 100 - (100 / (1 + RS))
```
- Wilder's smoothing:
  ```
  AvgGain[t] = (AvgGain[t-1] × (period-1) + Gain[t]) / period
  ```

### Tham số: Period = 14

### Ngưỡng
| RSI | Ý nghĩa |
|---|---|
| > 70 | Overbought |
| < 30 | Oversold |
| 40-60 | Vùng an toàn (neutral) |
| > 50 | Bullish bias |
| < 50 | Bearish bias |

### Điều kiện #2
- **BUY:** 40 ≤ RSI ≤ 70
- **SELL:** 30 ≤ RSI ≤ 60

---

## 3. MACD

### Công thức
```
MACD line   = EMA12 - EMA26
Signal line = EMA9 của MACD line
Histogram   = MACD line - Signal line
```

### Tham số: Fast 12, Slow 26, Signal 9

### Điều kiện #3
- **BUY:** Histogram > 0
- **SELL:** Histogram < 0

---

## 4. ADX (Average Directional Index)

### Công thức
```
+DM = High[t] - High[t-1]  (nếu > 0 và > -DM, ngược lại = 0)
-DM = Low[t-1] - Low[t]    (nếu > 0 và > +DM, ngược lại = 0)
TR = max(High-Low, |High-Close_prev|, |Low-Close_prev|)

+DI = 100 × EMA(+DM) / EMA(TR)
-DI = 100 × EMA(-DM) / EMA(TR)
DX = 100 × |+DI - -DI| / (+DI + -DI)
ADX = EMA(DX, 14)
```

### Tham số: Period = 14

### Ý nghĩa
| ADX | Trend strength |
|---|---|
| < 20 | Yếu / không trend |
| 25-50 | Trend mạnh |
| > 30 | Trend rất mạnh (ngưỡng tín hiệu ĐẸP) |

---

## 5. Volume Average

### Công thức: `VolAvg = SMA(volume, 20)`

### Điều kiện #4
- Volume hiện tại > VolAvg → có đủ liquidity.
- **Edge case:** XAU/USD volume = 0 → luôn `true`.

---

## 6. ATR (Average True Range)

### Công thức
```
TR = max(High-Low, |High-Close_prev|, |Low-Close_prev|)
ATR = EMA(TR, 14)
```

### Mục đích
- Gợi ý stop-loss: Entry ± (1.5 × ATR)
- Gợi ý take-profit: Entry ± (3 × ATR) (RR = 1:2)

---

## 7. Tóm tắt

| # | Indicator | Params | Mục đích | Thuộc điều kiện |
|---|---|---|---|---|
| 1 | EMA20, EMA50 | 20, 50 | Trend direction | Điều kiện #1, #5 |
| 2 | RSI | 14 | Momentum / overbought-oversold | Điều kiện #2 |
| 3 | MACD | 12, 26, 9 | Momentum confirmation | Điều kiện #3 |
| 4 | Volume Avg | 20 | Liquidity confirmation | Điều kiện #4 |
| 5 | ADX | 14 | Trend strength | Tín hiệu ĐẸP |
| 6 | ATR | 14 | Volatility (hiển thị) | Stop-loss gợi ý |
