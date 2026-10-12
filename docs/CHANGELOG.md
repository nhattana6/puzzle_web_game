# Nhật ký cập nhật — The Star Keeper

Mới nhất ở trên. Mỗi lần thay đổi màn chơi, gợi ý, âm thanh hay giao diện thì ghi vào đây,
và cập nhật README + `docs/GAME_DESIGN.md` cho khớp.

## 2026-10-12

### Màn 8 – Hoàng hôn: thanh thời gian và độ khó
- Lỗi: kéo mặt trời xuống thì nó lặn sau đồi và người chơi không biết kéo lên lại. Thêm **thanh thời gian** cố định
  bên trái (mặt trời ở trên, trăng ở dưới, núm luôn thấy); kéo núm, bấm vào thanh hoặc kéo mặt trời đều được.
- Độ khó: trước đây kéo xuống là cả 4 chòm hiện hết, không có nhiễu. Giờ mỗi chòm chỉ sáng trong một khoảng (sáng dần,
  rồi mờ dần), nên mỗi lúc chỉ đọc được một chòm; có 5 cụm sao giả sáng xen kẽ; sao mờ tràn ra dần từ 78% đêm.
  Đáp án vẫn là thứ tự sáng lên: Thập tự → Cái gáo → Tam giác → Lưỡi câu.
- Hết đêm: khi kéo hết cỡ xuống, mọi sao đã hiện trước đó (4 chòm thật và 5 cụm giả) sáng lại cùng độ sáng và cỡ
  với sao mờ, lẫn hết vào nhau (trước đây chỉ còn sao mờ).
- Gợi ý: núm trên thanh thời gian được khoanh, mũi tên tới đúng khoảng của chòm cần xem.

### Chia chương
- Màn hình chính có tab Chương 1 / Chương 2. Chương 1 ("Những chòm sao lạc") gồm 12 màn hiện có. Chương 2 khoá,
  hiện "Sắp ra mắt" cùng chú cú. Cấu hình ở `src/ui/chapters.ts`.

## 2026-10-11

### Bỏ hướng dẫn từng màn, để người chơi tự mò
- Mỗi màn không còn bảng hướng dẫn riêng và không tự mở lần đầu (trước đây nói rõ cách làm nên quá dễ).
- Nút ? vẫn còn, mở một thẻ trợ giúp chung cho mọi màn: kéo/bấm/xoay vật thể, đom đóm và gợi ý, chọn chòm sao
  trên bàn phím, nút nhạc nền, nút tắt tiếng. Không giải thích cách giải. Bỏ trường `guide` khỏi `PuzzleDef`.

### Sửa lỗi cuộn trang khi chơi trên điện thoại
- Lỗi: vuốt hoặc kéo trong vùng chơi làm cả trang cuộn (chỉ những vật kéo được mới tắt cuộn, chạm chỗ khác của cảnh
  vẫn cuộn). Tái hiện bằng giả lập cảm ứng: vuốt trên cảnh làm trang cuộn 153 px (màn dọc) và hơn 500 px (màn ngang).
- Sửa: cả vùng cảnh `touch-action: none` (trừ ảnh trong thẻ gợi ý, để thẻ vẫn cuộn được); tắt menu giữ-chạm.
- Điện thoại nằm ngang (chiều cao ≤ 520 px): cảnh bên trái, bàn phím bên phải, vừa một màn hình. Trước đây bàn phím
  nằm dưới cảnh, và vì cảnh không còn cuộn được nên sẽ không có chỗ nào để vuốt tới nó.
- Vẫn cuộn bình thường khi chạm ở ngoài cảnh (thanh trên, bàn phím) ở màn hình dọc.

### Gợi ý thành thẻ có hình minh hoạ
- Bấm Gợi ý mở một thẻ: ảnh thu nhỏ của cảnh lúc đó, khoanh đỏ vật cần làm, huy hiệu thao tác, **mũi tên** tới
  chỗ cần kéo, dấu đích của màn (khung vàng, vạch đỏ, nét nối, số ô), kèm một câu hướng dẫn.
- Cảnh đang chơi không còn bị vẽ đè.
- Bấm lần đầu mua gợi ý 1; bấm lại chỉ mở lại thẻ (không tốn đom đóm); nút "Gợi ý tiếp" trên thẻ mua phần kế.
- Gợi ý miễn phí sau 3 phút: nút Gợi ý nhấp nháy thay vì tự vẽ lên cảnh.
- Màn 7: mũi tên từ mảnh tới ô đúng. Màn 9: mũi tên trên thước từ kim vàng tới vạch đỏ.
- Mọi màn có câu hướng dẫn riêng cho từng gợi ý.

### Nhạc nền, tắt nhạc, tắt tiếng
- Nhạc nền tự tổng hợp (WebAudio): 4 hợp âm chậm + nốt cao lấp lánh có vang. Bắt đầu sau lần chạm đầu tiên,
  dừng khi chuyển tab.
- Nút ♪ bật/tắt nhạc nền; nút loa tắt toàn bộ âm thanh. Có ở thanh trên màn chơi và chân trang bản đồ; được lưu
  (bản lưu cũ mặc định bật nhạc), giữ nguyên khi "Chơi lại từ đầu".
- Điện thoại: chấm tiến trình xuống hàng riêng để đủ chỗ cho các nút.

### Màn 3 – Kính lọc đỏ
- Bỏ chòm sao vẽ mờ bằng mực đỏ và các mặt trăng khỏi bản đồ: chỉ hiện khi soi dưới kính đỏ.

### Màn 12 – Điểm nhìn
- Khi một chòm khớp, vầng trăng hiện bên cạnh. Thứ tự đáp án đổi sang **pha trăng** (trước là vị trí trái → phải
  trên trời, phải tự nhớ nên khó hiểu). Đáp án mới: Lưỡi câu → Thập tự → Tam giác → Kim cương.

### Tài liệu
- Viết lại `docs/GAME_DESIGN.md` theo chủ đề The Star Keeper, bỏ các thiết kế cũ (Mười hai bóng giấy, Paper Shadows).
- Thêm nhật ký cập nhật này.

### Màn 8–12
- Thêm 5 màn với mẹo mới: Hoàng hôn (thứ tự xuất hiện), Chỉnh tiêu cự (độ sâu), Sao dạ quang (nạp sáng rồi tắt
  đèn), Cốc nước (khúc xạ), Điểm nhìn (thị sai). Bản đồ màn chơi thành đường uốn hai hàng.
- Sửa sau khi chơi thử: tăng độ nhoè màn 9; dải giấy màn 11 chỉ còn chấm sao (nét nối làm lộ hình), đổi mũi tên
  thành lưỡi câu vì 4 chấm dễ nhầm với kim cương; nhãn dán màn 10 gần như trùng màu trần.

### The Star Keeper 1.0 (7 màn)
- Chuyển sang cơ chế kiểu HER TREES với chủ đề bầu trời đêm: cảnh nhỏ → lộ chòm sao → bàn phím 3×3 chòm sao.
- 7 màn: Mây đêm, Mặt hồ, Kính lọc đỏ, Đèn lồng lỗ kim, Gấp bản đồ sao, Hai tấm kính, Bầu trời vỡ.
- Bảng hướng dẫn mỗi màn, đom đóm đổi gợi ý (tối đa 3, mỗi gợi ý một phần), khoá bàn phím khi sai.
