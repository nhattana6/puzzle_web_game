# Nhật ký cập nhật — The Star Keeper

Mới nhất ở trên. Mỗi lần thay đổi màn chơi, gợi ý, âm thanh hay giao diện thì ghi vào đây,
và cập nhật README + `docs/GAME_DESIGN.md` cho khớp.

## 2026-10-11

### Sửa lỗi cuộn trang khi chơi trên điện thoại
- Lỗi: vuốt hoặc kéo trong vùng chơi làm cả trang cuộn. Tái hiện bằng giả lập cảm ứng.
- Cách sửa (chỉ chặn ở các vật thao tác được, chạm chỗ trống của cảnh vẫn cuộn trang như thường):
  - CSS: `touch-action: none` cho mọi vật kéo/chạm được trong cảnh (`.interactive`, `[role=button]`, `[role=slider]`).
  - Dự phòng cho Safari iOS (không nghe `touch-action` trên phần tử SVG): `Scene` huỷ cuộn bằng `preventDefault` ở
    `touchmove`, nhưng chỉ khi ngón tay bắt đầu từ một vật thao tác được.
  - Tắt menu giữ-chạm trong cảnh.
- Kiểm tra bằng giả lập cảm ứng trên 10 màn có vật kéo: kéo vật không làm trang cuộn (cả khi gỡ `touch-action`, để thử
  riêng nhánh dự phòng); vuốt chỗ trống của cảnh cuộn trang 153 px như bình thường; chạm vẫn hoạt động như chuột.
- (Bản sửa đầu tiên chặn cuộn trên cả cảnh và đổi bố cục màn ngang; đã gỡ vì chỉ cần chặn ở các vật thao tác.)

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
