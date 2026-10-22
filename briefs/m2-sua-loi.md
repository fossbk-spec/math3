# Brief M2 — Sửa lỗi sau MVP: sao, câu trùng, 10 câu mỗi bài, 1 điểm mỗi câu, bước 3 trắc nghiệm

Ngày 23/10/2026. **Chủ nhiệm yêu cầu:**
- chưa tăng sao sau khi học sinh làm xong bài;
- có câu hỏi giống nhau trong một bài;
- số câu trong một bài nên là 10;
- mỗi câu 1 điểm (không phải 5);
- gợi ý sát hơn;
- fix 1, 2, 3.

Phần gợi ý, câu phiếu và lõi làm ở hoang-mai-math (`../hoang-mai-math/briefs/vt3-h3.md`, H3). M2 làm phần riêng của math3 và **nhập lại gói H3** khi gói đó có.

Nhánh `feat/m2-sua-loi` từ `main`. Đọc `AGENTS.md`, `briefs/HANDOFF.md`, `briefs/goi-mo-thich-ung.md`, `briefs/goi-mo-thich-ung-report.md`.

## Hiện trạng (Claude đã kiểm 23/10)

- **Sao:** chỉ bộ bài tập (`submissions` trong `demo-api.js`) và trò chơi cộng sao. Bộ bài tập chỉ cộng khi điểm vượt kỷ lục cũ (`starsEarned = (điểm mới − kỷ lục) / 100 × 40`). **Luyện tập thích ứng (`practice/*`) không cộng sao.** Chip ☆ trên header không cập nhật sau khi được sao.
- **Câu trùng:** `bai-13/14/15-luyen-them` trùng 4–5 câu (cùng đề), `bai-13-co-ban` 1 câu, `bai-13-nang-cao` 1 câu, `bai-15-co-ban` 2 câu.
- **Số câu:** các bộ bài tập có từ 2 đến 28 câu. Bộ được tạo trong `tools/import-hoang-mai.js` (khoảng dòng 82 và 98).
- **Điểm:** `points: q.points || 5` trong `submissions` (`demo-api.js`). Server có thể có chỗ tương tự.

## Yêu cầu

### 1. Sao
- **Luyện tập thích ứng:**
  - mỗi câu **làm đúng** (ở lần thử bất kỳ) → +1 sao;
  - câu **tự hoàn thành** ở bước 3 (`guided = DONE`) → +1 sao;
  - câu `REVEALED` → 0 sao.
  - Cộng một lần cho mỗi câu, không cộng lại khi tải lại trang.
  - Trả `starsEarned`, `totalStars` trong phản hồi.
- **Bộ bài tập:** giữ quy tắc kỷ lục, nhưng **lần nộp đầu tiên** của mỗi bộ luôn được ít nhất 1 sao cho mỗi câu đúng. Quy tắc mới: `max(số câu đúng, phần vượt kỷ lục theo công thức cũ)`, chỉ tính phần chênh so với số sao đã nhận ở bộ đó. Ghi số sao đã nhận theo bộ.
- **Header:** chip ☆ cập nhật ngay sau khi nhận sao, không cần tải lại trang (sự kiện chung, ví dụ `math:stars`, được `navbar.js` lắng nghe).
- Làm cho **cả bản tĩnh (`demo-api.js`) và server**. Logic tính sao đặt **một chỗ** dùng chung (ví dụ `core/stars.js`), theo quy tắc "chấm một chỗ".

### 2. Không trùng câu, đúng 10 câu mỗi bài
Trong `tools/import-hoang-mai.js`:
- Mỗi bộ bài tập (`kind: 'exercise'`) có **đúng 10 câu**, **không trùng đề** (so sánh `prompt` đã chuẩn hoá khoảng trắng) và không trùng `id`.
- **Thừa câu:** chọn 10 câu cố định, phủ đủ dạng (luân phiên theo `templateId` hoặc nguồn phiếu), ưu tiên câu có gợi ý và lời giải.
- **Thiếu câu:** bổ sung bằng câu tự sinh **cùng bài và cùng mức** từ gói hoang-mai-math, không trùng với các câu đã có.
- Không đủ 10 câu kể cả khi đã bổ sung: giữ số câu có, in cảnh báo.
- **Đề kiểm tra (`kind: 'exam'`) giữ 20 câu**, chỉ bỏ trùng.
- Phiên luyện tập thích ứng: không ra lại câu cùng đề trong một phiên 10 câu (kiểm theo `prompt`, không chỉ `id`).

### 3. Mỗi câu 1 điểm
- Mặc định `points = 1` ở mọi chỗ (bản tĩnh và server). Điểm phần trăm và nhận xét giữ cách tính theo tỉ lệ.
- Giao diện hiện "x/10 câu đúng", không còn "điểm × 5".

### 4. Bước 3 cho trắc nghiệm, so sánh, đúng/sai (fix 1)
Dùng `maskSolution` chế độ `rechoose` từ gói H3:
- sai lần 3 → hiện các bước giải (không có kết luận), em **chọn lại**;
- chọn đúng → `DONE`;
- chọn sai 2 lần → `REVEALED`.

Giao diện dùng lại khối "Bạn Cú gợi ý" với các phương án thay cho ô nhập số.

### 5. Nhập lại gói H3 (fix 2, gợi ý sát hơn)
Khi H3 đã merge: chạy `node tools/import-hoang-mai.js`. Câu phiếu nay có `verification` và gợi ý 3 bậc; câu trắc nghiệm phân loại được lỗi theo phương án em chọn.

### Test
- Sao:
  - luyện 10 câu đúng 7 câu, tự hoàn thành 1 câu → +8 sao;
  - tải lại trang không cộng thêm;
  - nộp bộ lần 1 được 6/10 đúng → ≥ 6 sao;
  - nộp lại điểm thấp hơn → 0 sao.
- Mọi bộ bài tập 10 câu, không trùng đề. Đề kiểm tra không trùng.
- Điểm mỗi câu là 1.
- Trắc nghiệm: sai 3 lần → chọn lại → `DONE` hoặc `REVEALED`.
- Bản tĩnh và server cho cùng kết quả.

## Không làm
- Không sửa tay `data/content/grade3.json`. Không đọc `data/*.csv`, `data/*.docx`. Không thêm dependency, không LLM.
- Không chỉnh giao diện ngoài các chỗ nêu trên (chủ nhiệm: giao diện để sau). Không commit.

## Kiểm tra (Claude, ngoài sandbox)
`npm test`; `node --check` các file JS đã sửa; `build:css`; `build:demo`; Playwright: sao tăng sau luyện tập và sau nộp bộ; mỗi bộ 10 câu. Báo cáo `briefs/m2-sua-loi-report.md`.
