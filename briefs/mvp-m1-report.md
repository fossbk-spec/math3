# Báo cáo M1 — 21/10/2026

Phạm vi: chỉ M1 trong `briefs/mvp.md`. Đã đọc `AGENTS.md`. Không tạo nhánh, không commit, không thêm dependency; không sửa `../hoang-mai-math`, `original-backup/` hoặc mở trình duyệt/Playwright.

## Thay đổi

- Import gắn `skillId`, `cognitiveLevel`, trạng thái `DRAFT` cho câu hỏi; phiếu dùng kỹ năng đầu tiên của bài trong curriculum, câu bank giữ kỹ năng/mức nguồn, câu kiểm tra kế thừa metadata câu gốc.
- Sinh lại `data/content/grade3.json` bằng script: 7 bài, 17 bộ, 233 câu tổng cộng (221 câu trong bộ, 12 câu ôn tiền đề ngoài bộ). Có 4 kỹ năng, tiền đề được lọc, `practicePool` gồm 213 ID câu luyện tập, `feedbackRules` giữ nguyên nguồn và `reviewStatus`.
- Thêm `practiceQuestions` chứa 12 câu bank `g3.number.tables` để ID trong pool có đối tượng dữ liệu tra cứu được mà không đưa vào bộ bài nào. Đây là dữ liệu chuẩn bị; chưa thêm logic/API luyện tập thích ứng của M2.
- Phiếu nhận `?lesson=&set=`, gọi API bộ câu hỏi; mặc định chọn bộ cơ bản của bài chưa hoàn thành đầu tiên có bộ này và không bị khóa. Khi tất cả bài phù hợp đã hoàn thành, chọn bộ cơ bản đầu tiên; mã bài/bộ không hợp lệ hiện lỗi và khóa nút nộp.
- `question-view.js` là renderer UMD chung cho lesson/exercise, giữ các loại câu hỏi và gợi ý từng bước từ dữ liệu. Bỏ câu hỏi, đáp án, tiến độ điền sẵn; giữ khung trang, đồng hồ, trợ giúp và modal kết quả. Có trạng thái đang tải/đang nộp, tiến độ theo câu đã trả lời và nút làm lại.
- Exercise và exam gửi thời gian từ `Date.now() - startedAt`; lesson đã dùng cách này nên giữ nguyên phép tính hiện có. Làm lại phiếu chỉ xóa lựa chọn/gợi ý trên trang, không xóa lượt đã lưu hay đặt lại thời gian mở trang.
- Bỏ `phieu-bai-9-10` khỏi seed; cập nhật test API. Các link bộ luyện tập ở mục lục và menu “Luyện Tập & Kiểm Tra” mở exercise; link kiểm tra riêng vẫn mở exam.
- Bổ sung test metadata/pool/nguồn, HTML không còn câu cứng, API demo, luồng phiếu bằng VM và so khớp danh sách câu demo/server trong test API.

## Kiểm tra theo log thực tế

| Kiểm tra | Trạng thái | Kết quả |
| --- | --- | --- |
| `node tools/import-hoang-mai.js ../hoang-mai-math` | PASS | Exit 0; 7 bài, 17 bộ, 233 câu. Script vẫn bỏ qua 111 câu cần giáo viên và 5 câu dạng multi chưa hỗ trợ như trước. |
| `npm test` | NOT RUN | Đã gọi lệnh, exit 1. Runner báo 6 file fail, pass 0 do không spawn được tiến trình test: `Error: spawn EPERM`, `errno: -4048`, `code: 'EPERM'`, `syscall: 'spawn'`. Nội dung test chưa chạy bằng lệnh chuẩn; không kết luận PASS. |
| Test không cần spawn, lệnh dưới bảng | PASS | 18 tests, pass 18, fail 0, skipped 0; exit 0. |
| `node --test --experimental-test-isolation=none test/api.test.js` | NOT RUN | Exit 1; `Error: spawn EPERM` tại `test/api.test.js:13:18` khi mở server con. Chưa xác minh API server hoặc so khớp demo/server thực tế. |
| `node --check` cả 10 file JS sửa/thêm | PASS | Từng file exit 0, danh sách bên dưới. |
| `npm run build:demo` | PASS | Exit 0; `Demo build: 14 trang, data/grade3.json, .nojekyll`. |
| `git diff --check` | PASS | Exit 0; chỉ có cảnh báo Git LF sẽ chuyển thành CRLF cho grade3.json và exercise.js. |
| Trình duyệt, Playwright, rà hai kích thước và thử tay dist | NOT RUN | Theo yêu cầu để Claude chạy sau. |

Lệnh test thay thế đã PASS:

```text
node --test --experimental-test-isolation=none test/import.test.js test/m1.test.js test/demo-api.test.js test/grading.test.js test/analytics.test.js
```

Các file đã kiểm tra cú pháp:

```text
tools/import-hoang-mai.js
public/assets/js/core/question-view.js
public/assets/js/components/sidebar.js
public/assets/js/pages/lesson.js
public/assets/js/pages/exercise.js
public/assets/js/pages/exam.js
public/assets/js/pages/index.js
test/api.test.js
test/m1.test.js
test/helpers/demo.js
```

Đã dùng truy vấn skill cục bộ `ui-ux-pro-max` với `form loading feedback --domain ux`: áp dụng phản hồi khi tải/nộp và trạng thái thành công/lỗi. Không mở PR trong phiên này.

## Danh sách file sửa/thêm

1. `tools/import-hoang-mai.js`
2. `data/content/grade3.json` — chỉ sinh bằng script.
3. `data/seed.json`
4. `public/exercise.html`
5. `public/lesson.html`
6. `public/assets/js/core/question-view.js` — mới.
7. `public/assets/js/components/sidebar.js`
8. `public/assets/js/pages/exercise.js`
9. `public/assets/js/pages/lesson.js`
10. `public/assets/js/pages/exam.js`
11. `public/assets/js/pages/index.js`
12. `test/api.test.js`
13. `test/m1.test.js` — mới.
14. `test/helpers/demo.js` — mới.
15. `briefs/mvp-m1-report.md` — mới.

`dist/` là đầu ra build bị Git bỏ qua. File DOCX có sẵn chưa được theo dõi trong thư mục data được giữ nguyên, không đọc. Đã dọn ba file pycache sinh bởi truy vấn skill trong phiên này.

## Việc còn lại

- BLOCKED trong sandbox: xác minh toàn bộ `npm test` và test API server/demo cùng danh sách câu. Claude cần chạy lại ngoài sandbox; test đối chiếu đã được thêm, chưa thể khẳng định kết quả.
- NOT RUN: Claude rà giao diện 768×1024, 1024×768 và luồng học sinh trên dist, đặc biệt modal bài chữa dài, gợi ý từng bước và thao tác bàn phím.
- Seed chỉ ảnh hưởng bộ nạp mới: DB cũ có thể còn bộ legacy vì cơ chế `INSERT OR IGNORE` hiện có; M1 không tự xóa dữ liệu/lượt làm trong DB. Không trang nào còn gửi bộ legacy.
- Nguồn hiện không sinh `bai-14-co-ban`; chọn mặc định bỏ qua bài không có bộ cơ bản, bộ nâng cao/luyện thêm của bài 14 vẫn mở được qua link bộ cụ thể. Không tự thêm câu hoặc đáp án.
- M2–M4 chưa thực hiện; các sửa chữ, vùng chạm, favicon và dải thống kê toàn ứng dụng tiếp tục thuộc M4.
