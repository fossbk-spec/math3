# Hợp đồng dữ liệu `/stats` cho A2

`GET /stats` trả JSON tổng hợp, không trả sự kiện thô hoặc mã thiết bị. Mẫu chuẩn: [`public/data/stats-sample.json`](../public/data/stats-sample.json). Dashboard A3 đọc đúng cấu trúc này. `schemaVersion` hiện là `1`; `generatedAt` là ISO 8601 UTC; `period.from` và `period.to` là ngày `YYYY-MM-DD` (bao gồm cả hai đầu, theo giờ Việt Nam). Mọi chỉ số phải có `n` là mẫu số, không dùng `0` để thay cho dữ liệu chưa tính được. Với dữ liệu thiếu, dùng `null` cho `value` và ghi `n: 0`.

| Nhánh | Trường | Đơn vị và mẫu số `n` |
|---|---|---|
| `users` | `daily[]`, `weekly[]` | `value`: thiết bị riêng trong ngày/tuần; `n`: cùng số thiết bị. Mỗi hàng có `label`. |
| | `returning` | thiết bị hoạt động từ 2 ngày trở lên; `n`: thiết bị riêng trong kỳ. |
| | `roles[]`, `classes[]`, `screens[]` | thiết bị riêng theo nhóm; `n`: tổng thiết bị riêng trong kỳ. Giá trị thiếu thuộc nhóm `Chưa chọn`. |
| `usage` | `sessions`, `avgSessionSec` | số phiên (`n`: thiết bị); thời lượng trung bình tính bằng giây (`n`: phiên có đủ mốc). Một phiên tách sau 30 phút không hoạt động; thời lượng từ sự kiện đầu đến cuối của phiên. |
| | `pages[]`, `funnel[]` | `value`: lượt xem trang hoặc thiết bị đạt bước phễu; `n`: tổng phiên hoặc thiết bị mở bài tương ứng. Bốn bước phễu: mở bài, nộp lượt 1, làm lại, hoàn thành ≥ 50%. |
| | `hintRate`, `gamePlays` | phần trăm lượt mở bài có gợi ý (`n`: lượt mở bài); tổng lượt game (`n`: thiết bị chơi). |
| `learning` | `byLesson[]`, `bySet[]` | điểm trung bình phần trăm (`n`: lượt nộp). `bySet` gộp Cơ bản/Nâng cao theo `kind`/metadata bộ đề. |
| | `completionRate` | phần trăm lượt nộp đạt ≥ 50% (`n`: lượt nộp). |
| | `firstLast` | `{first,last,n}`: điểm phần trăm trung bình của lượt 1 và lượt cuối trong **cùng bộ, cùng thiết bị**; `n`: số cặp. |
| | `mistakes[]` | top tối đa 10 câu/dạng có nhiều lượt sai; `value`: lượt sai, `n`: lượt trả lời câu/dạng. |
| | `avgQuestionSec`, `topic2Exam` | giây/câu (`n`: câu đã nộp); điểm trung bình phần trăm bài kiểm tra Chủ đề 2 (`n`: lượt kiểm tra). |
| | `aiSafe[]` | tỷ lệ phần trăm chọn phương án tốt nhất theo tình huống (`n`: lượt chọn). |

Các hàng trong mảng có dạng `{ "label": "...", "value": 12, "n": 57 }`; các chỉ số đơn có dạng `{ "value": 12, "n": 57 }`. `firstLast` là ngoại lệ nêu trên. Nhãn phải là dữ liệu công khai hoặc nhóm, không chứa tên/bí danh. A2 cần tính `n` theo định nghĩa trên và không coi dữ liệu từ trình duyệt là điểm/thời gian đã xác thực. Dashboard chỉ mô tả dữ liệu quan sát, không suy diễn hiệu quả học tập.

`POST /e` của A1 gửi `{ "schemaVersion": 1, "events": [...] }` bằng `sendBeacon`, `Content-Type: text/plain`; sự kiện có `type`, `deviceId`, `role`, `classCode`, `at` và trường riêng theo mục 2 của brief. A1 chỉ gửi sự kiện vai giáo viên theo quy tắc quyền riêng tư của repo; sự kiện học sinh chỉ giữ cục bộ. URL rỗng không phát yêu cầu nào. A2 cần kiểm tra schema, nguồn gửi và giới hạn dung lượng; tính lại hoặc đánh dấu không xác thực với điểm/thời gian từ trình duyệt.
