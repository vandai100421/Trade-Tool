# DEPLOY — Vercel + PWA cho iPhone

Hướng dẫn deploy Trading Signals lên Vercel (miễn phí) và cài như app lên iPhone.

## Tại sao Vercel?

- App gần như thuần client-side, chỉ có 1 API route (`/api/email`).
- Vercel = native Next.js, HTTPS tự động, serverless function cho `/api/email`.
- Free tier đủ cho 1 người dùng (traffic thấp, API route ít gọi).
- Không cần bật laptop — chạy 24/7 trên server Vercel.

## Bước 1 — Push code lên GitHub

```bash
git add .
git commit -m "feat: add PWA + service worker + fix mobile notifications"
git push origin main
```

> Lưu ý: file `.env` và `.env.local` đã bị `.gitignore` chặn → API key KHÔNG lên GitHub.

## Bước 2 — Deploy trên Vercel

1. Vào https://vercel.com → đăng nhập bằng GitHub.
2. **Add New... → Project**.
3. Chọn repo `vandai100421/Trade-Tool` → **Import**.
4. Framework Preset: Next.js (tự detect).
5. **Environment Variables** → thêm:
   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | `re_xxx` (lấy từ `.env.local` của bạn) |
6. **Deploy** → đợi ~1-2 phút.
7. Nhận URL: `https://trade-tool.vercel.app` (hoặc tương tự).

> Mỗi lần `git push` lên `main` → Vercel tự deploy lại.

## Bước 3 — Cài PWA lên iPhone

1. Mở **Safari** (không phải Chrome) → vào URL Vercel.
2. Vào trang **Settings** → nhập lại:
   - Twelve Data API key
   - Email nhận thông báo
   - Bật "Web notification" + "Gửi email khi tín hiệu ĐẸP"
   - **Lưu cài đặt**
3. Safari → nút **Share** (hình vuông mũi tên lên) → **Add to Home Screen**.
4. Mở app từ icon mới trên Home Screen.
5. Cấp quyền **Notification** khi được hỏi.

> iOS chỉ cho Web Notification khi app được "Add to Home Screen" (PWA).
> Mở qua tab Safari thường sẽ KHÔNG nhận notification.

## Bước 4 — Verify

- Mở app từ Home Screen → thấy dashboard BTC/USDT.
- Vào Settings → API Usage bar hiển thị số request Twelve Data.
- Khi có tín hiệu BUY/SELL (4/5+) → nhận notification.
- Khi tín hiệu ĐẸP (5/5 + ADX>30 + MTF) → nhận notification + email.

## Các lưu ý quan trọng

### localStorage KHÔNG đồng bộ
- Settings nhập trên laptop KHÔNG tự sang iPhone (mỗi browser storage riêng).
- Phải nhập lại Twelve Data key + email **1 lần trên iPhone**.

### Email "from" domain
- Đang dùng `trading-signals@resend.dev` (Resend free domain).
- Resend free chỉ gửi được tới email đã **verify** trên https://resend.com.
- Muốn gửi tới email bất kỳ → phải thêm + verify custom domain trên Resend.

### Notification iOS giới hạn
- Web Notification chỉ chạy khi app PWA đang mở (foreground) hoặc vừa đóng.
- iOS KHÔNG hỗ trợ push nền (background) như app native.
- Với tín hiệu ĐẸP, **email** là kênh dự phòng tin cậy hơn (vào hộp thư dù app đóng).

### Update code sau này
```bash
git add .
git commit -m "mô tả thay đổi"
git push origin main
# → Vercel tự build + deploy lại
```

### Rollback
- Vercel dashboard → Deployments → chọn commit cũ → **Instant Rollback**.

## Troubleshooting

