# Brief MVP-DEMO — Vườn Toán 3 bản demo trên GitHub Pages

Chủ nhiệm duyệt hướng ngày 16/10/2026: **math3 là sản phẩm chính (Phương án B)**, giữ phần Claude làm dở làm điểm xuất phát, Codex viết code, deploy bản demo lên github.io hoặc Cloudflare.
Nhánh: `feat/mvp-b0-b1` (đã có commit WIP của Claude). Đọc `AGENTS.md` trước. Làm **lần lượt T1 → T2 → T3**, mỗi task dừng lại để Claude kiểm tra và commit.

## Quyết định deploy: GitHub Pages, bản tĩnh "chế độ demo"

- Server Express + SQLite **không chạy được** trên github.io hay Cloudflare Pages. Chạy trên Cloudflare phải viết lại backend sang Workers + D1 — quá lớn cho đợt demo.
- Vì vậy: **cùng một bộ giao diện `public/`**, thêm chế độ demo — `api.js` chuyển các lời gọi `/api/*` sang `demo-api.js` chạy trong trình duyệt (dữ liệu trong `localStorage`, nội dung từ `data/content/grade3.json`). Build ra `dist/`, deploy bằng GitHub Actions lên `https://fossbk-spec.github.io/math3/`.
- Bản server giữ nguyên để deploy thật về sau (Render/Railway, hoặc Cloudflare Workers + D1 ở đợt sau).
- Giới hạn chấp nhận được của bản demo (ghi rõ trên trang): không có tài khoản thật, dữ liệu chỉ ở máy đang dùng, đáp án nằm trong file tĩnh.

## Đã có (Claude làm, CHƯA chạy thử — kiểm tra lại, sửa nếu sai)

