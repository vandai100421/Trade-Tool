# Hướng dẫn cài đặt & chạy

## 1. Cài Node.js

Kiểm tra đã có Node.js chưa:

```bash
node --version
```

- Nếu chưa có → tải và cài từ https://nodejs.org (chọn LTS >= 18.17)
- Nếu đã có nhưng version cũ → nâng cấp lên >= 18.17

## 2. Cài dependencies

```bash
cd TradeTool
npm install
```

Chờ 1-2 phút để npm cài tất cả packages.

## 3. Cấu hình environment

```bash
cp .env.local.example .env.local
```

Mở file `.env.local`, điền:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

> **Chỉ cần RESEND_API_KEY** nếu muốn gửi email khi tín hiệu ĐẸP.
> Twelve Data API key nhập qua UI (Settings page), không cần放进 .env.local.

### Lấy Resend API key

1. Vào https://resend.com → Sign up (free)
2. Dashboard → API Keys → Create API Key
3. Copy key (có dạng `re_xxxxxxxx`)
4. Dán vào `.env.local`

## 4. Lấy Twelve Data API key

1. Vào https://twelvedata.com → Sign up (free, 800 req/ngày)
2. Dashboard → API Keys → copy key
3. **KHÔNG dán vào .env.local** — nhập qua app:
   - Mở app → Settings → ô "Twelve Data API Key" → dán → Save

## 5. Chạy app

```bash
npm run dev
```

Mở browser: `http://localhost:3000`

## 6. Setup lần đầu

1. Mở app → click icon ⚙️ (góc phải) → vào Settings
2. Dán Twelve Data API key → Save
3. (Tùy chọn) Nhập email + bật "Gửi email khi tín hiệu ĐẸP"
4. Bật "Web notification" (cho phép browser hiện notification)
5. Quay lại Home → chọn tab BTC/USDT → xem tín hiệu

## Troubleshooting

### `npm install` bị lỗi
- Xóa `node_modules` và `package-lock.json`, chạy lại:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### App chạy nhưng BTC không cập nhật giá
- Kiểm tra mạng có chặn WebSocket không (corporate firewall)
- Mở DevTools (F12) → Console → xem có lỗi WS không
- Thử mạng khác (mobile hotspot)

### XAU/USD hiển thị "Cần Twelve Data API Key"
- Chưa nhập API key → vào Settings → nhập lại → Save
- API key sai → kiểm tra tại twelvedata.com

### Notification không hiện
- Browser chặn notification → vào browser settings → cho phép localhost:3000
- Kiểm tra Settings → "Web notification" đã bật chưa

### Build lỗi
```bash
npm run typecheck   # Check TypeScript
npm run lint        # Check ESLint
npm run build       # Build lại
```

### Reset toàn bộ data
- Mở DevTools (F12) → Application → Local Storage → xóa tất cả
- Refresh trang
