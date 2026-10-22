# Báo cáo M2 — sao, câu trùng, 10 câu mỗi bài, 1 điểm mỗi câu, chọn lại trắc nghiệm, gợi ý mới

Ngày 23/10/2026. Codex làm phần đầu rồi hết hạn mức (05:00). **Chủ nhiệm cho Claude làm tiếp**, Codex review lại sau. Dữ liệu nhập từ gói H3 (hoang-mai-math PR #55).

## Đã làm

| Yêu cầu | Kết quả |
|---|---|
| Sao không tăng | **Nguyên nhân chính:** chip ☆ trên header mọi trang (trừ trang chủ) là số "0" viết sẵn trong HTML, không bao giờ cập nhật; luyện tập thích ứng không cộng sao. **Sửa:** `navbar.js` lấy tổng sao thật và nghe sự kiện `math:stars`; luyện tập: câu đúng +1, tự hoàn thành bước 3 +1, mỗi câu tối đa một lần; bộ bài tập: lần đầu được ít nhất 1 sao cho mỗi câu đúng, nộp lại chỉ cộng phần chênh; trò chơi và bộ bài tập cũng báo header. Quy tắc nằm một chỗ (`core/stars.js`), dùng chung server và bản tĩnh |
| Câu trùng trong một bài | Bỏ câu trùng đề (so `prompt` đã chuẩn hoá) ở mọi bộ và đề kiểm tra; phiên luyện tập không ra lại câu cùng đề |
| 10 câu mỗi bài | Mọi bộ bài tập đúng 10 câu: thừa thì chọn luân phiên theo dạng, thiếu thì bù câu tự sinh cùng bài và mức. Đề kiểm tra giữ 20 câu |
| 1 điểm mỗi câu | `points = 1` ở chấm chung, bản tĩnh, server và thêm/sửa câu |
| Gợi ý sát hơn | Nhập lại gói H3: mọi bộ bài tập trừ `bai-15-nang-cao` (3/10 câu) có đủ gợi ý 3 bậc theo số trong câu |
| Fix 1 | Trắc nghiệm, so sánh: sai 3 lần thì **chọn lại** (không lộ đáp án) |
| Fix 2 | Câu phiếu GV có phép tính, gợi ý, lời giải; trắc nghiệm nhận lỗi theo phương án em chọn (math3 đổi chữ cái A–D sang nội dung phương án trước khi gọi lõi) |
| Fix 3 | A08 xét 5 lượt có nhãn gần nhất (trong lõi H3) |

Claude sửa thêm:
- Đưa `stars.js` vào bản tĩnh.
- Lỗi gửi sự kiện sao làm hỏng số lần thử: sự kiện được gửi trước khi tăng `attemptNo`. Nay bọc `try/catch`.
- Gói H3 ghi `goi-mo-rules.json` dạng LF, để sha256 khớp trên Windows.
- Cập nhật các test cũ theo hành vi mới; thêm `test/stars.test.js`.

## Kiểm tra (Claude, ngoài sandbox)

| Kiểm tra | Kết quả |
|---|---|
| `node tools/import-hoang-mai.js` (gói H3) | PASS: 16 bộ bài tập × 10 câu, đề kiểm tra 20 câu, không trùng |
| `npm test` | PASS 77/77 |
| `node --check`, `build:css`, `build:demo` | PASS |
| Edge 1366×768: luyện tập trả lời đúng | Chip ☆ header 0 → 1 ngay, không lỗi JS |
| Edge 1366×768: câu trắc nghiệm "7 × 7", sai 3 lần | Bước 1 đọc đề → bước 2 "Em tính 7 × 7…" → bước 3 chọn lại, không hiện "Đáp án:" → chọn đúng: "Em đã tự hoàn thành lời giải!" |

Còn lại:
- `bai-15-nang-cao` mới có gợi ý 3 bậc ở 3/10 câu (câu phiếu dạng khác).
- Câu trắc nghiệm có lời giải một bước nên bước 3 chỉ còn câu nhắc chọn lại.
- Giao diện chưa chỉnh (theo yêu cầu chủ nhiệm).
