# Báo cáo M3 — Đố nhanh bảng 6–9

Ngày: 21/10/2026. Chỉ triển khai M3 trong `briefs/mvp.md`; giữ nguyên nhánh hiện tại, không commit, không thêm dependency, không thực hiện M4.

## Kết quả triển khai

- Module UMD `MathQuickQuiz` dùng được qua `require` trong Node và biến toàn cục trong trang web. Chuyển `seededRandom`, `nextGameQuestion` và hàm xáo trộn từ `../hoang-mai-math/src/lib/game/questions.ts`, giữ thứ tự gọi PRNG và cách tính đáp án/nhiễu/fact của nguồn.
- Bóng bay có màn chọn bảng 6/7/8/9/trộn, nhân/chia/cả hai, 60/90 giây. Đồng hồ bắt đầu sau khi bấm bắt đầu; ván chạy đến hết thời gian hoặc kết thúc thủ công. Chữ màn chọn ≥18px, select/nút ≥48px, label gắn với select, có focus bàn phím. Giữ hình bóng bay, bầu trời, phi thuyền và cột chọn trò chơi hiện có.
- Mỗi câu nhận một lần chọn; đúng cộng 30 điểm. Dừng timer và chuyển câu khi kết thúc, chặn bấm muộn/bấm lặp. Kết quả liệt kê đáp án em đã chọn sai cùng `fact` do bộ sinh nguồn trả về; có trạng thái chưa trả lời/không có câu sai và nút chọn ván mới.
- Lưu qua `MathGameScore.finish('game-bong-bay', ...)` như trước. Thêm tùy chọn `showResult: false` để M3 hiển thị phần chữa riêng; mặc định các trò khác vẫn hiện panel cũ. Không thêm bảng xếp hạng so sánh học sinh.
- Không đọc/sửa nội dung file trong `data/` ngoài `data/content`; không sửa repo nguồn hoặc dữ liệu nội dung.

## Đối chiếu nguồn

Đã đọc `questions.ts`, `questions.test.ts` và `rounds.ts` trong thư mục game của repo nguồn. Fixture được lấy bằng cách chạy trực tiếp `questions.ts` qua `node:module.stripTypeScriptTypes` và `node:vm`, chỉ bỏ kiểu TypeScript và từ khóa export; không lấy kết quả từ module vừa chuyển. Node v24.19.0 in cảnh báo `ExperimentalWarning: stripTypeScriptTypes is an experimental feature and might change at any time`; lệnh sinh fixture kết thúc mã 0. File được ghi bằng Python `encoding='utf-8'`.

`test/quick-quiz-fixtures.json` giữ trọn 12 câu (key, stem, answer, fact, options) cho mỗi cấu hình:

| Seed | Bảng | Phép | Key đầu tiên |
| --- | --- | --- | --- |
| 12345 | 6 | multiply | multiply:6:1 |
| 2026 | 9 | divide | divide:9:1 |
| 42 | mixed | both | multiply:7:1 |

Giữ đúng ngoại lệ của nguồn: một bảng + một phép chỉ có 10 câu; câu 11 phải dùng lại câu cũ nhất. Không lặp trong 10 câu đầu; khi dung lượng lớn hơn 10, tránh toàn bộ 10 câu gần nhất. Test kiểm tra cả trường hợp này qua 100 câu cho mỗi cấu hình.

## Kiểm tra theo log thực tế

| Trạng thái | Lệnh/kiểm tra | Kết quả |
| --- | --- | --- |
| PASS | `node --test --test-isolation=none test/quick-quiz.test.js` | 22 tests, 22 pass, 0 fail; mã 0. Gồm đối chiếu nguồn, 15 cấu hình, dãy tất định, đáp án/nhiễu, tránh lặp, UMD, vòng đời ván, bấm lặp/bấm muộn, lưu điểm và tương thích panel cũ. |
| PASS | `node --check public/assets/js/core/quick-quiz.js` | Mã 0, không lỗi cú pháp. |
| PASS | `node --check public/assets/js/pages/game.js` | Mã 0, không lỗi cú pháp. |
| PASS | `node --check public/assets/js/core/game-score.js` | Mã 0, không lỗi cú pháp. |
| PASS | `node --check test/quick-quiz.test.js` | Mã 0, không lỗi cú pháp. |
| PASS | `npm run build:demo` | Mã 0: `Demo build: 15 trang, data/grade3.json, .nojekyll`. `dist/` là đầu ra bị gitignore. |
| PASS | Python `html.parser` kiểm tra lồng thẻ `public/game.html`, `dist/game.html` | Thẻ đóng/mở cân bằng; đây là kiểm tra cấu trúc, không phải kiểm tra hiển thị. |
| PASS | `git diff --check` | Mã 0; có cảnh báo Git đổi LF thành CRLF khi chạm file `game.js` và `.gitignore`. |
| NOT RUN | `npm test` | Đã gọi, lệnh thoát mã 1: runner không tạo được tiến trình con cho 11 file test, báo `Error: spawn EPERM`, `errno: -4048`, `code: 'EPERM'`, `syscall: 'spawn'`. Các ca của suite đầy đủ chưa chạy; không kết luận PASS/FAIL của logic từ lỗi sandbox này. |
| NOT RUN | Trình duyệt/Playwright và thử tay server/demo ở 768×1024, 1024×768 | Không chạy theo yêu cầu; kiểm thử UI trong Node dùng DOM giả, không xác nhận kích thước hiển thị thực tế. |

Đã dùng truy vấn UX cục bộ `touch target form labels` và rà code mới theo checklist `web-design-guidelines`; kích thước 18px/48px lấy theo yêu cầu dự án. Lỗi cấu hình ban đầu trong script kiểm tra HTML (xử lý thẻ tự đóng `meta`) đã sửa trong script kiểm tra và chạy lại PASS.

PASS kiểm tra tĩnh sau build: ID không trùng, đủ 4 nút/nhãn đáp án và đúng thứ tự script trong `public/game.html`, `dist/game.html`; ba script M3 trong dist trùng byte với bản public.

## File thay đổi

1. `public/assets/js/core/quick-quiz.js` — mới, bộ sinh UMD.
2. `public/assets/js/pages/game.js` — cấu hình, thời gian, câu hỏi, đáp án, chữa và lưu điểm.
3. `public/assets/js/core/game-score.js` — tùy chọn tắt panel mặc định.
4. `public/game.html` — màn chọn/kết quả và kết nối UI bóng bay với module mới; CSS riêng trang, không rebuild CSS chung của M4.
5. `test/quick-quiz.test.js` — mới, 22 ca kiểm thử.
6. `test/quick-quiz-fixtures.json` — mới, 36 câu đầu ra từ code nguồn.
7. `briefs/mvp-m3-report.md` — báo cáo này.

Lúc rà cuối có thay đổi `.gitignore` xuất hiện từ bên ngoài lượt triển khai M3; không chỉnh hoặc hoàn tác thay đổi đó. File này không thuộc danh sách M3 ở trên.

## Việc còn lại

- Claude chạy lại `npm test` ngoài sandbox để xác nhận toàn bộ suite và API server.
- Claude rà giao diện tại hai kích thước yêu cầu, kiểm tra bàn phím/vùng chạm/chữ và thử lưu điểm, chọn lại cấu hình, hết giờ, phần chữa trên server và `dist/`.
- Claude review và commit sau. M4 để task riêng; chưa mở PR hoặc deploy.
