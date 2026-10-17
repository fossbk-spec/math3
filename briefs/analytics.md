# Brief ANALYTICS — Thống kê sử dụng và học tập (chủ nhiệm duyệt 17/10/2026)

Mục tiêu: tự động thu thập số liệu **ẩn danh** về lượng người dùng, quá trình sử dụng và kết quả học tập trên bản demo `https://fossbk-spec.github.io/math3/`, hiển thị trên trang **Thống kê** ngay trong web, làm minh chứng đánh giá sản phẩm.

## 1. Vì sao cần máy chủ nhỏ

Bản demo là trang tĩnh, dữ liệu nằm trong `localStorage` của từng máy → không gộp được số liệu nhiều người. Cần một nơi nhận và cộng dồn sự kiện:

| Phương án | Ưu | Nhược | Đề xuất |
|---|---|---|---|
| **Cloudflare Worker + D1** | Miễn phí ở quy mô trường; SQL; tự chạy định kỳ (Cron); cùng hệ với `math-games` | Cần tài khoản Cloudflare + API token (chủ nhiệm tạo) | **Chọn** |
| Google Sheets + Apps Script | Dễ xem bằng bảng tính | Giới hạn quota, dữ liệu nằm trong tài khoản Google cá nhân, khó làm dashboard | Dự phòng |
| GoatCounter / Cloudflare Web Analytics | Không cần code | Chỉ đếm lượt xem trang, không có số liệu học tập | Không đủ |

## 2. Dữ liệu thu (ẩn danh, tối thiểu)

- **Không** thu: tên, bí danh, ảnh, địa chỉ IP (không lưu), nội dung tự gõ ngoài đáp án số.
- Mỗi trình duyệt có `deviceId` ngẫu nhiên (UUID trong `localStorage`); kèm `role` (học sinh/giáo viên) và `classCode` tuỳ chọn do giáo viên phát (VD `3A`), không bắt buộc.
- Sự kiện:

| Sự kiện | Trường |
|---|---|
| `session_start` | deviceId, role, classCode, thời điểm, loại màn hình (tablet/desktop/mobile) |
| `page_view` | trang |
| `lesson_open` | lessonId, setId |
| `submission` | setId, lessonId, kind, attemptNo, scorePercent, correctCount, totalCount, durationSec, comment, danh sách `{questionId, correct}` |
| `hint_used` | questionId, thứ tự gợi ý |
| `game_end` | gameId, score, durationSec |
| `ai_safe_choice` | situationId, lựa chọn, có phải lựa chọn tốt nhất |
| `teacher_review` | số câu duyệt / loại |

## 3. Trang Thống kê (`thong-ke.html`, menu Góc giáo viên)

Tự cập nhật khi mở trang; số liệu cộng dồn tính sẵn mỗi giờ bằng Cron của Worker.

1. **Người dùng:** thiết bị dùng theo ngày / tuần, số thiết bị quay lại (≥ 2 ngày), theo vai, theo lớp, loại màn hình.
2. **Quá trình sử dụng:** số phiên, thời lượng trung bình, trang dùng nhiều; phễu *mở bài → nộp lượt 1 → làm lại → hoàn thành (≥ ngưỡng)*; tỉ lệ dùng gợi ý; lượt chơi game.
3. **Học tập:** điểm trung bình theo bài và theo bộ (Cơ bản / Nâng cao); tỉ lệ đạt "Hoàn thành" trở lên; **lượt 1 so với lượt cuối** trong cùng bộ; top 10 câu / dạng hay sai; thời gian trung bình mỗi câu; kết quả bài kiểm tra Chủ đề 2; AI Safe: tỉ lệ chọn đúng từng tình huống.
4. **Xuất dữ liệu:** nút tải CSV (số liệu cộng dồn) cho báo cáo dự thi.

Biểu đồ vẽ bằng SVG/HTML thuần (không thêm thư viện), theo skill `web-design-guidelines`.

## 4. Đánh giá hiệu quả — cách đọc số liệu cho đúng

- Số liệu trên chỉ **mô tả**; không được tuyên bố "tăng X% hiệu quả" (PLAN v1.2 §4 của hoang-mai-math).
- Thước đo tiến bộ có thể nói được: chênh lệch điểm **lượt 1 → lượt cuối** cùng bộ; điểm bài kiểm tra chủ đề so với bộ Cơ bản đầu tiên của cùng thiết bị; tỉ lệ quay lại.
- Bổ sung ngoài hệ thống: phiếu ý kiến giáo viên 5 câu (thang 1–5) sau buổi dùng thử, nhập trực tiếp trên trang Thống kê; ghi rõ số người trả lời.
- Mọi con số trên dashboard hiện kèm **n** (số thiết bị/lượt) và khoảng thời gian.

