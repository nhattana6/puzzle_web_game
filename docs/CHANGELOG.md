# Nhật ký cập nhật — The Star Keeper

Mới nhất ở trên. Mỗi lần thay đổi màn chơi, gợi ý, âm thanh hay giao diện thì ghi vào đây,
và cập nhật README + `docs/GAME_DESIGN.md` cho khớp.

## 2026-10-12

### Chương 2 · màn 2 "Cửa sổ sương"
- `src/puzzles/frostWindow.ts`: cửa sổ 9 ô xếp 3×3 đúng như bàn phím. Kéo ấm trà lại gần một ô thì hơi nước phủ lên ô
  đó và hiện **dấu ngón tay cũ**; sương tự tan sau vài giây (~4 s), chạy bằng vòng `requestAnimationFrame`. Ba ô có 1, 2,
  3 dấu, một ô chỉ có vết lau (nhiễu). **Đáp án là vị trí**: ô 1 dấu → phím cùng vị trí, rồi ô 2 dấu, ô 3 dấu
  (cái gáo, tam giác, mũi tên). Trên cảnh không có hình sao nào và không có chime.
- Gợi ý 3 hình: ấm trà tự trượt tới ô kính (cả 9 ô phủ sương, ấm về chỗ cũ) · đọc dấu theo số lượng · đáp án.
- Test: 5 test (lúc đầu không dấu nào hiện, sương dày lên đúng ô có hơi và tan đi, sương mỏng không hiện dấu, 1/2/3 dấu,
  đáp án = phím cùng vị trí và khác thứ tự cửa sổ); registry thành 14 màn.

### Chương 2: khung chương + màn 1 "Lông cánh"
- **Thiết kế:** `docs/CHAPTER2_DESIGN.md` (nghiên cứu HER TREES, 10 màn, quy tắc riêng của chương: không tự tô sáng, không
  nét nối, không chime; xen các màn đáp án là con số/vị trí).
- **Khung chương:** `PUZZLES` tách thành `CHAPTER_1` / `CHAPTER_2` (`PUZZLES` vẫn là danh sách chung); màn hình chính
  vẽ bản đồ riêng cho từng chương (`LEVEL_STARS` theo chương); chấm tiến trình và nút "màn tiếp" của màn chơi chỉ tính
  trong chương của màn đó. Chương 2 mở ngay (chưa khoá sau màn 12), `comingSoon` bỏ.
- **Màn 1 Lông cánh** (`src/puzzles/featherWing.ts`): kéo 3 lông vũ từ lọ vào 3 chỗ trống hình lông trên cánh giấy; chấm
  trên lông nối với chấm trên cánh thành chòm chỉ-chấm (tam giác, lưỡi câu, vương miện). Đọc theo số vạch sẫm trên lông
  (1 → 2 → 3): vương miện, tam giác, lưỡi câu. Chỉ có tiếng "tách" khi lông khớp chỗ, không chime. Cảnh chơi không có
  nét nối; nét nối mờ chỉ hiện trên hình gợi ý. Gợi ý 3 hình: lông tự trượt vào chỗ · đọc · đáp án.
- **Test:** thêm 6 test cho màn 1 (lúc đầu không chòm nào đủ, mỗi sao nằm hẳn trên lông hoặc hẳn trên cánh, lông khác
  không che chòm không phải của nó, thứ tự đọc theo vạch, vạch/chấm nhiễu không đè lên chấm chòm); registry thành 13 màn.

### CLAUDE.md
- Thêm `CLAUDE.md` ở gốc repo: tổng hợp mọi quy tắc đã chốt (thiết kế màn, không lộ đáp án, không trùng ý tưởng, gợi ý,
  cảm ứng, âm thanh, kỹ thuật, các bẫy đã gặp, cách kiểm tra và phát hành) để các phiên sau thiết kế màn mới không lặp lỗi.

### Gợi ý màn 7–12 gọn lại
- Màn 7: từ 22 nước trượt còn 1 nước trượt mẫu + hình bầu trời đã ghép xong (mục tiêu) + đáp án.
- Màn 8–12: thao tác lặp cho từng chòm chỉ minh hoạ một lần (chòm đầu tiên), câu mô tả nói làm tương tự với các chòm
  còn lại. Số hình (kể cả đáp án): màn 8, 9, 12 còn 3; màn 10, 11 còn 4 (trước là 9–16).

### Gợi ý màn 5: hoạt ảnh gấp bản đồ
- Bước bấm nếp gấp giờ cho thấy tờ bản đồ gấp thật: nửa phải lật sang trái, rồi nửa dưới lật lên, các sao di chuyển
  theo, lặp lại. Thêm móc `act` cho `HintTarget` để màn tự vẽ hoạt ảnh riêng; phần vẽ bản đồ theo độ gấp được tách
  thành hàm dùng chung cho game và gợi ý.

### Gợi ý màn 4 gọn lại
- Từ 9 bước (lặp "bấm đèn → đọc" cho từng mặt) còn 3 bước: thắp nến → bấm đèn để xoay mặt (đèn có 4 mặt, mỗi mặt một
  chòm) → đọc chấm sáng lật gương và trăng trên mặt đèn; rồi hình đáp án.

