# 03 — API SPECS

## 1. Binance API (BTC/USDT)

Base URL: `https://api.binance.com`
WebSocket: `wss://stream.binance.com:9443/ws`
**Không cần API key.**

### 1.1. REST — Lấy lịch sử nến (Klines)

```
GET /api/v3/klines?symbol=BTCUSDT&interval=15m&limit=200
```

| Param | Type | Mô tả |
|---|---|---|
| `symbol` | String | `BTCUSDT` |
| `interval` | String | `15m`, `1h`, `4h` |
| `limit` | Int | Số nến (max 1000), mặc định 200 |

**Response:** Array of arrays
```json
[
  [
    1690000000000,   // open time (ms)
    "29000.00",       // open
    "29100.00",       // high
    "28950.00",       // low
    "29050.00",       // close
    "123.456",        // volume
    1690000899999,   // close time (ms)
    "3580000.00",     // quote asset volume
    500,              // number of trades
    "60.00",          // taker buy base volume
    "1740000.00",     // taker buy quote volume
    "0"               // ignore
  ]
]
```

### 1.2. WebSocket — Realtime kline

```
wss://stream.binance.com:9443/ws/btcusdt@kline_15m
```

**Message format:**
```json
{
  "e": "kline",
  "E": 1690000000000,
  "s": "BTCUSDT",
  "k": {
    "t": 1690000000000,
    "o": "29000.00",
    "h": "29100.00",
    "l": "28950.00",
    "c": "29050.00",
    "v": "123.456",
    "x": false
  }
}
```

**Logic:** Khi `k.x === true` → nến đóng → trigger signalEngine recompute.

### 1.3. Mapping

| TradingPair | Binance symbol | WS stream |
|---|---|---|
| BTC/USDT | `BTCUSDT` | `btcusdt@kline_15m` |

---

## 2. Twelve Data API (XAU/USD, EUR/USD)

Base URL: `https://api.twelvedata.com`
**Cần API key** (free: 800 req/ngày, 8 req/min).

### 2.1. REST — Time Series

```
GET /time_series?symbol=XAU/USD&interval=15min&outputsize=200&apikey=...
```

| Param | Type | Mô tả |
|---|---|---|
| `symbol` | String | `XAU/USD`, `EUR/USD` |
| `interval` | String | `15min`, `1h`, `4h` |
| `outputsize` | Int | Số nến, mặc định 200 |
| `apikey` | String | API key |

**Response:**
```json
{
  "meta": { "symbol": "XAU/USD", "interval": "15min" },
  "values": [
    {
      "datetime": "2023-07-12 14:00:00",
      "open": "1950.00",
      "high": "1955.00",
      "low": "1948.00",
      "close": "1952.00",
      "volume": "0"
    }
  ],
  "status": "ok"
}
```

**Lưu ý:**
- `values` sắp xếp mới nhất đầu (index 0 = mới nhất) → cần reverse.
- Twelve Data không cung cấp volume cho XAU/USD (volume = "0") → bỏ qua điều kiện volume cho XAU.

### 2.2. REST — Price (realtime)

```
GET /price?symbol=XAU/USD&apikey=...
```

**Response:**
```json
{
  "symbol": "XAU/USD",
  "price": "1952.50"
}
```

### 2.3. REST — API Usage

```
GET /api_usage?apikey=...
```

**Response:**
```json
{
  "plan": "free",
  "usage": 123,
  "limit": 800
}
```

### 2.4. Mapping

| TradingPair | TD symbol | Intervals |
|---|---|---|
| XAU/USD | `XAU/USD` | `15min`, `1h`, `4h` |
| EUR/USD | `EUR/USD` | `15min`, `1h`, `4h` |

### 2.5. Rate limit management

- App tự đếm req trong ngày (localStorage `ts_quota`).
- Trước mỗi request: kiểm tra `count < 750` → mới gọi.
- Nếu > 750: dừng poll, hiện warning banner.
- Pause polling khi tab hidden (`document.visibilitychange`).

---

## 3. Resend API (Email)

Base URL: `https://api.resend.com`

### 3.1. Next.js API Route (proxy)

```
POST /api/email
Content-Type: application/json
```

**Request body (từ browser):**
```json
{
  "to": "user@example.com",
  "subject": "🔔 Tín hiệu ĐẸP — BTC/USDT BUY",
  "html": "<h2>Tín hiệu ĐẸP</h2>..."
}
```

**Server-side:** Next.js API route đọc `RESEND_API_KEY` từ `process.env`, gọi Resend API:

```
POST https://api.resend.com/emails
Authorization: Bearer {RESEND_API_KEY}
Content-Type: application/json
```

**Body:**
```json
{
  "from": "trading-signals@resend.dev",
  "to": ["user@example.com"],
  "subject": "🔔 Tín hiệu ĐẸP — BTC/USDT BUY",
  "html": "..."
}
```

**Response (200):**
```json
{ "success": true, "id": "re_123abc..." }
```

**Error responses:**
- `400`: Missing `to` or `subject`
- `422`: Invalid email / API key
- `429`: Rate limit
- `500`: Resend API error
