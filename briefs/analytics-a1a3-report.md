# Báo cáo A1 và A3 — 17/10/2026

## Việc đã làm

- A1: hàng đợi sự kiện ẩn danh trong `localStorage` (tối đa 200), gửi bằng `sendBeacon` theo lô tối đa 20 tới `${MATH_ANALYTICS_URL}/e` khi URL có giá trị; URL rỗng không gửi. Có nút tắt/bật thống kê, tắt sẽ xoá hàng đợi và mã thiết bị. Sự kiện học sinh chỉ giữ cục bộ theo quy tắc riêng tư của repo; chỉ sự kiện vai giáo viên có thể gửi ra ngoài. Không đưa tên/bí danh hoặc nội dung đáp án vào payload.
- Gắn sự kiện vào API demo (nộp bài, duyệt câu), bài học (mở bài, gợi ý), bộ lưu điểm chung của bốn game và AI Safe. Build demo chèn `MATH_ANALYTICS_URL` từ `ANALYTICS_URL`, mặc định chuỗi rỗng.
- A3: trang Thống kê liên kết từ menu giáo viên, gồm khối Người dùng, Quá trình sử dụng, Học tập và Xuất CSV; biểu đồ cột HTML thuần, mỗi chỉ số có `n` và khoảng thời gian. Khi chưa có URL, trang hiện `DỮ LIỆU MẪU` từ JSON cục bộ. Phiếu ý kiến giáo viên 5 câu thang 1–5 chỉ lưu trên máy và hiện số phiếu trả lời.
- Ghi hợp đồng `/stats` để A2 triển khai. Không thêm dependency, không sửa `data/content/grade3.json`, không commit.

## File đã đổi

- Mới: `public/assets/js/core/analytics.js`, `public/assets/js/pages/thong-ke.js`, `public/thong-ke.html`, `public/data/stats-sample.json`, `test/analytics.test.js`, `briefs/analytics-stats-schema.md`, báo cáo này.
- Sửa: `tools/build-demo.js`, `public/assets/js/core/app.js`, `public/assets/js/core/demo-api.js`, `public/assets/js/core/game-score.js`, `public/assets/js/pages/lesson.js`, `public/assets/js/pages/ai-safe.js`, `public/assets/js/components/navbar.js`.

## Kiểm tra

| Lệnh/kiểm tra | Kết quả thực tế |
|---|---|
| `npm test` | **PASS** — 12 test, 0 fail (log cuối). |
| `node --check` toàn bộ 10 file JS đã sửa/tạo | **PASS** — 10/10 file. |
| `npm run build:demo` | **PASS** — 14 trang, `data/grade3.json`, `.nojekyll`. |
| Kiểm tra `dist/thong-ke.html` và `dist/data/stats-sample.json` | **PASS** — URL mặc định rỗng, có `analytics.js`, có JSON mẫu. Lần gọi `node -e` đầu tiên **FAIL** do trích dẫn lệnh PowerShell; kiểm tra lại bằng PowerShell **PASS**. |
| Trình duyệt/Playwright | **NOT RUN** theo yêu cầu. |
| Worker Cloudflare/A2 | **NOT RUN** — chưa có Worker; `/stats` có URL chỉ có thể kiểm chứng sau A2. |

## Giới hạn hiện tại

Dữ liệu mẫu không phải dữ liệu thực. Khi chưa có Worker, phiếu giáo viên và sự kiện chỉ tồn tại trên từng trình duyệt; không thể tổng hợp nhiều máy. Khi A2 triển khai, cần kiểm tra thực tế endpoint, CORS và schema, đồng thời không xem điểm/thời gian từ trình duyệt là dữ liệu đã xác thực.
