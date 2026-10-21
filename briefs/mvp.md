# Brief MVP — đưa câu hỏi và chức năng chính của hoang-mai-math sang math3 (chủ nhiệm duyệt 21/10/2026)

Hạn: xong trước **23/10** để kịp hồ sơ dự thi 25/10. Đọc kèm `AGENTS.md` (quy tắc bắt buộc giữ nguyên).

## Phương án
Chuyển **logic thuần** của hoang-mai-math sang JS thuần trong math3, **không** chuyển hạ tầng (Next, Prisma, Google, Gemini).
Mỗi logic là **một module UMD dùng chung** cho server và bản demo tĩnh (giống `public/assets/js/core/grading.js`):
không viết hai lần. Dữ liệu lấy từ `data/content/grade3.json` do `tools/import-hoang-mai.js` sinh ra
(đáp án do code hoang-mai-math tính; không gõ đáp án tay, không lấy từ LLM).

Bản demo tĩnh (`npm run build:demo`, GitHub Pages) là sản phẩm trình diễn; chế độ server phải vẫn chạy và `npm test` pass.

Không làm: gia sư Cú dùng Gemini (cần server giữ khoá), đăng nhập Google, giao bài nhiều máy, Worker thống kê (A2, chờ token).

Mỗi task một nhánh, một PR. Thứ tự: M1 → M2 → M3 → M4.

## Rà giao diện 21/10 (Claude, Edge, 768×1024 và 1024×768) — căn cứ cho M1, M4
- Không tràn ngang, không lỗi JS; thiếu `favicon.ico` (404).
- **`exercise.html` viết cứng từ bản gốc, lộ đáp án:** 7 nút đáp án đúng được tô sẵn màu xanh (`bg-secondary-container`), 3 chấm tiến độ "đã xong" sẵn; bộ `phieu-bai-9-10` không lấy từ `grade3.json`. `exercise.js:140` gửi `durationSec: seconds - 342` trong khi đồng hồ chạy từ 0 → thời gian luôn 0.
- Chữ < 18px ở mọi trang học sinh: header chung (`Trường Tiểu học Hoàng Mai`, `Chưa xếp hạng`, `Bạn Cú` 13px, `Lớp 3A` 11px), chip/nhãn (`BÀI 9 • …`, `Luyện tập tự do`, `Tiến độ chủ đề`, `0% hoàn thành`), `game3`/`game4` có chữ 10–11px.
- Vùng chạm < 48px: `lesson.html` "Quay lại Mục Lục SGK" cao 22px; "Kết thúc & Lưu điểm" (4 trò chơi) 42px; nút quay lại ở `exercise` 38px; link "AI Safe & Smart" 38px.
- Dải "Web ghi nhận ẩn danh…" ghim đáy chiếm ~8% màn hình 1024×768.

---

## M1 — Ngân hàng câu có kỹ năng/mức + Phiếu bài tập lấy từ dữ liệu

1. `tools/import-hoang-mai.js`:
   - Gắn cho **mọi câu** `skillId` và `cognitiveLevel` (1–3). Câu tự sinh: giữ nguyên của bank. Câu phiếu: `skillId` = kỹ năng đầu tiên của bài trong `content/grade3/curriculum.json` (`lessons[].skills`); `cognitiveLevel`: `co-ban` → 1, `nang-cao` → 2. Đề kiểm tra giữ nguyên trường đã có.
   - Thêm khoá mới vào `grade3.json`:
     - `skills`: các kỹ năng lớp 3 có câu trong file (ít nhất `g3.number.tables`, `g3.number.tables-6-9`, `g3.number.find-component`, `g3.number.fraction-unit`) với `id, title, prerequisites` (chỉ giữ tiền đề có trong danh sách), lấy từ `content/grade3/skills.json`.
     - `practicePool`: id các câu dùng cho luyện tập thích ứng (mọi câu `exercise` có `skillId` thuộc `skills`, trừ đề kiểm tra). Thêm 12 câu bank của `g3.number.tables` vào pool (không thêm vào bộ bài nào) để luật ôn tiền đề có câu.
     - `feedbackRules`: nội dung `content/grade3/feedback-rules.json` (giữ `reviewStatus`).
   - Chạy lại script, cập nhật `data/content/grade3.json`. Không sửa file này bằng tay.
2. `exercise.html` + `pages/exercise.js`: bỏ toàn bộ câu hỏi viết cứng, chấm tiến độ viết cứng và trạng thái tô sẵn. Trang nhận `?lesson=&set=` (mặc định bộ `co-ban` của bài đầu tiên chưa xong), lấy câu qua `GET /api/question-sets/:id/questions` và hiển thị **dùng chung renderer** với `lesson.js` (tách renderer ra `public/assets/js/core/question-view.js`, không chép hai lần). Giữ khung giao diện, đồng hồ, gợi ý từng bước, modal kết quả.
3. Sửa `durationSec` = số giây thật từ lúc mở trang đến lúc nộp (exercise, kiểm tra lại exam và lesson).
4. Bộ `phieu-bai-9-10` trong `data/seed.json`: bỏ nếu không còn trang nào dùng; sửa `test/api.test.js` tương ứng.
5. Sidebar/link "Luyện tập" trỏ đúng trang mới.
6. Test: (a) mọi câu trong `grade3.json` có `skillId` thuộc `skills` và `cognitiveLevel` ∈ {1,2,3}; (b) `practicePool` chỉ chứa id tồn tại; (c) HTML `exercise.html` không còn class tô sẵn đáp án, không còn biểu thức câu hỏi cố định (`6 × 4`, `30 : 6`…); (d) API demo và server trả cùng danh sách câu cho một bộ.

