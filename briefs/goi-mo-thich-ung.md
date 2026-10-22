# Brief M1 — Gợi mở 3 bước và thích ứng theo nhịp (MVP trước 24/10)

Ngày 23/10/2026. **Chủ nhiệm đã duyệt:**
- Làm ở hoang-mai-math trước, rồi math3 **kế thừa**. Không viết lại code, tài nguyên hay dữ liệu câu hỏi đã có ở hoang-mai-math.
- Chọn phương án nhanh nhất để có MVP trước 24/10.
- Bước 1 là **"hướng dẫn đọc kỹ đề"**.
- Dùng hệ gợi ý theo luật, không trò chuyện bằng mô hình ngôn ngữ.

Nguồn lõi: `../hoang-mai-math/briefs/vt3-mvp-core.md` (H1). H1 xuất gói `../hoang-mai-math/exports/math3/` gồm:
- `hm-coach.js` (biến toàn cục `HMCoach`);
- `lesson-questions.json` (câu tự sinh bài 9–15, có gợi ý, lời giải, phép tính `verification`);
- `goi-mo-rules.json`;
- `manifest.json`.

**M1 chỉ bắt đầu khi H1 đã merge.** Nhánh `feat/goi-mo-thich-ung` từ `main`.

## Hai yêu cầu của chủ nhiệm

1. **Gợi ý, không làm bài hộ.** Khi em trả lời sai, hệ thống phân loại dạng lỗi rồi gợi mở 3 bước:
   - (1) hướng dẫn đọc kỹ đề;
   - (2) câu hỏi dẫn dắt dựa trên dữ kiện của đề;
   - (3) em tự hoàn thành đáp số đúng.
2. **Học tập thích ứng.** Tự điều chỉnh độ khó theo nhịp tiếp thu của từng em, tính bằng **số câu cần để vững một dạng**. Không bấm giờ.

## Hiện trạng math3 (đã kiểm 23/10)

- Lõi luyện tập `public/assets/js/core/practice.js` dùng chung cho server và bản tĩnh (`demo-api.js`). Khi câu kết thúc (đúng, hoặc sai lần 3), `answer()` trả **ngay `correctAnswer` và `solution`**. `pages/practice.js` hiện "Đáp án: …". Như vậy là làm hộ.
- Gợi ý: chỉ 36/221 câu có gợi ý, và chỉ là 2 bộ gợi ý chung. Không có phân loại lỗi, không có hình minh hoạ.
- `core/adaptive.js` là bản chép cũ của hoang-mai-math (A01–A05, A07; A04 hạ mức ngay). Chưa có đọc đề bằng giọng nói.

## Yêu cầu

### 1. Nhập gói từ hoang-mai-math (không chép tay)
Mở rộng `tools/import-hoang-mai.js`:
- Đọc `exports/math3/manifest.json`, kiểm sha256 từng file. Sai thì dừng.
- Chép `hm-coach.js` → `public/assets/js/vendor/hm-coach.js`. Thêm dòng chú thích nguồn ở đầu file: version và commit, lấy từ manifest.
- Đổi câu trong `lesson-questions.json` sang dạng câu của math3 bằng hàm `convert` sẵn có:
  - `number` → `input`;
  - `choice` → `multiple-choice` (đáp án chữ A–D như hiện nay);
  - `compare` → `compare`;
  - bỏ qua `truefalse` và `multi`, đếm số câu bị bỏ.
  - Giữ `hints`, `solution`, `verification`, `illustration`, `templateId`, `seed`.
- Đưa các câu này vào `practicePool`, **ưu tiên** hơn câu không có gợi ý. Câu phiếu GV hiện có vẫn giữ.
- Chép `goi-mo-rules.json` vào `data/content/` (hoặc gộp vào `grade3.json`).
- Chạy lại tool để sinh `data/content/grade3.json`. Không sửa tay file này.
- In thống kê: số câu nhập, số câu bỏ, số câu có `verification`.

### 2. Lõi luyện tập (`core/practice.js`, dùng chung server và bản tĩnh)
Dùng `HMCoach` (bản tĩnh: biến toàn cục; server: `require` file vendor, nếu file là IIFE thì nạp bằng `vm`).
- **Sai lần 1** → trả `coach: { step: 1, message, segments }` từ `HMCoach.readStep(prompt)`.
- **Sai lần 2** → trả `coach: { step: 2, prompt, errorTag }` từ `HMCoach.guideStep(...)`.
- **Sai lần 3** → `HMCoach.maskSolution(...)`.
  - `ok` → trả `coach: { step: 3, masked }`, mục đang làm có `guided: 'PENDING'`. **Không trả `correctAnswer`, không trả `solution` đầy đủ.**
  - Không `ok` (dạng khác `number`, hoặc không che được) → hành vi cũ (trả lời giải).
- Action mới `complete`: em điền số cuối.
  - Đúng → `guided: 'DONE'`, lời khen lấy từ `rules.done`.
  - Sai → `guidedTries + 1`.
  - Sau 2 lần sai → `guided: 'REVEALED'`, trả đáp số và lời giải.
