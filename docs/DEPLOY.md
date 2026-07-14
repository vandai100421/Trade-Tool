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
