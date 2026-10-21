# Báo cáo M2 — Luyện tập thích ứng

Ngày 21/10/2026. Chỉ thực hiện M2 trên nhánh hiện tại; không commit, tạo nhánh, thêm dependency, làm M3–M4 hoặc sửa repo `../hoang-mai-math`.

## Sửa 5 lỗi sau rà Edge của Claude

Theo thông tin chủ nhiệm cung cấp, Claude đã chạy `npm test` **41/41 PASS** và thử Edge 768×1024 trước đợt sửa này. Kết quả đó không thay thế kiểm tra sau sửa dưới đây.

1. `practice.html` dùng nguyên khung head/header của `exercise.html`: Nunito Sans, Quicksand, Material Symbols, `tailwind.build.css`, `app.css`, skip-link đúng class, các script sidebar/navbar/footer và footer dùng chung. Bỏ CSS tổng quát ghi đè header/nav/button; CSS riêng giới hạn ở nội dung practice. Font tiêu đề có fallback sans-serif.
2. `MathQuestionView.render` nhận tham số thứ năm `{ hideLabel: true }`. Chỉ practice bật tuỳ chọn này; exercise/lesson mặc định giữ nhãn số câu/điểm. Input của practice có aria-label “Đáp số”, không nhắc sai “câu 1”. Có test cả mặc định và ẩn nhãn.
3. `MathQuestionView.formatAnswer` dùng chữ cái API trả và nội dung lựa chọn đã tải để hiển thị dạng `A. 54kg`. Practice dùng chung hàm cho phản hồi sau lần sai thứ ba và bài chữa cuối lượt; modal exercise cũng dùng hàm này, tra câu theo `questionId`. Không đổi đáp án hoặc logic chấm. Test định dạng mọi câu trắc nghiệm nhập từ dữ liệu, đáp án điền số, phản hồi/bài chữa practice và modal exercise.
4. Bỏ ghi chú TT27 khỏi HTML học sinh; lọc ghi chú khỏi lý do hiển thị cả khi có câu và khi hết câu A07. Học sinh chỉ thấy câu nhắc thân thiện. Trace/server vẫn giữ nguyên ghi chú; test adaptive và test màn hết câu đã PASS.
5. Nút thao tác practice dùng nền xanh đậm `#006127`, chữ trắng; `:enabled` có opacity 1 và cursor pointer, chỉ `:disabled` mới giảm opacity xuống .5. Không ảnh hưởng nút logout hoặc các nút chọn đáp án của renderer.

Không thêm utility Tailwind mới: so sánh class trong practice với exercise chỉ có hai class CSS thường mới `practice-shell`, `practice-actions`, đã khai báo trực tiếp trong trang. Đợt sửa này không cần `npm run build:css` và không sửa `tailwind.build.css`.

## Kết quả triển khai

