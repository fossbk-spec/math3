# Báo cáo U2 — làm mới giao diện

## Việc đã làm

- Chín trang U2 dùng cùng liên kết Google Fonts Nunito 700/800 + Nunito Sans, `display=swap`, và `favicon.ico`; bỏ Quicksand. Nạp Material Symbols cho `thong-ke.html` để footer hiển thị biểu tượng.
- Bốn trò chơi dùng token, thẻ `clay-card` và menu chung U1; menu trong lúc chơi có màu trung tính. Nâng nhãn nhỏ trong HTML và nội dung được tạo bởi `game3.js` lên tối thiểu 18px; CSS U2 giữ chữ học sinh tối thiểu 18px và vùng chạm của nút/liên kết từ 48px. Nút “Kết thúc & Lưu điểm” dùng `clay-btn`. Màn kết quả lưu điểm chung và màn kết quả đố nhanh dùng `clay-card` với sao vàng. Dữ liệu đưa vào HTML của màn kết quả chung được escape.
- `leaderboard`, `schedule`, `ai-safe`, `introduce` dùng lại token, thẻ/nút clay. Không thêm phép so sánh hoặc xếp hạng học sinh. `thong-ke` chỉ đổi màu/chữ, giữ bố cục và hook.
- Không đổi ID, `data-*`, tên hàm, API, dữ liệu, cách tính điểm; không thêm dependency.

## File đã đổi

`public/{game,game2,game3,game4,leaderboard,schedule,ai-safe,introduce,thong-ke}.html`, `public/assets/css/app.css`, `public/assets/css/tailwind.build.css`, `public/assets/js/components/navbar.js`, `public/assets/js/core/game-score.js`, `public/assets/js/pages/{game3,ai-safe,leaderboard}.js`, `briefs/ui-refresh-u2-report.md`.

`dist/` được tạo lại bởi build demo; không commit/push.

## Kiểm tra

| Kiểm tra | Kết quả | Log/kết quả |
|---|---|---|
| `npm run build:css` | PASS | Tailwind tạo `public/assets/css/tailwind.build.css` (80 KB). Có cảnh báo `caniuse-lite` cũ, build trả mã 0. |
| `npm run build:demo` | PASS | `Demo build: 15 trang, data/grade3.json, .nojekyll`; trả mã 0. |
| `node --check` 5 file JS đã sửa | PASS | `navbar.js`, `game-score.js`, `game3.js`, `ai-safe.js`, `leaderboard.js` đều trả mã 0. |
| `npm test` | FAIL | 12/12 file test dừng trước khi chạy ca vì `spawn EPERM` trong sandbox; 0 ca pass. |
| `node --test --test-isolation=none test/quick-quiz.test.js test/practice.test.js test/question-view.test.js` | PASS | 29/29 ca pass, 0 fail. |
| Giữ ID/`data-*` trong 9 HTML | PASS | So tập thuộc tính với `HEAD`: không có ID hoặc `data-*` thêm/bớt. |
| `git diff --check` | PASS | Không có lỗi whitespace; Git chỉ cảnh báo quy đổi LF/CRLF. |
| Font, favicon, cỡ chữ tĩnh | PASS | Cả 9 trang có đúng một liên kết Nunito/Nunito Sans và favicon, không còn Quicksand; 4 HTML trò chơi không còn class chữ 10–16px. |
| Trình duyệt 768×1024, 1024×768 và luồng bàn phím | NOT RUN | Theo yêu cầu không chạy trình duyệt; chưa xác nhận trực quan việc tràn ngang, tương phản ở mọi trạng thái hoặc hành vi focus. |

## Rà theo `web-design-guidelines`

- PASS trong mã nguồn: cả 9 trang có skip link; các nút được sửa có chiều cao tối thiểu 48px; focus ring chung 3px; màn kết quả dùng `role="status"` và `aria-live="polite"`; CSS chung tôn trọng `prefers-reduced-motion`; các lựa chọn AI Safe dùng nút thật, phản hồi có `aria-live`.
- `public/game2.html`, `public/game3.html`, `public/game4.html`: một số liên kết `href="#"` và các biểu tượng trang trí cũ chưa có `aria-hidden`; cần rà lại điều hướng và trình đọc màn hình khi kiểm tra bằng trình duyệt. Không thêm liên kết rời trang nổi bật trong lúc chơi.
- `public/schedule.html`: một số class `transition-all` cũ và nhãn điều khiển trong phần giáo viên cần kiểm tra tương tác bàn phím; phần này không đổi nghiệp vụ.
- NOT RUN: kiểm tra bằng trình duyệt cho layout tablet, focus dưới header cố định, nội dung dài và tương phản thực tế.