| File | Nội dung |
|---|---|
| `tools/import-hoang-mai.js` → `data/content/grade3.json` | 7 bài (9–15, đúng mục lục SGK, có trang), 17 bộ, 221 câu từ phiếu GV + câu tự sinh của hoang-mai-math; `choice/truefalse → multiple-choice`, `number → input`, `compare`; bỏ `multi` và câu cần GV; đề kiểm tra 20 câu trắc nghiệm rải bài 9–15 |
| `data/seed.json` | Tên mẫu → bí danh; chỉ giữ bộ `phieu-bai-9-10` (trang `exercise.html`) gắn bài 9 |
| `server/db.js` | Cột mới `level, origin, source, hints_json, solution_json, review_status, reviewed_by, reviewed_at` (+ ALTER cho DB cũ); bảng `login_attempts`; nạp nội dung bằng `INSERT OR IGNORE` |
| `server/auth.js` | Sửa `timingSafeEqual` sập khi token sai độ dài; bỏ secret mặc định (production bắt buộc `SESSION_SECRET`) |
| `package.json` | `better-sqlite3` 12.x (bản 11 không có bản build cho Node 24) |
| `briefs/ref/api-patches.js` + `briefs/ref/patch.cjs` | Bản vá `server/api.js` **chưa áp dụng**: `ALLOW_DRAFT`, `MAX_ATTEMPTS=3`, bài kiểm tra 1 lượt, chuẩn hoá đáp án (9.721 = 9721), nhận xét theo ngưỡng (90/50, tạm), bài chữa ở lượt cuối, chống dò mật khẩu, giới hạn điểm/sao game, duyệt câu, chống CSV injection, `randomUUID` |
| `.claude/skills/` | Skill `ui-ux-pro-max`, `web-design-guidelines` (từ hoang-mai-math #14) |

## T1 — Server: chốt bảo mật, nội dung, chấm điểm

1. Áp bản vá `briefs/ref/api-patches.js` (`node briefs/ref/patch.cjs server/api.js briefs/ref/api-patches.js`), sửa nếu chỗ nào không khớp. Sau đó xoá `briefs/ref/`.
2. Tách logic chấm ra **`public/assets/js/core/grading.js`** (UMD: `module.exports` + `window.MathGrading`): `norm`, `isCorrect(q, given)`, `commentFor(percent, thresholds)`, `gradeSubmission(questions, answers, {kind, lastAttempt})`. Server `require` file này; T2 dùng lại.
3. Trang chủ (`index.js`): mỗi bài hiện các bộ của bài (Cơ bản / Nâng cao / Luyện thêm / Kiểm tra) thay vì chỉ bộ đầu tiên; nút ≥ 48px.
4. `lesson.js` sau khi nộp: điểm, **nhận xét** ("Hoàn thành rất tốt" / "Hoàn thành" / "Cố gắng hơn"), ✓/✗ từng câu, số lượt còn lại; ở lượt cuối hiện **bài chữa** (đáp án + lời giải nếu có). Bài kiểm tra: chỉ điểm + nhận xét.
5. Góc giáo viên (`schedule.js`): danh sách câu hiện trạng thái duyệt + nguồn (phiếu GV / tự sinh); nút Duyệt / Loại từng câu, "Duyệt cả bộ".
6. Escape mọi chuỗi vào `innerHTML` ở `lesson.js`, `leaderboard.js`, `schedule.js` (dùng chung một hàm `esc` trong `core/`).
7. Đổi tên người trong `public/*.html` sang bí danh (cùng bảng trong `data/seed.json`); xoá số liệu trang trí giả ("1.250", "Hạng 2", "18 trận"…) hoặc thay bằng số thật từ API.
8. Test `node:test` (`test/*.test.js`, `npm test`): `grading.js` (dấu chấm hàng nghìn, chữ hoa, ô trống, compare), token sai định dạng → 401 không phải 500, nộp quá `MAX_ATTEMPTS` → 409, bài kiểm tra không trả `correctAnswer`, lượt cuối có bài chữa, điểm game vượt mức → 400, duyệt câu và `ALLOW_DRAFT=false` ẩn câu DRAFT, import tạo đúng 7 bài. Test chạy server với `DB_PATH` tạm, `SESSION_SECRET` giả.

**Xong khi:** `npm test` pass; `npm start` trên DB mới, đăng nhập `hocsinh01/123456`, làm bộ "Bài 9 · Cơ bản" 3 lượt thấy nhận xét và bài chữa; `giaovien01` duyệt được câu.

## T2 — Bản tĩnh cho GitHub Pages

1. `public/assets/js/core/demo-api.js`: hiện thực các endpoint giao diện đang gọi (`auth/me`, `auth/login`, `auth/logout`, `lessons`, `me/progress`, `question-sets/:id/questions`, `submissions`, `leaderboard`, `game-scores`, `me/game-scores`, các endpoint `teacher/*` mà `schedule.js` dùng) trên `localStorage`, nội dung lấy từ `data/grade3.json` trong `dist/`; chấm bằng `grading.js`; cùng luật lượt làm/bài chữa/nhận xét như server.
2. `api.js`: nếu `window.MATH_DEMO === true` thì dùng `demo-api.js`, ngược lại gọi server như cũ.
3. Đăng nhập demo: trang `login.html` ở chế độ demo hiện 2 nút lớn "Vào với vai Học sinh (Bạn Cú)" / "Vào với vai Giáo viên"; nút "Xoá dữ liệu demo" ở chân trang.
4. Dải thông báo cố định: "BẢN DEMO – dữ liệu chỉ lưu trên máy này, không phải tài khoản thật". Không chồng lên nút của game (đã gặp ở `math3-game-demo`).
5. `tools/build-demo.js` (`npm run build:demo`): chép `public/` → `dist/`, chép `data/content/grade3.json` → `dist/data/`, chèn `<script>window.MATH_DEMO=true</script>` + `demo-api.js` vào mọi trang, thêm `.nojekyll`. Đường dẫn tương đối (site nằm dưới `/math3/`).
6. `.github/workflows/ci.yml`: `npm ci`, `npm test`, `npm run build:demo` trên mọi PR. `.github/workflows/pages.yml`: build và deploy `dist/` lên GitHub Pages khi push `main` (dùng `actions/upload-pages-artifact` + `actions/deploy-pages`). **Không** tự bật Pages trong cài đặt repo — Claude/chủ nhiệm bật sau khi merge.

**Xong khi:** `npm run build:demo` tạo `dist/`; mở `dist/` bằng server tĩnh bất kỳ, vào vai học sinh làm bài, chơi game, xem bảng xếp hạng; vào vai giáo viên duyệt câu; không có lời gọi mạng tới `/api/`.

## T3 — Rà giao diện bằng skill

1. Rà `index.html`, `lesson.html`, `login.html`, `schedule.html`, `game*.html` theo `web-design-guidelines`; tra `ui-ux-pro-max` khi cần (`--domain ux`, `--stack html-tailwind`).
2. Sửa nhóm lỗi ưu tiên: focus nhìn thấy được (không `outline-none` trơn), `aria-label` cho nút chỉ có icon, vùng chạm ≥ 48px, `prefers-reduced-motion`, không chặn zoom, ảnh có `alt`/kích thước, thông báo nộp bài dùng `aria-live`.
3. Bỏ `cdn.tailwindcss.com` nếu `tailwind.build.css` đã đủ class (kiểm bằng `npm run build:css` rồi so ảnh); không thì giữ và ghi lý do.
4. Báo cáo `briefs/mvp-demo-report.md`: danh sách phát hiện `file:line` đã sửa / còn lại.

## Không làm trong đợt này
Xoá `original-backup/` (task riêng); AI (xem Đề xuất); Cloudflare Workers/D1; đổi bố cục lớn; thêm dependency.

## Đề xuất bổ sung từ hoang-mai-math (chờ chủ nhiệm chọn, làm sau T3)

| # | Tính năng (hoang-mai-math) | Độ dễ đưa sang | Ghi chú |
|---|---|---|---|
| 1 | Nội dung bài 9–15, trạng thái duyệt, lượt làm, bài chữa, nhận xét | **Đã đưa vào T1** | |
| 2 | Gợi ý từng bước (`hints` của câu tự sinh) | Dễ | Đã có trong `grade3.json`, chỉ cần nút "Gợi ý" |
| 3 | Trang Mục lục như SGK (`/student/muc-luc`, số trang) | Dễ | Có `page` trong dữ liệu |
| 4 | **AI Safe & Smart** (`content/grade3/ai-safe.json`) | Trung bình | Hoạt động tĩnh, chạy được trên github.io — **thành phần AI cho bài dự thi** |
| 5 | Nút góp ý của giáo viên (`/gop-y`) | Dễ (bản demo: liên kết Google Form/issue) | Bản server: bảng `feedback` |
| 6 | Báo cáo phụ huynh in được (`/parent`) | Trung bình | Dùng dữ liệu tiến độ sẵn có |
| 7 | Luyện tập thích ứng (`src/lib/adaptive`) | Khó | Cần chuyển TS → JS và có dữ liệu kỹ năng |
| 8 | Gia sư bạn Cú (Gemini) | Khó | Cần server; không chạy trên bản tĩnh |

## Kiểm tra (Claude chạy ngoài sandbox)
`npm ci` → `npm test` → `npm run build:demo` → mở `dist/` kiểm tra nhanh → commit với author "Codex" → PR vào `main` của `fossbk-spec/math3`. Merge khi chủ nhiệm nói "merge #N"; sau đó bật GitHub Pages (Source: GitHub Actions).