- **PASS — logic và luồng đã kiểm thử:** chuyển các luật A01, A02, A03, A04, A05, A07 sang UMD thuần, tất định; bỏ A06. Giữ ghi chú không đánh giá năng lực/TT27 trong mọi `trace.reason`, kể cả hết câu. Chuyển các ca kiểm thử nguồn không thuộc A06 sang `test/adaptive.test.js`.
- **PASS — API server/demo:** dùng chung `core/practice.js`, chung bộ chấm `grading.js`. `practice/next` chỉ trả các trường câu hỏi công khai, không có đáp án/lời giải; `practice/answer` kiểm tra thứ tự lần thử, tối đa 3 lần và số gợi ý. Đáp án cùng bài chữa chỉ trả khi đúng hoặc hết lần thử. Câu đang làm được giữ khi gọi lại `next`.
- **PASS — lưu trữ:** migration `practice_attempts` lưu từng câu luyện theo học sinh, mức, số lần thử, gợi ý, kết quả và trạng thái hoàn tất; demo lưu tương ứng trong state localStorage. Server đọc nội dung/đáp án/trạng thái duyệt từ DB, tôn trọng `ALLOW_DRAFT` và câu bị từ chối. 12 câu tiền đề cũng được seed vào DB ở DRAFT bằng INSERT OR IGNORE.
- **PASS — luồng trang trong kiểm thử VM:** chọn bài, mỗi lần một câu, 10 câu/lượt, thử lại, đếm gợi ý, lời giải sau lần sai thứ ba, nhận xét và bài chữa cuối lượt. Menu học sinh và trang chủ có liên kết mới. Chưa xác nhận hiển thị thực tế bằng trình duyệt.
- **PASS — nhận xét:** server/demo truyền `feedbackRules` vào bộ chấm cho bài luyện tập; ngưỡng 80%/50%, nhãn và lời giáo viên được hiển thị trên practice, exercise và lesson. Đề kiểm tra giữ hành vi cũ. Tỷ lệ đúng cuối lượt tính câu đúng trong tối đa 3 lần thử; thống kê riêng số câu đúng ngay lần đầu; bài chữa gồm mọi câu từng trả lời sai.
- **PASS — sự kiện:** `practice_answer` chỉ chứa skillId, level, correct, attemptNo, hintsUsed, không chứa nội dung trả lời; có kiểm thử whitelist analytics.

## Log kiểm tra

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| `npm test` | **NOT RUN** | Đã gọi lệnh, exit 1 trước khi chạy các test: `Error: spawn EPERM`, `errno: -4048`, `code: 'EPERM'`, `syscall: 'spawn'` tại `node:internal/test_runner/runner:517:19`. Sandbox chặn tiến trình con; không kết luận bộ test đầy đủ pass/fail. |
| Các test không tách tiến trình, lệnh bên dưới | **PASS** | Sau sửa: Node v24.19.0, `tests 43`, `pass 43`, `fail 0`, `skipped 0`, exit 0. Bao gồm API server thực qua HTTP cục bộ với SQLite tạm, API demo, luồng trang bằng VM, renderer/định dạng đáp án/modal, adaptive, grading, analytics, import và hồi quy M1. |
| `node --check` mọi JS mới/sửa | **PASS** | Sau sửa: 22/22 file, mỗi lệnh exit 0. Danh sách JS đầy đủ ở phần file bên dưới. |
| `npm run build:demo` | **BLOCKED** | Sau sửa: exit 1 tại `tools/build-demo.js:6:4`, `fs.rmSync(dist, ...)`: `Error: EPERM, Permission denied`, path `D:\Antigravity\math3\dist`, `code: 'EPERM'`, `syscall: 'rm'`. Chưa build lại được dist của đợt sửa này. Không thay đổi script build hoặc cố xoá thư mục qua cách khác. |
| Kiểm tra mã HTML bằng Node | **PASS** | `PASS standard header, font/CSS links, components, skip-link and student markup`; header khớp nguyên exercise, các link font/CSS khớp, đủ sidebar/navbar/footer, skip-link và không có ghi chú TT27 trong HTML. `PASS no new Tailwind utilities: only native CSS classes practice-actions, practice-shell`. |
| `git diff --check` | **PASS** | Exit 0; chỉ có cảnh báo Git sẽ chuyển LF thành CRLF ở `exercise.js`. |
| Edge/Playwright, hai kích thước tablet và thử tay `dist/` | **NOT RUN** | Chưa rà lại sau sửa. Theo yêu cầu không mở trình duyệt/Playwright; Claude rà sau. VM không thay thế kiểm tra bố cục. |

Lệnh kiểm thử thay thế đã PASS:

```text
node --test --test-isolation=none test/adaptive.test.js test/practice.test.js test/practice-api.test.js test/grading.test.js test/demo-api.test.js test/analytics.test.js test/m1.test.js test/import.test.js test/question-view.test.js
```

