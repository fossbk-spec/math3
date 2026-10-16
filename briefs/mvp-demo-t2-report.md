# Báo cáo T2 — 16/10/2026

## Việc đã làm

- Tạo API demo trong trình duyệt, lưu tài khoản vai, lượt làm bài, tiến độ, sao, điểm trò chơi và thao tác giáo viên bằng `localStorage`. Nội dung câu hỏi, hints và `aiSafe` đọc từ `dist/data/grade3.json`. Chấm bài qua chính `public/assets/js/core/grading.js`; luyện tập tối đa 3 lượt, kiểm tra 1 lượt, bài chữa chỉ ở lượt luyện tập cuối.
- `api.js` chuyển lời gọi sang demo API khi `window.MATH_DEMO === true`; đăng nhập demo bằng hai nút vai và có nút xoá dữ liệu. Góc giáo viên hỗ trợ duyệt từng câu/cả bộ, thêm/sửa/xoá nội dung demo, xuất CSV từ dữ liệu demo.
- Build sao chép `public/`, dữ liệu nội dung, thêm cờ demo và dải thông báo cố định cho từng trang, thêm `.nojekyll`. Các tài nguyên HTML dùng đường dẫn tương đối. Thêm workflow CI trên PR và workflow Pages khi push `main`; chưa bật Pages trong cài đặt repo.

## File đã đổi

- Thêm: `public/assets/js/core/demo-api.js`, `tools/build-demo.js`, `test/demo-api.test.js`, `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, báo cáo này.
- Sửa: `public/assets/js/core/api.js`, `public/assets/js/pages/login.js`, `public/assets/js/pages/schedule.js`, `package.json`, `.gitignore`.
- `dist/` được tạo khi build và được gitignore; không sửa `data/content/grade3.json`, không thêm dependency, không commit.

## Kết quả kiểm tra theo log

- **PASS** `npm test`: 5 test, 5 pass, 0 fail. Test demo chạy trong Node với `localStorage` giả: vai học sinh, lấy câu hỏi/hints/aiSafe, nộp đủ 3 lượt và nhận bài chữa ở lượt cuối, hết lượt trả 409; vai giáo viên duyệt từng câu và cả bộ.
- **PASS** `node --check`: 6/6 file JS đã thêm hoặc sửa (`api.js`, `demo-api.js`, `login.js`, `schedule.js`, `build-demo.js`, `demo-api.test.js`).
- **PASS** `npm run build:demo`: tạo 13 trang HTML, `dist/data/grade3.json`, `dist/assets/js/core/demo-api.js` và `.nojekyll`.
- **PASS** kiểm tra đầu ra: 13/13 trang có `window.MATH_DEMO=true`; 0 liên kết tài nguyên HTML bắt đầu bằng `/`.
- **PASS** `git diff --check` (có cảnh báo chuyển LF/CRLF của Git trên Windows, không có lỗi whitespace).
- **NOT RUN** kiểm tra trực quan bằng trình duyệt/Playwright theo ràng buộc task; chưa chạy GitHub Actions hoặc deploy; không commit.

## Hạn chế của bản demo

- Không có tài khoản thật; dữ liệu chỉ ở trình duyệt hiện tại và có thể xoá. Đáp án nằm trong file tĩnh nên có thể xem được. Trạng thái giáo viên duyệt chỉ lưu cục bộ và không đồng bộ sang máy khác.
- Trang phiếu `exercise.html` dùng bộ `phieu-bai-9-10` cũ từ `data/seed.json`, không có trong `grade3.json`; bản demo không chấm phiếu này để giữ quy tắc đáp án phải lấy từ `grade3.json`. Các bộ bài 9–15 trên `lesson.html` hoạt động với nội dung đã nhập.
- Dải thông báo và các trang chưa được kiểm tra trực quan ở kích thước máy tính bảng; phần rà giao diện thuộc T3.
