# 01 — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Thông tin chung

| Mục | Giá trị |
|---|---|
| **Tên app** | Trading Signals |
| **Nền tảng** | Web app (Next.js) — chạy trên trình duyệt máy tính |
| **Người dùng** | 1 trader nghiệp dư |
| **Mục tiêu** | Phát tín hiệu MUA / BÁN / CHỜ cho 3 cặp giao dịch |
| **Vai trò app** | "Cái còi" — chỉ phát tín hiệu, KHÔNG xử lý lệnh, KHÔNG quản lý tài khoản |

## 2. Bài toán cần giải quyết

Trader nghiệp dư thường:
- Không có hệ thống rõ ràng → ra quyết định cảm tính.
- Không kiểm tra multi-timeframe → giao dịch ngược trend lớn.
- Bỏ lỡ tín hiệu khi không theo dõi màn hình liên tục.

**Giải pháp:** App tự động phân tích 5 điều kiện + ADX + Multi-timeframe, phát tín hiệu + gửi email/notification khi xuất hiện tín hiệu "ĐẸP".

## 3. Cặp giao dịch & Nguồn dữ liệu

| Cặp | Symbol | Nguồn | Cách thức | API Key |
|---|---|---|---|---|
| Bitcoin | BTC/USDT | Binance | WebSocket realtime + REST history | Không cần |
| Vàng | XAU/USD | Twelve Data | REST, polling 30s | Cần |
| Euro | EUR/USD | Twelve Data | REST, polling 30s | Cần |

## 4. Tính năng chính (MVP)

### F1 — Dashboard tín hiệu
- Hiển thị 3 cặp giao dịch dưới dạng tab.
- Mỗi cặp hiện: tín hiệu hiện tại (BUY/SELL/WAIT), sức mạnh tín hiệu, giá realtime.
- Màu sắc: Xanh (BUY), Đỏ (SELL), Xám (WAIT).

### F2 — Biểu đồ nến
- Candlestick chart (lightweight-charts — TradingView).
- Overlay: EMA20, EMA50.
- Timeframe: 15m (mặc định), có thể chuyển 1H / 4H.

### F3 — Chi tiết tín hiệu
- Danh sách 5 điều kiện với trạng thái ✓/✗.
- Giá trị ADX hiện tại.
- Trạng thái MTF (1H trend, 4H bias).
- Thời gian cập nhật tín hiệu.

### F4 — Cài đặt
- Nhập Twelve Data API key.
- Nhập Resend API key + email nhận thông báo.
- Bật/tắt email notification.
- Bật/tắt push notification.

### F5 — Thông báo
- **Web notification** (browser): khi có tín hiệu BUY/SELL (4/5 điều kiện trở lên).
- **Email** (Resend API via Next.js API route): CHỈ khi tín hiệu "ĐẸP".

### F6 — Lịch sử tín hiệu
- Lưu lại các tín hiệu đã phát (localStorage).
- Xem lại trong 7 ngày gần nhất.

## 5. Yêu cầu phi chức năng

| Yêu cầu | Chi tiết |
|---|---|
| **Không login** | Mở web là dùng được ngay |
| **Không backend server** | Next.js API route chỉ dùng làm proxy gửi email (ẩn Resend API key) |
| **Offline** | Xem được tín hiệu & dữ liệu đã cache khi mất mạng |
| **Hiệu năng** | UI mượt 60fps, cập nhật giá realtime không lag |
| **Tiết kiệm API** | Twelve Data: 800 req/ngày free → polling tối ưu 30s, chỉ poll khi tab active |
| **Bảo mật** | Twelve Data key lưu trong localStorage (client-side). Resend key lưu trong `.env.local` (server-side only) |

## 6. Ràng buộc & Giới hạn

- KHÔNG xử lý lệnh giao dịch.
- KHÔNG kết nối sàn giao dịch để đặt lệnh.
- KHÔNG quản lý portfolio / tài khoản.
- Twelve Data free plan: 800 req/ngày → phải quản lý quota.
- Resend API key KHÔNG expose ra browser — dùng Next.js API route.

## 7. Định nghĩa tín hiệu

| Loại | Điều kiện | Hành động |
|---|---|---|
| **Tín hiệu BUY/SELL thường** | 4/5 điều kiện thoả mãn | Web notification |
| **Tín hiệu "ĐẸP"** | 5/5 điều kiện + ADX > 30 + MTF đồng ý | Web notification + Email |
| **WAIT** | < 4/5 điều kiện | Không thông báo |

Chi tiết 5 điều kiện xem tại `05_SIGNAL_ENGINE.md`.