- **Đúng ở bất kỳ lần nào** → như cũ (khen, có thể xem lời giải).
- Kết quả chấm không đổi: sai hết lượt vẫn tính sai.
- Mỗi lần sai ghi `steps: [{ tryNo, answer, errorTag }]` vào mục luyện tập (localStorage ở bản tĩnh; cột JSON ở server nếu cần, kèm migration).
- Kiểm tra đầu vào như hiện có. Thêm kiểm tra `complete` chỉ hợp lệ khi `guided === 'PENDING'`.

### 3. Thích ứng
- `core/adaptive.js` gọi `HMCoach.selectNextCore` (luật G3: A04-HOLD, A08-MISCONCEPTION, A03 giữ nguyên). Giữ tên `MathAdaptive.selectNext` để không vỡ chỗ gọi. Lịch sử truyền thêm `errorTags` và `guided`.
- Lý do hiện cho học sinh dùng câu chung ("Mình luyện thêm dạng này nhé"). Nhãn lỗi chỉ ghi trong trace.
- `tools/hoc-sinh-ao.js` (node): chạy 5 kiểu học sinh ảo, mỗi kiểu 30 câu, qua `practice.next/answer` với dữ liệu thật:
  - tiếp thu nhanh;
  - tiếp thu chậm;
  - lặp lỗi cộng thay vì nhân;
  - hay mở gợi ý;
  - ngẫu nhiên.

  In bảng Markdown (câu, mức, luật, nhãn lỗi) và `paceBySkill` cuối cùng. Ghi kết quả vào báo cáo.

### 4. Giao diện luyện tập (`practice.html`, `pages/practice.js`)
- Khối "Bạn Cú gợi ý" (`aria-live="polite"`):
  - bước 1: đề hiện lại, **số và từ khoá được tô đậm** (từ `segments`), kèm câu hướng dẫn;
  - bước 2: câu dẫn dắt in đậm;
  - bước 3: các bước giải với "?" ở số cuối và ô nhập "Em điền số còn thiếu", nút "Kiểm tra".
- Bỏ dòng "Đáp án: …" sau lần sai thứ 3. Đáp án chỉ hiện khi `DONE` hoặc `REVEALED`, và trong bài chữa sau phiên.
- Nút "Câu tiếp" chỉ hiện khi câu đã xong và `guided` khác `PENDING`.
- **Nút đọc đề** 🔊: đọc đề và lời gợi ý hiện tại bằng `speechSynthesis` (`vi-VN`, tốc độ 0,9). Chép cách làm từ `../hoang-mai-math/src/components/practice.tsx`. Không có giọng Việt thì hiện câu hướng dẫn, không báo lỗi.
- Dùng lớp clay sẵn có (U1/U2). Chữ ≥ 18px, nút ≥ 48px, 768×1024 và 1024×768 không tràn ngang. Escape mọi chuỗi đưa vào DOM (dùng `textContent`).

### 5. Test (`npm test`)
- Lõi:
  - sai 1 → bước 1;
  - sai 2 → bước 2 với nhãn đúng (6 × 7 trả 13);
  - sai 3 → bước 3, phản hồi **không có `correctAnswer`/`solution`**;
  - `complete` đúng, sai, quá 2 lần;
  - dạng không che được → hành vi cũ.
- Quét toàn bộ `practicePool`: thông điệp bước 1–3 không chứa đáp án đúng như số đứng riêng (trừ khi đáp án trùng toán hạng trong đề).
- Thích ứng: A04-HOLD và A08 qua `practice.next`.
- Import: sha256 sai thì dừng; số câu đúng.
- Bản tĩnh và server cùng kết quả cho một kịch bản (test hiện có kiểu `demo-api.test.js`).

### 6. Phương án kiểm tra cho giáo viên
`docs/kiem-thu-goi-mo.md`, khoảng 15 phút trên link GitHub Pages. 5 tình huống, mỗi tình huống có đáp án sai cần nhập và kết quả mong đợi để đánh Đạt / Chưa đạt:
1. 6 × 7 trả 13: bước 1 tô đậm 6, 7 → bước 2 câu nhóm → bước 3 tự điền 42.
2. Một câu chia, trả số chia.
3. Đúng ngay hai câu liền → câu sau khó hơn.
4. Sai hết lượt một câu → câu sau giữ mức.
5. Bấm nút đọc đề.

## Không làm
- Không gọi LLM, không thêm dependency, không bấm giờ, không xếp hạng.
- Không sửa câu, đáp án hay lời giải bằng tay. Mọi thứ đi qua tool nhập.
- Không đọc `data/*.csv`, `data/*.docx`. Không đổi đăng nhập, trò chơi, đề kiểm tra.
- Không vẽ hình minh hoạ SVG trong MVP (dữ liệu `illustration` đã nhập, vẽ ở bước sau).

## Kiểm tra (Claude, ngoài sandbox)
`node tools/import-hoang-mai.js`, `npm test`, `node --check` các file JS đã sửa, `npm run build:css`, `npm run build:demo`, chạy `tools/hoc-sinh-ao.js`, Playwright đi hết 5 tình huống ở 2 kích thước màn hình, quét `dist/` không lộ họ tên lớp 3A2. Báo cáo `briefs/goi-mo-thich-ung-report.md`. Chỉ merge khi chủ nhiệm nói "merge #N".