## Việc còn lại

- Chạy `npm test` ngoài sandbox có quyền tạo tiến trình con.
- Kiểm tra Edge tại 768×1024 và 1024×768, gồm bốn trò chơi, kết quả sau lưu điểm, trang phụ và footer thống kê; rà các mục chưa xác nhận ở trên.

## Vòng sửa U2b

- `game.html`: nút “Bắt đầu chơi bóng bay” dùng `clay-btn clay-btn--sun`, có nền vàng, viền và chiều cao tối thiểu 48px. Rà mã nguồn: nút kết thúc và chơi lại vẫn dùng `clay-btn`; bốn nút đáp án vẫn có nền bóng màu, `data-quiz-option` có vùng chạm tối thiểu 48px.
- `game3.html`: chuyển hướng dẫn lật thẻ xuống hàng riêng phía trên lưới; bỏ `truncate` ở bốn nhãn thống kê, rút nhãn đồng hồ thành “Thời gian”, đặt chip “Ghép các cặp thẻ” dưới số lượt; tăng mười ô số góc thẻ từ `w-5 h-5` lên `w-7 h-7`. Cỡ chữ chính của mười thẻ tĩnh và thẻ do `game3.js` lật là 30px tại 768px, 32px từ breakpoint `sm`.
- Rà `game2.html`, `game4.html`: `game2` có tiêu đề dùng `truncate`, đã cho phép xuống dòng. Không thấy ô số góc thẻ hay nhãn `truncate` cùng kiểu trong `game4`; không sửa trang này.

| Kiểm tra U2b | Kết quả | Log/kết quả |
|---|---|---|
| `npm run build:css` | PASS | Tạo `public/assets/css/tailwind.build.css` (80 KB), mã thoát 0; cảnh báo `caniuse-lite` cũ. |
| `node --check` 5 file JS đang thay đổi | PASS | `navbar.js`, `game-score.js`, `game3.js`, `ai-safe.js`, `leaderboard.js`: 5/5 trả mã 0. |
| `npm test` | FAIL | 12/12 file test dừng trước khi chạy ca vì `spawn EPERM` trong sandbox; 0 ca pass. |
| `node --test --test-isolation=none test/quick-quiz.test.js test/practice.test.js test/question-view.test.js` | PASS | 29/29 ca pass, 0 fail. |
| `git diff --check` | PASS | Không có lỗi whitespace; Git chỉ cảnh báo LF/CRLF. |
| Rà mã nguồn các lỗi nêu trên | PASS | Không còn `w-5 h-5`, `text-headline-sm sm:text-headline-lg` hoặc `truncate` trong `game3.html`; các nút quiz có nền/viền theo lớp hiện có. |
| Kiểm tra trực quan Edge 768×1024 và 1024×768 sau U2b | NOT RUN | Chưa chụp lại hai viewport trong vòng sửa này. |

## Rà soát của Claude (ngoài sandbox)

| Kiểm tra | Kết quả |
|---|---|
| `npm test` | PASS 70/70 |
| `npm run build:css`, `npm run build:demo` | PASS |
| Edge 768×1024, 1024×768: tràn ngang ở 8 trang U2 | PASS (không tràn) |
| Chữ < 18px (đếm phần tử có chữ) | game 21→2, game2 10→2, game3 82→2, game4 46→2, leaderboard 9→2, introduce 9→2; 2 phần tử còn lại là footer chung (U1) |
| Footer `thong-ke.html` (vai giáo viên) | PASS: hiện biểu tượng, không còn tên icon |

Sửa thêm khi rà: quy tắc chữ tối thiểu 18px trong `app.css` có độ ưu tiên cao hơn class Tailwind nên ép số trên thẻ game3 về 18px → bọc bằng `:where()`; đổi các class cỡ chữ nhỏ còn lại (`text-label-md/-sm`, `text-body-sm`, `text-[11–12px]`) sang `text-lg` trên trang U2.

Còn lại (đã có từ trước U2): ảnh con ong che ô "Thời gian" ở `game.html` 768px; thẻ cá che đề "Thử thách bảng chia" và nhãn "Mồi câuSẵn sàng" thiếu dấu cách ở `game4.html`; chữ footer chung 15px.
