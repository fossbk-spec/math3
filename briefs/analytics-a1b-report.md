# Báo cáo task A1b — 17/10/2026

## Đã làm

- Gửi sự kiện của cả vai học sinh và giáo viên khi có `ANALYTICS_URL` và thống kê đang bật. Mỗi sự kiện có `deviceId`, `role`, `classCode`, `alias`; tên hiển thị không thuộc danh sách bí danh demo được thay bằng `null`, không gửi họ tên thật.
- Trang Thống kê dùng header và footer chung, hiển thị khoảng ngày một lần ở đầu trang, thêm khối “Theo từng em” và CSV tương ứng. Dải tắt thống kê có khoảng trống cuối trang theo chiều cao thực tế.
- Cập nhật hợp đồng `/stats`, dữ liệu mẫu và test. Không thêm dependency; không commit.

## Kiểm tra

| Mục | Kết quả | Log / ghi chú |
|---|---|---|
| `npm test` | PASS | Lượt cuối: 13 test, 13 pass, 0 fail. Lượt đầu lỗi 1 kỳ vọng cũ về số sự kiện trong hàng đợi; đã sửa và chạy lại. |
| `node --check` ba file JS đã sửa | PASS | `analytics.js`, `thong-ke.js`, `analytics.test.js`: exit code 0, không có lỗi cú pháp. |
| `npm run build:demo` | PASS | Exit code 0: `Demo build: 14 trang, data/grade3.json, .nojekyll`. |
| `git diff --check` | PASS | Exit code 0; Git chỉ cảnh báo chuyển LF sang CRLF và không đọc được global ignore ngoài workspace. |
| Kiểm tra bằng trình duyệt / Playwright | NOT RUN | Theo ràng buộc của task; bố cục 768×1024 và 1024×768 chưa được xem trực quan. |
| Tìm gợi ý `ui-ux-pro-max` | FAIL | Lệnh `py -3 ... search.py` không chạy vì máy không có `py`; đã rà code theo checklist `web-design-guidelines` cục bộ. |

## Giới hạn

`students[]` hiện là hợp đồng và dữ liệu mẫu; Worker A2 cần tạo số liệu thật theo cấu trúc mới. Bí danh ngoài danh sách demo sẽ có `alias: null` để tránh gửi nhầm họ tên thật.