## 5. Tự động hoá

- Trình duyệt gom sự kiện, gửi theo lô bằng `navigator.sendBeacon` (không làm chậm trang); mất mạng thì giữ lại gửi sau.
- Worker: `POST /e` nhận sự kiện (kiểm tra schema, giới hạn kích thước, chỉ nhận từ origin `fossbk-spec.github.io`); Cron mỗi giờ tính bảng cộng dồn; `GET /stats` trả số liệu cộng dồn (không trả dữ liệu thô).
- GitHub Action hằng tuần lưu ảnh chụp `stats.json` vào repo (có dấu thời gian) làm minh chứng.
- Lưu dữ liệu thô 90 ngày rồi tự xoá; giáo viên có nút "Xoá toàn bộ dữ liệu thống kê" (cần mã quản trị).

## 6. Quyền riêng tư

- Dải thông báo: "Web ghi nhận ẩn danh cách sử dụng để cải thiện sản phẩm" + nút **Tắt thống kê** trên máy này.
- Căn cứ Luật 91/2025/QH15 và NĐ 356/2025/NĐ-CP (theo PLAN v1.2): mã thiết bị ngẫu nhiên vẫn có thể là dữ liệu cá nhân → học sinh chỉ dùng sau khi trường duyệt và cha mẹ đồng ý; giai đoạn dùng thử chỉ giáo viên.

## 7. Chia việc

| Task | Người làm | Nội dung |
|---|---|---|
| A0 | **Chủ nhiệm** | Tạo tài khoản Cloudflare, API token (Workers + D1), đặt secret `ANALYTICS_ADMIN_CODE` |
| A1 | Codex | `public/assets/js/core/analytics.js` (gom, gửi, tắt); gắn sự kiện vào `demo-api.js`, `lesson.js`, game, AI Safe; chỉ bật khi build có `ANALYTICS_URL`; test |
| A2 | Codex | `analytics/` (Worker + D1 schema + migration + Cron + `/e`, `/stats`, `/stats.csv`, xoá dữ liệu); test bằng Miniflare/`wrangler dev` nếu có sẵn, không thì test hàm thuần |
| A3 | Codex | `thong-ke.html` + `pages/thong-ke.js` (4 khối mục 3, phiếu ý kiến GV), dùng dữ liệu mẫu khi chưa có Worker |
| A4 | Claude | Deploy Worker (sau khi có token), đặt `ANALYTICS_URL` trong workflow Pages, workflow ảnh chụp hằng tuần, kiểm tra đầu–cuối |

Không làm: thu dữ liệu nhận dạng; thư viện biểu đồ; thay đổi server Express (bản server làm sau).

## Cập nhật 17/10 (chủ nhiệm): gửi cả sự kiện vai học sinh

Nhà trường đã duyệt cho giai đoạn giáo viên dùng thử → **gửi tự động cả sự kiện vai học sinh**. Mỗi sự kiện kèm `deviceId`, `role`, `classCode` và **bí danh** đang dùng (VD "Bạn Cú") để theo dõi theo từng em; **không** thu họ tên thật, ảnh, ngày sinh (chờ chủ nhiệm xác nhận riêng nếu cần tên thật). Giữ nút "Tắt thống kê" và dải thông báo.

### Task A1b (Codex)
1. `analytics.js`: bỏ chặn vai học sinh; thêm trường `alias` (tên hiển thị hiện tại) và `classCode` vào mọi sự kiện; cập nhật `briefs/analytics-stats-schema.md` (thêm khối "Theo từng em": số lượt, điểm TB, lượt 1 → lượt cuối, theo bí danh + lớp) và `public/data/stats-sample.json`.
2. `thong-ke.html`: dùng header/footer chung của web như các trang khác (không còn chữ "logout"); khoảng ngày chỉ hiện một lần ở đầu trang, mỗi dòng chỉ còn giá trị + n; thêm khối "Theo từng em"; dải "Tắt thống kê" không che nội dung (chừa khoảng trống cuối trang).
3. Test: sự kiện vai học sinh được đưa vào lô gửi khi có URL; có `alias`, `classCode`; vẫn không gửi khi URL rỗng hoặc đã tắt.