## M2 — Luyện tập thích ứng + nhận xét theo ngưỡng giáo viên

1. `public/assets/js/core/adaptive.js` (UMD, thuần, tất định): chuyển `selectNext` từ `hoang-mai-math/src/lib/adaptive/index.ts` với các luật A01 tiếp tục, A02 ôn tiền đề (đúng < 50% trên ≥ 4 câu), A03 lên mức (2 câu liền đúng ngay lần đầu, không gợi ý), A04 hạ mức (sai ở lần 3 hoặc dùng ≥ 3 gợi ý), A05 không lặp 20 câu gần nhất, A07 hết câu. **Bỏ A06** (sinh câu từ template — math3 không có template). Trả `{ question, trace }`; `trace.reason` giữ câu "Đây là điều chỉnh mức hỗ trợ luyện tập, không phải đánh giá năng lực hay mức TT27."
2. Trang mới `practice.html` + `pages/practice.js` "Luyện tập thích ứng": chọn bài hoặc "Tất cả bài đã học"; mỗi lượt 10 câu, mỗi lần một câu, tối đa 3 lần thử/câu, nút gợi ý từng bước (đếm `hintsUsed`), sau câu sai lần 3 hiện lời giải. Cuối lượt: nhận xét theo `feedbackRules` + bài chữa các câu sai. Hiện cho học sinh một dòng thân thiện vì sao có câu này (rút gọn từ `trace.reason`). Thêm vào menu học sinh và trang chủ.
3. API (demo-api và server, cùng hợp đồng): `POST /api/practice/next` `{ lessonId? }` → câu (không kèm đáp án ở chế độ server) + `reason`; `POST /api/practice/answer` `{ questionId, answer, attemptNo, hintsUsed }` → `{ correct, solution? }`. Server lưu lượt làm vào bảng mới `practice_attempts` (migration trong `server/db.js`); demo lưu trong state `localStorage`.
4. `grading.js` `commentFor`: dùng ngưỡng từ `feedbackRules` (0,8 / 0,5 và lời nhận xét của giáo viên) thay mặc định 90/50; áp dụng cho mọi trang chấm bài (không phải đề kiểm tra).
5. Gửi sự kiện thống kê qua `MathAnalytics` nếu có (`practice_answer`: skillId, level, correct, attemptNo, hintsUsed — không gửi nội dung câu trả lời).
6. Test: chuyển các ca kiểm thử của `hoang-mai-math/src/lib/adaptive/adaptive.test.ts` (bỏ ca A06) sang `test/adaptive.test.js`; test nhận xét theo ngưỡng; test API practice ở cả hai chế độ; ở chế độ server `practice/next` không lộ `correctAnswer`.

## M3 — Trò chơi Đố nhanh bảng 6–9

1. `public/assets/js/core/quick-quiz.js` (UMD): chuyển `seededRandom`, `nextGameQuestion` từ `hoang-mai-math/src/lib/game/questions.ts` (bảng 6/7/8/9/trộn; nhân/chia/cả hai; đáp án nhiễu gần đúng; không lặp trong 10 câu).
2. `game.html` (Bóng Bay): thay phần sinh phép nhân trong `game.js` bằng `quick-quiz.js`; thêm màn chọn bảng, phép tính, thời gian **60/90 giây** trước khi chơi; giữ giao diện bóng bay và lưu điểm qua `game-score.js`. Sau ván: hiện các phép em trả lời sai kèm phép đúng (`fact`). Không bảng xếp hạng so sánh học sinh mới.
3. Test: cùng seed + cấu hình → cùng dãy câu; đáp án đúng luôn nằm trong 4 lựa chọn; không lặp trong 10 câu; khớp đầu ra với hoang-mai-math cho 3 seed mẫu (ghi kết quả mong đợi vào test).

## M4 — Sửa giao diện theo kết quả rà

1. Chữ trên trang học sinh ≥ 18px (header chung, chip/nhãn, `game3`, `game4`); trang giáo viên giữ nguyên.
2. Vùng chạm ≥ 48px cho mọi nút/link đã liệt kê ở phần Rà giao diện.
3. Thêm `public/favicon.ico` (từ logo trường có sẵn trong `public/assets`).
4. Dải thông báo thống kê: thu gọn thành nút nhỏ sau khi học sinh bấm "Đã hiểu" (lưu `localStorage`, bọc try/catch); không che nội dung.
5. Rebuild `tailwind.build.css`.

## Kiểm tra (Claude chạy ngoài sandbox)
`npm test`, `node --check` mọi file JS đã sửa, `npm run build:demo`, chạy script rà giao diện 2 cỡ (Edge/Playwright), thử tay luồng học sinh trên bản `dist/`.
Báo cáo `briefs/mvp-mN-report.md`: PASS / FAIL / NOT RUN / BLOCKED theo log thật, kèm danh sách file đã sửa.