| Lỗi | Nguyên nhân | Khắc phục |
|---|---|---|
| App trắng / lỗi 500 | Build fail | Vercel → Deployments → xem log build |
| Không nhận notification | iOS chưa Add to Home Screen | Làm lại Bước 3 |
| Không nhận email | Resend key sai / email chưa verify | Check Vercel env var + verify email trên Resend |
| XAU/EUR không có data | Thiếu Twelve Data key | Settings → nhập key |
| Quota Twelve Data hết | > 800 req/ngày | Đợi qua ngày hôm sau, hoặc nâng plan |

---

## Background Monitoring — Telegram + GitHub Actions Cron

PWA chỉ chạy khi mở. Để nhận tín hiệu khi phone đóng, server-side cron (GitHub Actions 15ph) → `/api/check-signals` → gửi Telegram.

### Bước T1 — Tạo Telegram Bot

1. Mở Telegram → tìm **@BotFather** → `/newbot`.
2. Đặt tên + username (kết thúc bằng `bot`) → nhận **BOT_TOKEN** (vd `123456:ABC-DEF...`).
3. Mở chat với bot mới → gửi 1 tin nhắn bất kỳ (bắt buộc để bot có thể reply).
4. Lấy **CHAT_ID**: mở `https://api.telegram.org/bot<TOKEN>/getUpdates` → tìm `"chat":{"id":123456789}`.
5. Test: mở `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>&text=hello` → Telegram nhận tin nhắn.

### Bước T2 — Tạo Vercel KV (cho cooldown + cache)

1. Vercel dashboard → Project → **Storage** tab → **Create** → **KV**.
2. Đặt tên → **Connect to Project**.
3. Vercel tự thêm 2 env vars: `KV_REST_API_URL` + `KV_REST_API_TOKEN`.
4. **Redeploy** project để env vars có hiệu lực.

### Bước T3 — Thêm Environment Variables trên Vercel

Vercel → Project → Settings → Environment Variables → thêm:

| Name | Value | Dùng cho |
|---|---|---|
| `TWELVE_DATA_API_KEY` | (key Twelve Data của bạn) | Cron fetch XAU/EUR candles |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` | Gửi Telegram message |
| `TELEGRAM_CHAT_ID` | `123456789` | Chat nhận tin nhắn |
| `CRON_SECRET` | (chuỗi random, vd `mySecret123`) | Auth cho GitHub Actions gọi API |

> `KV_REST_API_URL` + `KV_REST_API_TOKEN` tự có sau Bước T2.

### Bước T4 — Thêm GitHub Secrets

Repo GitHub → Settings → Secrets and variables → Actions → **New repository secret**:

| Name | Value |
|---|---|
| `VERCEL_URL` | `https://trade-tool.vercel.app` (URL Vercel của bạn, không có `/` cuối) |
| `CRON_SECRET` | (cùng giá trị với `CRON_SECRET` trên Vercel) |

### Bước T5 — Test cron

1. Repo GitHub → tab **Actions** → **Trading Signals Cron**.
2. **Run workflow** (nút phải, `workflow_dispatch`) → Run main.
3. Xem log: HTTP 200 + JSON response với 3 pairs.
4. Nếu có tín hiệu BUY/SELL → Telegram nhận tin nhắn.

> Sau đó cron tự chạy mỗi 15 phút (schedule). GitHub Actions free tier: 2000 min/tháng, mỗi run ~5s → dư sức.

### Tối ưu quota (đã build sẵn)

- 15m candles: fetch fresh mỗi run (cần realtime).
- 1H candles: cache 1 giờ trong KV (refetch khi stale).
- 4H candles: cache 4 giờ trong KV.
- BTC dùng Binance (free, không tốn quota).
- Tiêu thụ ~252 req/ngày Twelve Data (thay vì 576) → dư ~548 cho client-side.

### Lưu ý

- **Cooldown server-side độc lập** client-side (KV vs localStorage). Tránh spam, chấp nhận duplicate khi user đang mở app + cron chạy cùng lúc.
- **Telegram native push**: nhận tức thì trên iPhone kể cả khi app đóng (Telegram app native).
- Nếu thấy duplicate notification khi mở app → tắt "Web notification" trong Settings, chỉ dùng Telegram.
