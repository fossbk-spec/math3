# Báo cáo M3 — tính năng cơ bản

Ngày 23/10/2026. Tiếp tục trên nhánh `feat/m3-tinh-nang-co-ban` sau commit `78eaf89`. Chưa commit.

## Đã làm

- Hình minh hoạ được dựng bằng SVG DOM ngay dưới đề trong `question-view.js`, dùng chung cho luyện tập, `exercise.html` và `lesson.html`; hai trang sau đã nạp `illustration.js`. Không đưa dữ liệu hình vào `innerHTML`.
- API demo giữ `illustration` trong câu hỏi học sinh. API server trả trường đó từ `illustration_json`; DB thêm cột, nạp từ dữ liệu nguồn và điền cho câu đã được nạp trước đây nếu đề vẫn khớp. Không sửa `grade3.json`.
- Thêm `test/illustration.test.js` cho `valid`, nhãn, SVG, dữ liệu xấu, giới hạn 90 đồ vật và toàn bộ hình trong dữ liệu lớp 3. Test API demo/server xác nhận câu có hình được truyền đủ.
- Rà commit `78eaf89`: bài chữa chỉ hiện trạng thái tự sửa/tự hoàn thành, đáp án và lời giải; không hiện các đáp án sai đã thử. Đã bổ sung test xác nhận điều này và câu sửa đúng ở lần thứ 2. Đọc to gợi ý/lời khen và nhận xét cuối lượt không thấy lỗi cần sửa trong phạm vi này.

## Kiểm tra

| Trạng thái | Lệnh / phạm vi | Kết quả thực tế |
|---|---|---|
| PASS | `node test/illustration.test.js` | 3/3 |
| PASS | `node test/question-view.test.js` | 3/3 |
| PASS | `node test/practice.test.js` | 4/4 |
| PASS | `node test/demo-api.test.js` | 1/1 |
| PASS | `node test/practice-api.test.js` | 1/1, gồm DB và API server có hình |
| PASS | Chạy trực tiếp 9 file test còn lại không cần tiến trình con | 67/67 |
| PASS | `node --check` mọi file JS đã sửa/thêm | Không có lỗi cú pháp |
| PASS | `git diff --check` | Không có lỗi khoảng trắng |
| BLOCKED | `npm test`, `node --test ...` | Sandbox trả `spawn EPERM` khi test runner tạo tiến trình con; không có kết quả kiểm thử từ các lệnh này |
| BLOCKED | `node test/api.test.js` | Chính test này gọi `spawn`, bị `spawn EPERM` |
| NOT RUN | Kiểm tra trực quan trên trình duyệt | Chờ lượt review ngoài sandbox |

Không thêm dependency. Cần chạy `npm test` ngoài sandbox trước khi review/PR vì cổng kiểm tra bắt buộc chưa đạt trong môi trường này.

## Kiểm tra review (23/10)

| Kiểm tra | Kết quả |
|---|---|
| `npm test` (ngoài sandbox) | PASS 80/80 |
| `node --check` các file JS đã sửa | PASS |
| `build:css`, `build:demo` | PASS |
| Edge 1366×768, trang luyện tập | Hình "9 nhóm, mỗi nhóm 2 bông hoa" hiện dưới đề |
| Edge 1366×768, `exercise.html?set=bai-10-nang-cao` | Hình "9 nhóm, mỗi nhóm 6 bông hoa" hiện dưới đề; không lỗi JS |
