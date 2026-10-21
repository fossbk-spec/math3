# Báo cáo U1 — làm mới giao diện

## Việc đã làm

- Đổi token xanh lá, xanh tương tác, vàng thưởng và font tiêu đề Nunito 800; dùng Nunito Sans cho thân bài. Sáu trang U1 dùng một liên kết Google Fonts hỗ trợ tiếng Việt.
- Tạo `.clay-card`, `.clay-btn`, biến thể vàng/xanh dương, `.chip`, focus ring xanh dương 3px, hiệu ứng thưởng ngắn và quy tắc giảm chuyển động trong `app.css`.
- Sửa khung học sinh: chữ tối thiểu 18px, chip sao vàng, bí danh/lớp dễ đọc, menu tablet có đường đến Mục Lục, luyện tập, phiếu bài, trò chơi và AI Safe & Smart. Trang đề kiểm tra có chip sao từ API tiến độ và đường về Mục Lục.
- Trang chủ có thẻ bài học clay, số bài lớn, trạng thái bằng chữ + biểu tượng và thanh tiến độ. Trang đăng nhập, bài học, luyện tập thích ứng, phiếu bài tập và đề kiểm tra dùng thẻ/nút cùng hệ thống. Trạng thái chọn đáp án có dấu ✓ và chữ; phản hồi đúng/sai có ký hiệu và chữ.
- Liên kết quay lại Mục Lục ở bài học/phiếu bài tập và liên kết AI Safe & Smart có vùng chạm tối thiểu 48px. Dải thống kê thu thành nút “Thống kê” sau “Đã hiểu”, lưu lựa chọn bằng `localStorage` trong `try/catch`.
- Thêm `favicon.ico` và liên kết từ sáu trang U1. Trong `public/assets` không có file logo ảnh cục bộ; biểu tượng trường vẽ tạm theo tông xanh/vàng. Cần thay bằng logo chính thức khi có file gốc. Ảnh logo trên trang hiện là URL ngoài; thử tải từ URL này thất bại do kết nối bị đóng.

## File đã đổi

`public/assets/js/tailwind.config.js`, `public/assets/css/app.css`, `public/assets/css/tailwind.build.css`, `public/assets/js/components/navbar.js`, `public/assets/js/core/analytics.js`, `public/assets/js/core/question-view.js`, `public/assets/js/pages/{index,lesson,practice,exercise,exam}.js`, `public/{index,login,lesson,practice,exercise,exam}.html`, `public/favicon.ico`, `briefs/ui-refresh-u1-report.md`.

Không đổi API, dữ liệu, ID hoặc thuộc tính `data-*` có sẵn; không thêm dependency. Không làm U2, không commit/push.

## Kiểm tra

| Kiểm tra | Kết quả | Log/kết quả |
|---|---|---|
| `npm run build:css` | PASS | Tailwind tạo `public/assets/css/tailwind.build.css` (76 KB). |
| `npm run build:demo` | PASS | `Demo build: 15 trang, data/grade3.json, .nojekyll`; có `dist/favicon.ico`. |
| `node --check` 9 file JS đã sửa | PASS | Cả 9 file trả mã 0. |
| `npm test` | FAIL | 12/12 file test dừng ở `spawn EPERM` của sandbox, chưa chạy ca kiểm thử. |
| `node --test --test-isolation=none test/*.test.js` | FAIL | 69/70 ca pass; ca `API T1 với DB mới` vẫn dừng ở `spawn EPERM` khi tạo server con. |
| `node --test --test-isolation=none test/practice.test.js test/question-view.test.js` | PASS | 7/7 ca pass sau chỉnh giao diện luyện tập và phiếu bài. |
| `git diff --check` | PASS | Không có lỗi whitespace; Git chỉ cảnh báo quy đổi LF/CRLF. |
| Giữ ID/`data-*` trong 6 HTML | PASS | So tên thuộc tính trước/sau với `HEAD`: không thiếu hoặc đổi tên. |
| Độ tương phản token chủ đạo | PASS | Tính theo WCAG: trắng trên xanh chính 5,02:1; trắng trên xanh dương 5,17:1; chữ phụ trên trắng 7,58:1; chữ sẫm trên vàng 8,31:1. |
| Skill `ui-ux-pro-max` | PASS | Lệnh `py -3 ... search.py "children education app" --domain ux` chạy; cơ sở gợi ý không có kết quả cho truy vấn này. |
| Trình duyệt 768×1024 và 1024×768 | NOT RUN | Theo yêu cầu không chạy trình duyệt. |

## Rà theo `web-design-guidelines`

- PASS: sáu trang có skip link; focus ring 3px; nút và liên kết U1 có vùng chạm từ 48px; trạng thái động dùng `aria-live` ở trang bài; ảnh trong phạm vi có `alt` và kích thước; chuyển động mới dùng `transform`/`opacity` và tôn trọng `prefers-reduced-motion`.
- `public/index.html:17`, `public/login.html:27`, `public/exam.html:22`: nhiều biểu tượng trang trí cũ chưa có `aria-hidden="true"`; cần rà bằng trình đọc màn hình.
- `public/exam.html:120`: lựa chọn đáp án là `div` với `role="button"` và xử lý Enter/Space trong `exam.js`; nên đổi sang `<button>` khi có điều kiện kiểm tra tương tác trên trình duyệt.
- NOT RUN: kiểm tra hình ảnh, không tràn ngang, tương phản thực tế của mọi trạng thái và luồng bàn phím ở hai cỡ màn hình.

## Việc còn lại

- Claude chạy test ngoài sandbox và kiểm tra bằng Edge ở 768×1024, 1024×768 theo brief.
- Thay favicon tạm bằng logo trường gốc khi nhận được ảnh cục bộ; kiểm tra logo/ảnh từ URL ngoài trong bản demo.
- U2: trò chơi, bảng thành tích, các trang phụ và phần giáo viên.