Lệnh này không bao gồm `test/api.test.js` cũ vì file đó tự spawn server. Chưa xác nhận suite đầy đủ bằng `npm test` ngoài sandbox sau đợt sửa 5 lỗi. Bản M2 trước đợt sửa đã build demo PASS (`15 trang`) và Claude báo 41/41 test PASS; các kết quả lịch sử này không chứng minh dist hoặc suite đầy đủ sau sửa đã PASS.

## File mới/sửa

JS mới:

- `public/assets/js/core/adaptive.js`
- `public/assets/js/core/practice.js`
- `public/assets/js/pages/practice.js`
- `server/practice-api.js`
- `test/adaptive.test.js`
- `test/practice-api.test.js`
- `test/practice.test.js`
- `test/question-view.test.js`

JS sửa:

- `public/assets/js/components/navbar.js`
- `public/assets/js/components/sidebar.js`
- `public/assets/js/core/analytics.js`
- `public/assets/js/core/demo-api.js`
- `public/assets/js/core/grading.js`
- `public/assets/js/core/question-view.js`
- `public/assets/js/pages/exercise.js`
- `public/assets/js/pages/lesson.js`
- `server/api.js`
- `server/db.js`
- `test/analytics.test.js`
- `test/demo-api.test.js`
- `test/helpers/demo.js`
- `tools/build-demo.js`

HTML và báo cáo:

- `public/practice.html` — mới.
- `public/index.html` — thêm lối vào luyện tập thích ứng.
- `briefs/mvp-m2-report.md` — báo cáo này.

`dist/` là artifact bị gitignore; chưa build lại được sau đợt sửa 5 lỗi vì EPERM khi xoá thư mục. Không sửa `data/content/grade3.json`, `original-backup/`, dependency hoặc file Word có sẵn trong working tree.

File thay đổi trong riêng đợt sửa 5 lỗi: `public/practice.html`, `public/assets/js/core/question-view.js`, `public/assets/js/pages/practice.js`, `public/assets/js/pages/exercise.js`, `test/practice.test.js`, `test/question-view.test.js` (mới) và báo cáo này.

## Quy ước và việc còn lại

- “Tất cả bài đã học” dùng các bài có tiến độ hoàn thành; khi chưa hoàn thành bài nào, dùng bài đầu tiên đã mở. Chọn bài riêng dùng bài không bị khóa. Engine có thể chọn câu ôn kỹ năng tiền đề như luật A02.
- Nếu hết câu ở mức phù hợp trước câu thứ 10, kết thúc sớm và hiển thị lý do A07, không sinh câu mới hoặc nới cửa sổ không lặp. Nếu không có câu hoàn tất thì không gán nhận xét kết quả cho học sinh.
- Một số câu phiếu trong dữ liệu nguồn có `hints`/`solution` bằng null. Trang tắt nút gợi ý khi không có dữ liệu và hiển thị đáp án gốc khi chữa; chỉ hiển thị các bước giải nếu nguồn cung cấp, không tự soạn lời giải/đáp án mới.
- `feedbackRules.reviewStatus` vẫn là DRAFT như dữ liệu nguồn; không tự duyệt nội dung.
- Claude cần chạy lại **`npm test` và `npm run build:demo` ngoài sandbox**, kiểm tra luồng bằng trình duyệt ở 768×1024 và 1024×768, đặc biệt font/icon/skip-link/header/footer, màu enabled/disabled, số câu duy nhất, nội dung đáp án trắc nghiệm ở bài chữa/modal và không hiển thị TT27 kể cả lúc hết câu. Kiểm thử VM/API đã PASS không xác nhận bố cục thực tế.
- Nếu giáo viên từ chối câu đang làm, API chặn câu đó và yêu cầu thầy cô kiểm tra; không tự chuyển trạng thái duyệt.
- Không có FAIL trong 43 test đã chạy được. Điều kiện xác nhận toàn bộ `npm test` còn **BLOCKED bởi sandbox spawn EPERM**; build demo sau sửa **BLOCKED bởi EPERM khi xoá dist**; kiểm tra giao diện sau sửa còn **NOT RUN** theo phân công.
