# Báo cáo M1 — Gợi mở 3 bước và thích ứng theo nhịp

Ngày 23/10/2026. Nhánh `feat/goi-mo-thich-ung`. Không commit; brief đã duyệt được giữ nguyên.

## Đã làm

- Tool nhập xác thực SHA256 H1 trên nội dung LF (ba file checkout trên Windows là CRLF), chép vendor và luật, đổi dạng câu và sinh lại `grade3.json`. Log: **240 câu H1 nhập, 24 câu bỏ, 240 câu có verification**; tổng nội dung 473 câu. Câu nhập giữ `DRAFT`.
- Lõi server và bản tĩnh dùng chung `practice.answer/complete`, `MathGrading` và gói `HMCoach`: đọc đề, dẫn dắt theo lỗi, che số cuối, tối đa hai lần điền số cuối. Sai ba lần vẫn tính sai. Lịch sử lưu `steps`, `errorTags`, `guided`, `guidedTries`; DB có migration bổ sung cột JSON/trạng thái.
- Bộ chọn câu gọi `HMCoach.selectNextCore`; lý do hiện cho học sinh được thay bằng câu chung khi A08, nhãn lỗi ở trace. Mô phỏng 5 kiểu học sinh, mỗi kiểu 30 câu: nhóm nhanh lên mức 3; nhóm chậm gặp A04-HOLD/SUPPORT; lỗi cộng thay nhân lặp lại gặp A08 ở câu 23–27; nhóm mở gợi ý và ngẫu nhiên hoàn thành 30 câu.
- Trang luyện tập có khối “Bạn Cú gợi ý”, bước 1 tô đậm số/từ khóa, bước 2 câu dẫn dắt, bước 3 ô điền số; nút đọc đề dùng giọng `vi-VN` nếu có. Bố cục hai cột cho desktop, một cột ở màn hình hẹp. Có [kịch bản giáo viên](../docs/kiem-thu-goi-mo.md).

## Kiểm tra

| Trạng thái | Lệnh / phạm vi | Kết quả theo log |
|---|---|---|
| PASS | `node tools/import-hoang-mai.js` | 240 nhập, 24 bỏ, 240 verification; SHA256 đúng sau chuẩn hóa CRLF→LF. |
| PASS | `node --test --test-isolation=none` trên mọi file trừ `api.test.js` | 74/74 test pass, gồm server/bản tĩnh cùng kết quả, quét toàn practicePool không lộ đáp số trong gợi ý, sai hash, A04, A08, bước cuối đúng/sai. |
| PASS | `node --check` 16 file JS mới/sửa | 16/16 pass. |
| PASS | `npm run build:css`, `npm run build:demo` | CSS build xong; demo 15 trang. |
| PASS | `node tools/hoc-sinh-ao.js` | 5 kiểu × 30 câu, bảng Markdown và `paceBySkill`; A08 xuất hiện. |
| PASS | `git diff --check` | Không có lỗi whitespace (Git chỉ cảnh báo chuyển LF/CRLF). |
| BLOCKED | `npm test` | `node --test` mặc định báo `spawn EPERM` cho 12 file trong sandbox. Chạy cách không tạo tiến trình con như trên. |
| BLOCKED | `test/api.test.js` trong chế độ `--test-isolation=none` | Test cũ tự gọi `child_process.spawn`, cũng nhận `spawn EPERM`. |
| NOT RUN | Playwright ở 1366×768, 1920×1080, 1024×768, 768×1024; quét tên thật trong `dist/` | Chưa kiểm tra trực quan/trên máy ngoài sandbox; cần bước review của Claude theo brief. Không đọc CSV/DOCX thật. |

Không thêm dependency; không gọi LLM; không sửa tay `data/content/grade3.json`; không sửa repo `hoang-mai-math`.

## Claude kiểm tra ngoài sandbox (23/10)

| Kiểm tra | Kết quả |
|---|---|
| `node tools/import-hoang-mai.js` từ `main` của hoang-mai-math (`9eee36a`, sau khi H1 merge) | PASS: sha256 khớp manifest; bỏ 111 câu phiếu cần giáo viên và 5 câu `multi` |
| `npm test` | PASS 75/75 |
| `node --check` các file JS đã sửa hoặc thêm | PASS |
| `build:css`, `build:demo` | PASS |
| `tools/hoc-sinh-ao.js` | PASS: tiếp thu nhanh lên mức 3 sau 4 câu, "vững sau 4 câu"; tiếp thu chậm có A04-HOLD trước khi hạ; lặp lỗi "cộng thay vì nhân" kích hoạt A08 ở câu 23–27 (sớm hơn thì chưa, vì chỉ khoảng 1/4 số câu của kỹ năng là phép nhân có nhãn) |
| Playwright 1366×768, 1920×1080, 1024×768: sai 3 lần câu "Tính 9 × 4." | PASS. Bước 1 tô đậm 9, 4. Bước 2 "9 × 4 nghĩa là 4 nhóm, mỗi nhóm 9…". Bước 3 "9 × 4 = ?". Không hiện "Đáp án:". Không tràn ngang, không chữ < 18px, không lỗi JS |
| Tự hoàn thành | Điền sai → "em thử điền lại"; điền 36 → "Em đã tự hoàn thành lời giải!", hiện nút câu tiếp |
| Quét lộ họ tên lớp 3A2 | NOT RUN: máy này không có file CSV lớp. M1 không đụng `class-3a2.json` hay `make-class.js` (`git diff` rỗng) |

**Claude sửa thêm (máy tính là thiết bị chính):** header các trang học sinh cao 184–328px ở 1280–1920px. Lỗi này có từ U1/U2, bản đang chạy cũng bị: thanh điều hướng ngang với chữ ≥ 18px không vừa khung 1280px, chip "Chưa xếp hạng" bị dồn thành cột chữ dọc. Sửa trong `app.css`: trang có nút Menu thì dùng Menu ở mọi kích thước, ẩn thanh ngang và chip xếp hạng. Header nay **80px** ở 1024–1920px (index, practice, lesson, game).

Còn lại: header trang `exam.html` (không có nút Menu) cao 221–298px; chưa sửa trong PR này.
