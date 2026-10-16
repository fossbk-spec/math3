# Báo cáo T1b — 16/10/2026

## Việc đã làm

1. API câu hỏi trả thêm `hints` từ `hints_json`, không trả đáp án hay lời giải. Trang làm bài có nút **Gợi ý** mở lần lượt từng bước cho câu có gợi ý.
2. API bài học trả `page`; thẻ bài trang chủ hiện **SGK tập một, tr. N**.
3. Script import chép nguyên `content/grade3/ai-safe.json` vào `grade3.json` dưới khóa `aiSafe` (6 tình huống, `DRAFT`). Trang **Bảo vệ thông tin của em** có ba lựa chọn theo khóa `feedback`, hiển thị phản hồi và đánh dấu lựa chọn tốt nhất; có nhãn chờ giáo viên duyệt và liên kết từ menu/trang chủ. Lựa chọn học sinh chỉ nằm trong giao diện hiện tại, không lưu.

## File đã đổi

- API và import: `server/api.js`, `tools/import-hoang-mai.js`, `data/content/grade3.json` (tạo lại bằng lệnh import, không sửa tay).
- Giao diện: `public/assets/js/pages/lesson.js`, `public/assets/js/pages/index.js`, `public/assets/js/components/navbar.js`, `public/ai-safe.html`, `public/assets/js/pages/ai-safe.js`.
- Test: `test/api.test.js`, `test/import.test.js`.

Không thêm dependency; không commit.

## Kết quả kiểm tra theo log

- **PASS** `node tools/import-hoang-mai.js ../hoang-mai-math`: 7 bài, 17 bộ, 221 câu.
- **PASS** `npm test`: 4 test, 4 pass, 0 fail. Có kiểm tra `hints` trong API, không lộ đáp án/lời giải, và đối chiếu toàn bộ `aiSafe` với file nguồn.
- **PASS** `node --check`: 8/8 file JS đã sửa hoặc thêm.
- **PASS** Khởi động `server/index.js` với `DB_PATH` tạm; `/api/health` trả `ok: true`, DB tạm được tạo rồi dọn.
- **PASS** `git diff --check`: không có lỗi khoảng trắng.
- **NOT RUN** Kiểm tra trực quan trong trình duyệt/Playwright theo ràng buộc của task.
