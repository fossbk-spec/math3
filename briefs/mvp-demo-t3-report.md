# Báo cáo T3 — 17/10/2026

## Nội dung và số liệu mẫu đã dọn

- `public/index.html:66`, `:97`, `:104`; `public/assets/js/pages/index.js:4-15`: tiến độ bài học, sao và điểm cao nhất lấy từ `/api/lessons` và `/api/me/progress`. Đã bỏ khối lời dặn sai về Bài 10 trong commit `4f510ff`.
- `public/leaderboard.html:16`; `public/assets/js/pages/leaderboard.js:1-50`: bảng xếp hạng và tổng sao lấy từ `/api/leaderboard`, có trạng thái rỗng.
- `public/game.html:37`, `:41`, `:258`, `:286`, `:324`: kỷ lục lấy từ `/api/me/game-scores`, điểm ván từ game; bỏ điểm giả và các khối nhiệm vụ, đấu trực tuyến, bảng vàng không có dữ liệu.
- `public/game2.html:45-75` và `public/assets/js/pages/game2.js:8,46-52`: chỉ số ván bắt đầu từ 0, điểm cập nhật khi chơi; bỏ gara vật phẩm và bảng xếp hạng mẫu. `public/game3.html:86` và `public/assets/js/pages/game3.js:14,71`: điểm ghép thẻ cập nhật khi chơi; bỏ nhiệm vụ tuần và bảng vàng mẫu.
- `public/game4.html:41`, `:62`, `:68` và `public/assets/js/pages/game4.js:10-12,32-34,67-73`: cá, thời gian, điểm lấy từ trạng thái ván; bỏ bộ sưu tập và bảng vàng mẫu.
- `public/exam.html:209-219` và `public/assets/js/pages/exam.js:72-87`: số câu và thanh tiến độ tính từ câu đã trả lời; bỏ các số trong chú giải mẫu. `public/exercise.html:57`, `:104`, `:155`, `:219`, `:374`: bỏ sao thưởng từng câu và kết quả 100% viết sẵn; kết quả thật được `exercise.js` điền sau khi nộp.
- `public/schedule.html:31`, `:45`, `:50`, `:75-158`, `:197`; `public/assets/js/pages/schedule.js:130-143,409-410`: thay kỳ thống kê, sĩ số và KPI mẫu bằng dữ liệu giáo viên; bỏ biểu đồ chẩn đoán và hàng học sinh giả. Tên giáo viên mẫu là “Cô giáo Demo” ở `public/schedule.html:45` và `public/exam.html:300`.
- `public/introduce.html:15`: giữ phần giới thiệu nội dung Bài 9–15; không còn số liệu thành tích mẫu.

## Rà a11y theo web-design-guidelines

Đã sửa:

- `public/assets/css/app.css:6-12` (commit `4f510ff`): focus nhìn thấy được, vùng chạm nút trong main tối thiểu 48 px, liên kết bỏ qua nội dung và reduced motion. Các trang có skip link tại đầu body, ví dụ `public/index.html:15`.
- `public/index.html:36`, `public/game3.html:39`: nhãn cho nút icon và vùng chạm 48 px. `public/exercise.html:367`, `public/assets/js/core/game-score.js:22-23`, `public/lesson.html:29`: thông báo kết quả có live region.
- Toàn bộ `public/*.html`: ảnh có `alt`, `width`, `height`; không có viewport chặn phóng to. `public/schedule.html:174`: ô tìm học sinh có nhãn truy cập.

Còn lại:

- `public/index.html:36`, `public/game3.html:39`: nút âm thanh chỉ đổi biểu tượng hoặc chưa có âm thanh thực; nên nối với âm thanh thật hoặc bỏ trong task chức năng sau.
- `public/game.html:16`, `public/game4.html:16`, `public/schedule.html:16`: một số nhãn phụ trong header còn cỡ 11–13 px theo thiết kế gốc, dưới chuẩn chữ học sinh 18 px. Cần rà hiển thị bằng mắt trước khi đổi đồng loạt để tránh vỡ bố cục.
- Kiểm tra hình ảnh tại 768×1024 và 1024×768: **NOT RUN** vì yêu cầu không mở trình duyệt/Playwright.

## Tailwind CDN

Đã bỏ `cdn.tailwindcss.com` và script cấu hình chạy trong trình duyệt khỏi các trang. `npm run build:css` **PASS**, tạo `public/assets/css/tailwind.build.css` 76 KB từ cùng cấu hình và toàn bộ class trong `public/`. So ảnh trước/sau: **NOT RUN** theo ràng buộc không mở trình duyệt. Không thêm dependency.

## Kiểm tra và thời gian test

- `npm test`: **PASS**, 6/6; lần đầu 7.13 giây, các lần sau 1.37–1.38 giây. Không tái hiện tình trạng hơn 2 phút. Bài API khởi động server con và đóng bằng `server.kill()`, chờ sự kiện `exit`, rồi xoá DB tạm trong `finally` (`test/api.test.js:12-83`); không thấy handle server/DB bị giữ trong các lần chạy này. Vì vậy không sửa test khi chưa tái hiện được lỗi.
- `node --check` bảy file JS đã sửa: **PASS**.
- `npm run build:css`: **PASS**; cảnh báo `caniuse-lite` cũ, build vẫn hoàn tất.
- `npm run build:demo`: **PASS**, 13 trang và `data/grade3.json`.
- Kiểm đếm thẻ `div`/`section`, ảnh thiếu `alt`/kích thước, `git diff --check`: **PASS**.
- Tra `ui-ux-pro-max`: **NOT RUN**, máy không có lệnh `py`; không cài thêm gì.
- Kiểm tra hình ảnh trong trình duyệt: **NOT RUN** theo yêu cầu.