### Sửa: hoạt ảnh gợi ý không chạy trên một số máy
- Hoạt ảnh trước dùng SVG SMIL, vốn không tự chạy trên một số trình duyệt (nhất là Safari) khi chèn vào sau, và bị tắt
  khi máy bật "giảm chuyển động" (đám mây vẽ sẵn ở chỗ cuối nên trông như đứng yên). Giờ hoạt ảnh chạy bằng script theo
  từng khung hình cho hình đang hiện, giống nhau trên mọi trình duyệt, và vẫn chạy khi bật giảm chuyển động.
  Chuyển bước thì hoạt ảnh bắt đầu lại từ đầu.

### Hình gợi ý: bỏ mũi tên và vòng đỏ
- Hình gợi ý không còn mũi tên, vòng khoanh đỏ hay huy hiệu: chỉ chính vật thể tự diễn thao tác và lặp lại (ví dụ đám
  mây tự trượt xuống ra khỏi khung cửa), kèm một chấm trắng "ngón tay". Bước "đọc" dùng quầng sáng vàng nhẹ.

### Gợi ý trình bày đầy đủ từ đầu, hoạt ảnh của chính vật thể
- Gợi ý không còn cắt bớt bước theo việc người chơi đã làm: luôn đi từ đầu màn tới đáp án. Thẻ gợi ý dựng một bản sao
  ẩn của màn ở trạng thái ban đầu, chụp hình trước mỗi bước rồi thực hiện bước đó trên bản sao, nên **mỗi hình đúng
  trạng thái của bước** (đèn sáng sau khi thắp nến, phòng tối sau khi tắt đèn…).
- Hoạt ảnh giờ di chuyển **chính vật thể**: đám mây, vật trên hồ, kính đỏ, nến, tấm kính (trượt và xoay 180°), mảnh
  trời, núm thời gian, kim tiêu cự, vòng sáng, bình nước, dải giấy, chú cú; đèn lồng lật mặt khi bấm.
- Kỹ thuật: `HintTarget` thêm `object`/`turn`/`flip`, `HintStep` thêm `apply`; vật được gắn `data-hint`; mỗi hình đổi
  tên id riêng để clip/gradient không lẫn nhau.

### Hình gợi ý tĩnh + hoạt ảnh thao tác
- Nền mỗi hình gợi ý giờ đóng băng (hết sao nhấp nháy, nến chập chờn, chớp mắt…).
- Thao tác được minh hoạ bằng hoạt ảnh lặp: kéo = ngón tay kéo vật theo mũi tên; bấm/xoay = nhấn kèm gợn sóng;
  nhìn = vòng khoanh phập phồng; thước màn 9 = chấm trượt tới vạch. Tôn trọng "giảm chuyển động" của hệ điều hành.

### 1 gợi ý giải cả màn, chuyển qua lại từng hình
- Bỏ giới hạn 3 gợi ý và gợi ý từng phần: mỗi màn chỉ có **1 gợi ý (1 đom đóm) và nó giải cả màn**. Mua rồi xem lại
  miễn phí; nút Gợi ý hiện dấu ✓. Gợi ý tự tặng sau 3 phút vẫn còn (nút nhấp nháy).
- Thẻ gợi ý chỉ hiện **một hình mỗi lần**, chuyển bằng nút ‹ ›, các chấm bước hoặc phím ← →, kèm "Bước x / y".
  Không dồn mọi bước lên một màn hình nữa.
- Các bước là toàn bộ những gì còn phải làm (ví dụ màn 4: nến → xoay đèn → đọc, lặp cho từng mặt theo thứ tự trăng;
  màn 7: cả đường trượt ~20 nước tìm bằng BFS). **Hình cuối là đáp án** cần bấm.
- Màn 3–4, 8–12 sắp bước theo thứ tự đáp án. Hình của các bước sau vẫn là cảnh hiện tại (trừ màn 7).

### Làm lại gợi ý: nhiều hình theo từng bước
- Thẻ gợi ý giờ là một dãy hình, mỗi hình một bước (số 1, 2, 3…) với vòng khoanh, mũi tên và câu mô tả. Phần nào cần
  một thao tác thì một hình; cần nhiều thao tác thì nhiều hình (màn 4: nến → xoay đèn → đọc; màn 6: xoay kính → kéo vào
  khung → đọc; màn 10: kéo vòng sáng → tắt đèn → đọc; màn 11: rót nước → kéo dải giấy → đọc…).
- Chỉ gồm các bước còn thiếu theo trạng thái hiện tại; lo phần của gợi ý mới nhất chưa xong.
- Màn 7 (trượt mảnh): tìm đường thật bằng BFS, hiện tối đa 4 nước đầu để xếp xong một hàng, mỗi nước một hình vẽ đúng
  trạng thái bàn. Có test cho thuật toán.
- API: `MountedPuzzle.hintTargets()` được thay bằng `hintSteps()` trả về `HintStep` (`note`, `targets`, `prepare?`).

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
