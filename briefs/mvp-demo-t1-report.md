# Báo cáo T1 — 16/10/2026

## Việc đã làm theo mục 1–8

1. **API:** Thêm `ALLOW_DRAFT` (mặc định `true`), `MAX_ATTEMPTS` (mặc định 3; kiểm tra 1), mã 409 khi hết lượt; trả nhận xét, số lượt và bài chữa đúng thời điểm. Thêm API duyệt từng câu/cả bộ; câu giáo viên soạn hoặc sửa được duyệt bởi chính giáo viên.
2. **Chấm điểm dùng chung:** Tạo `public/assets/js/core/grading.js` dạng UMD với `norm`, `isCorrect`, `commentFor`, `gradeSubmission`; server dùng qua `require`. Chuẩn hoá dấu chấm hàng nghìn, khoảng trắng và chữ hoa.
3. **Trang chủ:** Hiện liên kết tới mọi bộ của từng bài, bao gồm bài 15 được tạo từ API; nút bộ bài có chiều cao tối thiểu 48px.
4. **Trang làm bài:** Hiện điểm, nhận xét, ✓/✗ từng câu, số lượt còn lại; lượt cuối có đáp án/lời giải nếu có. Bài kiểm tra chỉ hiện điểm và nhận xét.
5. **Góc giáo viên:** Hiện nguồn, trạng thái duyệt; nút Duyệt/Loại từng câu và Duyệt cả bộ.
6. **Bỏ theo quyết định của chủ nhiệm:** Không triển khai phần chỉ phục vụ bảo mật.
7. **Dữ liệu mẫu:** Thay tên người trên các `public/*.html` liên quan bằng bí danh trong `data/seed.json`; bỏ các số trang trí cụ thể như `1.250`, `Hạng 2`, `18 trận`; sao khởi tạo của tài khoản mẫu về 0. Một số khối thống kê mẫu cũ trong HTML vẫn còn trước khi JavaScript lấy dữ liệu thật (xem Việc còn lại).
8. **Kiểm thử:** Thêm script `npm test` và hai tệp `node:test` kiểm tra bộ chấm, DB mới, lượt làm, bài kiểm tra, duyệt câu và lọc DRAFT. Script dùng `node --test test/*.test.js` vì `node --test test/` không chạy trên Node 24.12.0/Windows hiện tại (báo `Cannot find module ...\\test`).

## Kiểm tra phần Claude làm trước

- `server/db.js`, `server/auth.js`, `data/content/grade3.json` và `data/seed.json` khởi tạo thành công trên DB tạm: 7 bài 9–15, 231 câu (221 câu nội dung và 10 câu phiếu mẫu). Không sửa `grade3.json` bằng tay.
- `briefs/ref/api-patches.js` chỉ được tham khảo; đã xóa hai tệp trong `briefs/ref/`, không áp dụng bản vá.

## Tệp đã đổi

- Server và logic: `server/api.js`, `public/assets/js/core/grading.js`.
- Giao diện: `public/assets/js/pages/index.js`, `lesson.js`, `schedule.js`; các HTML `exam`, `exercise`, `game`, `game2`, `game3`, `game4`, `index`, `introduce`, `leaderboard`, `lesson`, `login`, `schedule` trong `public/`.
- Dữ liệu/cấu hình/test: `data/seed.json`, `package.json`, `test/api.test.js`, `test/grading.test.js`.
- Xóa: `briefs/ref/api-patches.js`, `briefs/ref/patch.cjs`.
- `briefs/mvp-demo.md` đã có thay đổi sẵn trong working tree; không chỉnh sửa trong T1.

## Kết quả theo log

- **PASS** `npm test`: 3 test, 3 pass, 0 fail.
- **PASS** `node --check`: toàn bộ 7 tệp JS đã thêm/sửa.
- **PASS** `npm start` với `DB_PATH` tạm: log nạp tài khoản mẫu, server lên cổng 32187; `/api/health` trả `ok: true`, DB tạm tồn tại.
- **NOT RUN** Kiểm tra trực quan/trình duyệt (theo yêu cầu không mở trình duyệt/Playwright).
- **NOT RUN** Commit, PR, deploy (Claude thực hiện các bước sau).

## Việc còn lại

- Một số khối thống kê/điểm mẫu cũ trong HTML (nhất là trò chơi, bảng xếp hạng và góc giáo viên) chưa được dọn hết; JavaScript hiện thay các khối chính bằng dữ liệu API sau khi tải. Cần dọn triệt để trước khi phát hành demo.
- Cần kiểm tra trực quan luồng học sinh/giáo viên ở bước review ngoài sandbox như brief quy định.
