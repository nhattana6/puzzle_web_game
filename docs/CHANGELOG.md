# Nhật ký cập nhật — The Star Keeper

Mới nhất ở trên. Mỗi lần thay đổi màn chơi, gợi ý, âm thanh hay giao diện thì ghi vào đây,
và cập nhật README + `docs/GAME_DESIGN.md` cho khớp.

## 2026-10-13

### Chương 3, màn 10 "Ảnh phơi sáng"
- Màn mới `longExposure.ts`: 6 người giơ pháo bông (mỗi người một chòm bằng đốm lửa), 4 bạn đứng yên đeo yếm số 1–4 và 2
  khách đi ngang đeo yếm trùng hai số. Kéo thanh phơi sáng: phơi dài thì khách đi ngang nhoè thành bóng mờ (đốm lửa kéo
  thành vệt) và các chòm hiện đủ; đọc chòm của bốn bạn nét theo số yếm.
- Test (169): yếm 1–4 và hai số trùng, ngắn thì trùng/dài thì rõ, đốm lửa theo thời gian phơi, đáp án theo yếm.

### Chương 3, màn 9 "Mật thư tò he"
- Màn mới `toheCipher.ts`: 3 câu mẫu (3 con tò he → thẻ úp che 3 chòm, chạm để lật) và dòng thông điệp 4 con. Con tò he
  có hoa văn (vằn/chấm/trơn) và số chân (2/4/6); hoa văn chọn hàng, số chân chọn cột của bàn phím 3×3 (phép gán cố ý
  không theo thứ tự quen). Mẫu chỉ phủ 7/9 tổ hợp nên phải suy quy tắc. Đáp án: mũi tên, tam giác, thắt lưng, lưỡi câu.
- Test (165): 9 tổ hợp ↔ 9 phím, mẫu đủ mọi hàng/cột, ≥ 2 con thông điệp ngoài mẫu, đáp án không theo thứ tự phím.
- Người dùng báo con bọ 6 chân khó nhìn: vẽ lại, mỗi bên 3 chân xoè rõ ra khỏi thân, và **chân, đuôi, râu vẽ màu sáng**
  (trước là nâu sẫm gần trùng nền gỗ) nên đếm được ngay ở mọi con.

### Màn 8 (Ba bức tranh): chỉ một màu xanh, bức trái bỏ nhiễu cửa sổ
- Yêu cầu của người dùng: chỗ lệch chỉ dùng **một màu xanh**, bỏ cách hai màu cam/xanh; khi ghép bức trái thì **bỏ màu nhiễu**.
  Chồng tranh giờ vẽ trực tiếp chỗ lệch (sao chỉ có ở một bức, ô cửa sổ khác nhau) bằng chấm/ô xanh trên bức dưới đã mờ
  đi, bức trên ẩn; bỏ hoà trộn `screen`. Bức trái không còn 3 cửa sổ bị đổi, nên cặp (trái, phải) chỉ có sao.
- Yêu cầu tiếp theo: **chỉ cặp giữa ⊕ phải mới tô cửa sổ**; ghép giữa với trái thì không tô cửa sổ (chỉ hiện sao). Thêm
  `showsWindowDiff(i, j)` và test.
- Test: cặp (trái, phải) không có cửa sổ lệch; cửa sổ chỉ được tô ở cặp (giữa, phải).

### Chương 3, màn 8 "Ba bức tranh" (làm lại theo ý người dùng: "hơi dễ")
- Màn `threePaintings.ts`: chỉ còn **3 bức**: trái thêm sao, giữa đổi cửa sổ, phải là bản gốc. **Hai bức chồng lại cho sao**
  (trái ⊕ phải: 4 chòm), **hai bức khác chồng lại cho số thứ tự** (giữa ⊕ phải: mỗi ngôi nhà có 1–4 cửa sổ lệch, đó là
  thứ tự đọc của chòm phía trên). Bức trái có thêm vài cửa sổ đổi làm bẫy khi ghép nhầm cặp.
- Test (160): nội dung từng bức, số cửa sổ lệch theo nhà là 1–4 chỉ ở cặp đúng, đáp án theo số khác trái → phải, chòm cách
  sao thường và nằm trên từng ngôi nhà.

### Chương 3, màn 7 "Đồng hồ sao" (làm lại theo ý người dùng: "hơi dễ")
- Màn `starClock.ts`: thay thiệp 4 đồng hồ bằng **lưới 3×3 gồm 9 đồng hồ nhỏ** xếp như bàn phím. Kéo kim giờ lớn thì đĩa
  trời quay, chòm lọt khung cửa; đồng hồ nhỏ chỉ **khớp** khi chòm hiện ra nằm đúng ô tương ứng trên bàn phím — chỉ 4 trong 9
  khớp (2 đồng hồ ở giờ không có chòm, 3 cái ra chòm khác). Đáp án là 4 chòm khớp, theo thứ tự lưới.
- Test (156): đúng 4 khớp, nhiễu gồm cả giờ trống lẫn chòm khác, mỗi giờ nguyên thấy đúng một chòm, các chòm kề không lọt
  vào khung, giữa hai giờ không thấy trọn chòm.

### Chương 3, màn 6 "Tấm đồng rắc cát"
- Màn mới `sandPlate.ts`: kéo núm cao độ tới từng vạch, cát trên tấm đồng dồn thành chấm của một chòm (kèm cát lẻ và
  đường nút Chladni); bản nhạc 4 nốt có khuông cùng độ cao với các vạch cho biết vạch nào và thứ tự. 6 vạch, 2 vạch
  nhiễu. Có rung cát nhìn thấy được thay cho âm thanh.
- Test (151): giai điệu không đơn điệu, 6 chòm khác nhau, mọi hạt cát nằm trên tấm đồng, cát gom thành chấm tại vạch
  và không có chòm lúc nghỉ hoặc giữa hai vạch. Gợi ý 3 hình.

### Chương 3, màn 5 "Hoa đăng"
- Màn mới `riverLanterns.ts`: sông chảy từ phải sang trái, 6 bến mỗi bến một hoa đăng; chạm để thả, đèn trôi theo
  tuyến vẽ tay tới đình, cối xay hoặc bụi lau. Chỉ đèn tới đình tính, đọc từ bến gần nguồn tới xa nguồn (ngược thói
  quen đọc trái sang phải). Đèn thả từ bờ dưới cũng có thể tới đình.
- Test (146): thứ tự bến và đích, mọi tuyến nằm trên mặt nước và tránh cù lao, cả hai bờ đều có đèn tới đình. Gợi ý 3 hình.

### Chương 3, màn 4 "Sạp đèn"
- Màn mới `lanternStalls.ts`: 4 sạp có mái che hoa văn, 6 khách cầm đèn bọc giấy hoa văn; khớp hoa văn giấy với mái che
  để biết đèn của sạp nào, chạm để mở giấy đọc chòm. Hai khách mua chỗ khác (hoa văn na ná), màu mực là bẫy.
  Đáp án theo thứ tự các sạp từ trái sang phải.
- Test (142): đáp án theo sạp khác thứ tự hàng khách, mỗi sạp khớp đúng một khách, 2 khách mua chỗ khác, chòm
  khác nhau, không dùng màu làm manh mối. Gợi ý 3 hình.

### Chương 3, màn 3 "Dàn ly nước"
- Màn mới `glassChimes.ts`: 9 chuông khắc chòm, 7 ly nước mỗi ly cùng nốt với một chuông; chạm chuông thì ly cùng nốt
  gợn sóng (hiện được bằng hình, không cần tiếng). Chỉ ly có hoa sen tính, đọc từ mực nước thấp lên cao. 2 chuông
  không có ly, 3 ly không hoa là nhiễu. Giao hai nguồn: cộng hưởng + hoa sen + mực nước.
- Test (138): đáp án theo mực nước, mỗi ly một chuông, 2 chuông im, mực nước cách nhau ≥ 0,07, đáp án khác thứ tự
  kệ và thứ tự chuông, không có cả mũi tên lẫn kim cương. Gợi ý 3 hình.

### Chương 3, màn 2 "Dấu chân trên cát"
- Màn mới `sandFootprints.ts`: chồng 6 dấu chân đè lên nhau trong sân đình; chạm để nhấc từng dấu sang ván gỗ, thấy dấu
  bị đè. Nối đế dép dưới mỗi đèn lồng với hoa văn đế để biết dấu của em nào; đáp án là đèn lồng theo thứ tự qua sân
  (dấu dưới cùng đi trước). Nhiễu: giày người lớn và dấu chó. Kết hợp hai manh mối (đế dép + thứ tự chồng lớp).
- Test (133): thứ tự đáp án khác thứ tự giá, mỗi em một đế và một chòm, mọi cặp dấu của các em chồng lên nhau,
  mọi dấu còn thấy một phần lúc đầu và hiện đủ khi đã nhấc các dấu bên trên. Gợi ý 3 hình.

### Chương 3 · Phố đêm rằm: màn 1 "Bia đá"
- Thêm **Chương 3** (tab thứ ba, cần giải đủ Chương 2) và màn đầu `stoneRubbing.ts`: kéo thỏi than chì chà lên tờ giấy phủ
  bia đá, chấm khắc chìm hiện trắng (mặt nạ SVG theo vệt than). 5 chòm chỉ bằng chấm, 2 chòm có vòng gạch chéo phía trên;
  đáp án là 3 chòm còn lại, trái → phải. Không tô sáng, không nét nối, không chime (giữ quy tắc Chương 2).
- Kế hoạch 12 màn và quy tắc kết hợp manh mối ở `docs/CHAPTER3_DESIGN.md`. Bản đồ Chương 3 đã có 12 vị trí sao.
- Gợi ý 3 hình: thỏi than tự trượt và vệt than mọc theo, cả tờ đã chà với chòm đánh số, hình đáp án.
- Test (128): 5 test mới cho màn và mở khoá Chương 3 (chưa chà không lộ, một vệt không đủ, chà đủ thì ra cả 5,
  khoảng cách chấm/vòng gạch/nhiễu, thứ tự đọc).

### Giảm lag
- Đo bằng Chrome (trace): rê chuột làm parallax vẽ lại cả cảnh kèm filter (glow/blur) → GPU 20–40% ở các màn như Lấy nét sao, Mặt hồ;
  màn Bầu trời vỡ tốn cả khi đứng yên vì sao nhấp nháy nằm trong ảnh dùng qua 9 `<use>`.
- Parallax giờ đặt bằng `style.transform` + `will-change: transform` (mỗi lớp là một lớp ghép riêng, không vẽ lại): GPU còn ≈0%.
  Bản sao trong thẻ gợi ý không dùng will-change. Màn Bầu trời vỡ: bỏ nhấp nháy của sao trong ảnh `<use>`.

### Màn 5 (Gấp bản đồ): bỏ nét nối khi gấp xong
- Yêu cầu của người dùng: gấp lại không còn kẻ nét nối các chòm, chỉ còn các chấm sao chồng lên nhau; người chơi tự đoán hình.

### Đom đóm cố định, mở màn tuần tự
- Yêu cầu của người dùng. **Bỏ nhặt đom đóm**: mỗi người chơi có đúng **2 đom đóm** để mua gợi ý (`STARTING_FIREFLIES = 2`);
  cách tăng gợi ý sẽ tính sau. Gỡ các điểm đom đóm khỏi 24 màn (`PuzzleDef.fireflies`, `foundFireflies` trong save)
  và gợi ý miễn phí sau 3 phút. Save cũ: đặt lại về 2 trừ số màn đã mua gợi ý.
- **Mở màn tuần tự**: trong chương, màn sau cần giải màn trước; **Chương 2 cần giải đủ 12 màn Chương 1**. Hub: sao chưa
  mở mờ, có ổ khoá, tên ẩn, không bấm được; thẻ chương hiện 🔒, nút "Bắt đầu" tắt kèm dòng nhắc. `#id` màn chưa mở đưa
  về màn hình chính. Test: mở/khoá theo chuỗi, Chương 2 khoá đến khi xong Chương 1, màn đã giải luôn mở, save cũ.

## 2026-10-12

### Màn 12: bảng tra các cổng dưới bảng điện
- Yêu cầu của người dùng: thêm một bảng mô tả các ký hiệu ở dưới bảng điện. Thêm **dải bảng tra** dưới bảng: ba loại cổng
  (AND, OR, XOR) vẽ đúng ký hiệu trên bảng, mỗi loại kèm **4 trường hợp** (hai đầu vào trên, một đầu ra dưới) bằng chấm
  sáng (vàng) và tắt (xám). Không dùng chữ, đúng quy tắc "không chữ trong cảnh chơi". Bảng điện thấp lại một chút (bước 84
  thay vì 92) để vừa dải bảng tra. Test: bảng tra liệt kê đủ các loại cổng đang dùng và đúng bảng chân trị.

### Màn 12: dây gọn gàng, dễ nhìn
- Người dùng phản hồi: dây rối, người chơi phải đi tìm dây trong khi mục đích là tìm hiểu cơ chế các cổng. Bản đầu có
  khoảng 30 dây cong dài chéo qua nhau (cả dây nhảy qua cột). Sửa: mạch thành **kim tự tháp đều**, 7 cần → 6 → 5 → 4 cổng
  (15 cổng), mỗi cổng chỉ đọc **hai tín hiệu ngay cạnh nó ở cột bên trái**, mỗi cột lệch nửa bậc so với cột trước. Nên
  mọi dây ngắn, đi sang cột kề, **không dây nào cắt dây nào** (test `wireCrossings() === 0`). Dây tắt sáng hơn một chút để
  nhìn thấy đường đi. Mạch tìm lại bằng máy: đúng 1 lời giải với 4 cần xuống, bộ giải "lan truyền + đoán" cần 19 nút (vừa
  phải); 5 XOR, 6 AND, 4 OR. **Đáp án mới**: cần thứ 2, 4, 6, 7 từ trên xuống đang gạt xuống, tức cái gáo, thắt lưng, kim cương,
  thập tự. Đã thử thay dây bằng ô nhỏ chỉ cần gạt ngay ở đầu vào cổng nhưng quá nhỏ nên bỏ.

### Chương 2 mở rộng lên 12 màn: thêm 2 màn suy luận ở cuối
- Yêu cầu: thêm 2 màn cho đủ 12 màn mỗi chương, **khó hơn, hấp dẫn hơn, đòi hỏi logic hơn**. Nghiên cứu các dạng câu đố
  suy luận hợp ý "wordless" (học luật bằng cách thử): Akari/Light Up, Lights Out, mạch logic, nonogram, Mastermind, Latin
  square/Futoshiki, peg solitaire, cân sao. Chọn hai dạng luật học được qua thao tác, có đáp án duy nhất kiểm bằng
  máy, và khác hẳn nhau (không gian/ánh sáng và boolean).
- **Màn 11 "Sân đèn sao"** (`src/puzzles/lampCourt.ts`): sân 6×6 với 11 trụ (3 trụ có chấm: 1, 2, 1), 25 ô lát mỗi ô khắc
  một chòm chỉ-chấm, 4 ngọn đèn trong khay. Đèn thắp sáng ô nó đứng và cả hàng, cột tới trụ; mọi ô phải sáng; trụ có chấm
  = số đèn đứng sát cạnh (chấm chuyển vàng khi đủ). Thiết kế bằng máy tìm kiếm (duyệt tổ hợp): có **38 cách phủ sáng 4 đèn**
  nếu bỏ số, thêm 3 số thì còn **đúng 1**; 3 đèn không bao giờ đủ nên đèn thứ tư không phải đèn thừa. Đáp án: chòm dưới
  chân 4 đèn theo thứ tự hàng (cái gáo, vương miện, thắt lưng, lưỡi câu). Phím mũi tên đi qua các ô, Esc trả đèn về khay.
- **Màn 12 "Bảng mạch sao"** (`src/puzzles/circuitPanel.ts`): 7 cần gạt (mỗi cần một chòm khắc bên cạnh) → 5 cổng → 4 cổng →
  4 cổng nối vào 4 đèn; 13 cổng (5 XOR, 5 AND, 3 OR) vẽ theo ký hiệu quen thuộc. Dây vàng khi có điện, xám khi không.
  Phải làm cả 4 đèn sáng: **chỉ một** cách gạt (kiểm 128 tổ hợp), 4 cần xuống, mỗi cần đều cần (đổi một cần là tắt đèn). Mạch
  được chọn bằng máy: bộ giải "lan truyền + đoán" cần 43 nút, nên phải thử trường hợp chứ không
  suy thẳng một mạch. Đáp án: chòm cạnh 4 cần đang xuống, từ trên xuống (cái gáo, vương miện, lưỡi câu, thập tự).
  Thêm `Sound.ding()` khi cả 4 đèn vừa sáng (không phải chime báo lộ chòm).
- Gợi ý: màn 11 đặt đèn đầu rồi cả bốn (hình đáp án), màn 12 gạt cần đầu rồi cả bốn. Cả hai đều không vẽ nét nối trong cảnh.
- Hub: bản đồ Chương 2 thêm 2 ngôi sao (12 màn). Test: 9 test mới (duyệt hết tổ hợp lời giải ở cả hai màn), registry 24 màn.

### Chương 2 · màn 10: sửa số hạt dẻ vẽ sai
- Người dùng báo đáp án là 5-2-9-4 chứ không phải 7-2-9-4: khung nhỏ nhất ghi 7 hạt dẻ nhưng chỉ **vẽ ra 5**. Nguyên nhân: hạt
  dẻ được rải ngẫu nhiên có loại trừ (cách nhau ≥ 30 px, tránh con cú), khung 130 px không đủ chỗ nên bỏ bớt. Sửa: xếp
  hạt dẻ **đều theo vòng tròn quanh con cú** (`acornSpots`), luôn đủ số hạt đã khai báo. Thêm test: số hạt vẽ ra đúng bằng số
  hạt của từng khung, không chồng nhau, nằm trong khung.

### Chương 2 · màn 10 "Bàn của cú" (màn tổng hợp, hết Chương 2)
- `src/puzzles/owlDesk.ts`: trang sổ sao 560×720 bị xé thành **4 dải dọc** (mép rách răng cưa duy nhất mỗi chỗ). 8 mục trong
  sổ, mỗi mục là một chòm chỉ bằng chấm và dưới nó là số chấm mực (1, 2, 3, 4, 6, 7, 8, 9: không có 5), **mọi mục nằm
  trúng chỗ rách** nên không đọc được khi chưa ghép. Bốn dải rải trên bàn: một úp mặt, hai xoay ngược 180°, một đúng chiều.
  **Kéo dải lên 4 ô của tấm lót xanh** (dải có sẵn trong ô thì về chỗ cũ); **bấm vào dải** để úp → ngửa rồi xoay 180°
  (tối đa 2 lần bấm; Enter/Space thay bấm, ← → đưa dải qua các ô).
- Trên tường là **4 khung tranh khác cỡ**, cú con ôm hạt dẻ (2, 4, 7, 9 hạt, hạt cùng cỡ để không đếm theo kích thước),
  xếp lộn xộn. Đọc **từ khung nhỏ nhất đến lớn nhất**: 7, 2, 9, 4 → tra sổ → lưỡi câu, thập tự, kim cương, thắt lưng.
  Không sáng, không nét nối, không chime; tiếng tách khi dải vào ô.
- Gợi ý 2 hình + đáp án: một dải trượt vào ô (cả 4 dải được ghép sau bước này) · các số đếm được và 4 mục tương ứng
  (nét nối mờ chỉ ở hình gợi ý).
- Test: 5 test (8 mục khác số và khác chòm, mọi chòm bị xé qua ≥ 2 dải, thứ tự khung, trạng thái ban đầu và điều kiện
  ghép xong, chu trình bấm); registry thành 22 màn. **Chương 2 đủ 10 màn.**

### Chương 2 · màn 9 "Đồ chơi treo nôi": không đoán được chòm khi thanh nghiêng
- Người dùng phản hồi: không cần đặt quả vẫn đoán được chòm, vì khi thanh nghiêng bộ sao chỉ bị méo nhẹ. Sửa: các sao treo
  trên vòng trượt, **thanh nghiêng thì chúng trượt dồn về đầu thấp thành một hàng sát nhau** (cách nhau 22 px, thứ tự trộn
  cố định theo từng thanh), hết sạch hình dạng; độ trượt tăng dần từ nghiêng 1,5° (ngưỡng nằm ngang) tới 7,5° là dồn hết.
  Chỉ khi thanh **nằm ngang** (điểm cân bằng cách vòng ≤ 5 px, thanh nằm phẳng hẳn) các sao mới trải ra đúng chỗ thành chòm.
  Cả 4 thanh lúc đầu nghiêng 8–17° nên đều dồn hết. Test: thêm kiểm tra chùm sao, độ trượt, trộn thứ tự.

### Chương 2 · màn 9 "Đồ chơi treo nôi": khó hơn (quả nặng)
- Người dùng phản hồi: bản trượt thanh qua vòng quá dễ vì thanh tự nghiêng chỉ hướng. Làm lại: vòng dây **cố định** và lệch
  khỏi điểm cân bằng (−38, −37, −56, +28 px) nên 4 thanh đều nghiêng 8–17° lúc đầu; thanh không còn kéo được. Thay vào đó
  là **4 quả nặng 1–4 chấm trên giá** và mỗi thanh có **13 nấc** (cách 25 px). Kéo quả nặng đặt vào nấc: thanh nghiêng
  theo khối lượng tổng (sao + quả nặng) và điểm cân bằng mới; nằm ngang khi điểm cân bằng cách vòng ≤ 5 px.
- Phải chọn **đúng quả cho đúng thanh** và đúng nấc (mô-men = cân nặng × khoảng cách; thanh nhiều sao cần nhiều hơn).
  Test duyệt hết hoán vị: chỉ có **một** cách chia 4 quả cho 4 thanh (3, 2, 4, 1 từ trên xuống), một số thanh nhận được
  nhiều hơn một loại quả riêng lẻ nên phải suy luận, không theo thứ tự cân nặng. Phím mũi tên chọn thanh / nấc cho quả
  đang chọn.
- Gợi ý 2 hình: quả nặng đầu tiên trượt từ giá lên nấc của nó (cả 4 quả được đặt sau bước này) · cả 4 chòm đã hiện, đọc từ
  trên xuống.

### Chương 2 · màn 9 "Đồ chơi treo nôi" (bản đầu)
- `src/puzzles/cradleMobile.ts`: thanh ray trên cùng và 4 thanh gỗ xếp bậc thang (trái → phải, trên → dưới). Mỗi thanh treo
  vào ray bằng một sợi dây có vòng, **thanh trượt qua vòng**: kéo thanh sang phải thì vòng chạy sang trái dọc thanh. Mỗi
  thanh mang các ngôi sao gỗ treo dây dài ngắn khác nhau (chòm + 2 sao thừa). Lực kéo về phía nặng: vòng lệch khỏi điểm
  cân bằng thì thanh nghiêng (0,3° mỗi đơn vị, tối đa 32°), cả bộ sao bị méo và dịch chỗ; **nằm ngang (±7) thì tự khớp vào
  đúng chỗ** (kèm tiếng tách) và sao nằm đúng chòm chỉ bằng chấm. Ban đầu cả 4 thanh đều nghiêng 20–32°. Phím ← → trượt
  thanh khi đang chọn.
- Thứ tự đọc **tầng trên → dưới**: cái gáo, hình vuông, vương miện, thắt lưng. Không nét nối, không sáng, không chime.
- Gợi ý 2 hình + đáp án: thanh đầu tự trượt về điểm cân bằng, các sao dịch vào chỗ (móc `act`) · cả 4 chòm đã khớp, đọc
  từ trên xuống.
- Test: 5 test (nghiêng đúng phía, mọi sao về đúng chỗ khi cân bằng và lệch ≥ 25 px lúc đầu, sao thừa xa chòm và nằm trong
  thanh, thứ tự tầng, méo khi nghiêng); registry thành 21 màn.

### Chương 2 · màn 8 "Hộp bánh răng": dễ đếm hơn
- Người dùng phản hồi: đếm quá khó (bánh 4 răng quay 9 vòng, chấm và kim rất nhỏ). Sửa: bánh tay quay 36 → 24 răng nên số
  đếm chỉ còn **3, 4, 1, 2** (thay 4, 9, 1, 6; tối đa 4), bánh phóng to (bán kính mỗi răng 3,2 → 4,2), mỗi lần chấm sơn đi
  qua kim thì **kim nảy xuống một chút và có tiếng tách rất nhỏ** (`Sound.tick()`, theo dõi được cả khi tắt tiếng).
  Đáp án đổi thành vương miện, thập tự, tam giác, hình vuông. Test cập nhật (số đếm ≤ 4, vị trí bánh mới).

### Chương 2 · màn 8 "Hộp bánh răng"
- `src/puzzles/gearBox.ts`: hộp đồng mở nắp, chuỗi 6 bánh răng ăn khớp nối từ bánh có tay quay (bản đầu 36 răng, nay 24 răng, xem bên trên): 8, 6 răng,
  bánh trung gian 16 răng (không sơn), 24 răng, 12 răng. Bốn bánh có **chấm sơn đỏ** trên một răng, xuất phát nửa vòng so
  với kim trắng cố định phía trên bánh. **Kéo tay quay theo vòng tròn**, chốt chặn ở đúng 360° (↑ → / ← ↓ nhích 12°). Số
  lần chấm sơn đi qua kim sau một vòng tay quay là 3, 4, 1, 2 (24 ÷ số răng); hai bánh kề nhau quay ngược chiều.
- Bên cạnh là **tấm đồng 9 lỗ xếp 3×3** như bàn phím, lỗ thứ p có p+1 chấm kiểu xúc xắc (bảng tra số → phím). Đáp án theo
  thứ tự các bánh có sơn từ tay quay: 3 → vương miện, 4 → thập tự, 1 → tam giác, 2 → hình vuông. Bánh trung gian không tính.
- Gợi ý 2 hình + đáp án: tay quay quay một vòng, các bánh quay theo (móc `act`) · các số đếm được và lỗ tương ứng.
- Test: 5 test (khoảng cách ăn khớp và không chồng bánh, số vòng nguyên và đúng 4/9/1/6, cách tính một lần đi qua kim,
  một bánh không sơn, số → phím); registry thành 20 màn.

### Chương 2 · màn 7 "Hải đăng"
- `src/puzzles/lighthouses.ts`: ô cửa sổ gác mái nhìn ra bờ biển có 6 hải đăng (xa gần khác nhau), tấm rèm đỏ che phần
  bên phải (kéo sang phải để mở; ←/→ khi lấy nét). Dưới bàn là **hải đồ nhìn từ trên** với 6 hải đăng và, cạnh mỗi ngọn,
  một chòm chỉ bằng chấm. **Cùng thứ tự trái → phải** giữa hải đồ và cảnh. 4 ngọn chớp theo nhóm riêng (1, 2, 3, 4 lần
  cách 0,45 s, rồi nghỉ 2 s); 2 ngọn tắt mang chòm giả (cái gáo, vương miện); đèn thuyền nhấp nháy theo lịch không đều,
  có một cặp chớp gần nhau trông như nhóm 2. Rèm che cả 2 ngọn đang chớp (1 chớp và 3 chớp).
- Đáp án theo **số lần chớp**: lưỡi câu, hình vuông, tam giác, thập tự (khác thứ tự trái → phải). Không nét nối, không
  sáng chòm, không chime.
- Gợi ý 2 hình + đáp án: rèm trượt ra · các ngọn chớp lần lượt (móc `act` của HintTarget giờ chạy được cả ở mục tiêu
  'look' để phát lại thứ cần đọc, không chỉ ở thao tác bấm).
- Test: 5 test (đếm nhóm chớp từng ngọn, thứ tự trái → phải giữ nguyên, chòm trên hải đồ không đè nhau, rèm che đúng
  ngọn, thứ tự đọc theo số chớp, đèn thuyền không đều); registry thành 19 màn.

### Chương 2 · màn 6 "Đèn kéo quân"
- `src/puzzles/spinLantern.ts`: đèn giấy 4 tầng xếp dọc, mỗi tầng một ô cửa tối. Lúc đầu mỗi tầng chỉ có **một chấm nhảy**
  qua các vị trí. Kéo vòng tròn cánh quạt trên đỉnh (tốc độ đèn theo tốc độ tay quay quanh quạt), thả ra thì đèn **quay
  theo quán tính và chậm dần**; bấm nhẹ vào quạt (hoặc ↑ → / Enter / Space) thì đẩy thêm một chút. Ở một tốc độ riêng
  (0,2 / 0,4 / 0,6 / 0,8, rộng ±0,1) mắt giữ lại **cả các chấm của tầng** thành chòm chỉ bằng chấm; quá 93% tốc độ mọi chấm
  nhoè thành vệt.
- Thứ tự đọc là **tầng từ trên xuống dưới** (thắt lưng, lưỡi câu, kim cương, vương miện), độc lập với việc quay lên hay
  chậm xuống, và khác thứ tự các tầng hiện rõ (kim cương → thắt lưng → vương miện → lưỡi câu). Không nét nối, không chime.
  Thay đổi so với bản nháp thiết kế (thứ tự theo thời điểm hiện rõ): quán tính làm người chơi đi qua các khoảng tốc độ cả
  chiều lên lẫn xuống, nên thứ tự theo thời điểm không xác định được.
- Gợi ý 2 hình + đáp án: quạt quay còn các tầng lần lượt hiện đủ chấm (móc `act`) · cả 4 chòm hiện cùng lúc, đọc trên xuống.
- Test: 6 test (một chấm mỗi tầng lúc chậm, mỗi tầng đủ chấm ở đúng tốc độ riêng, các khoảng tốc độ rời nhau, nhoè
  khi quá nhanh, theo tay rồi chậm dần, thứ tự đọc); registry thành 18 màn.

### Chương 2 · màn 5 "Tổ cú con"
- `src/puzzles/owletNest.ts`: vách gỗ 9 hốc tối xếp 3×3 như bàn phím, một con bướm giấy treo dây kéo được. Bướm lại gần
  một hốc (tính từ điểm cách bướm 60 đơn vị phía dưới, để bướm lơ lửng phía trên hốc và không che mặt) thì sinh vật trong
  hốc **thò đầu ra, mắt nhìn theo bướm**, rồi rụt lại chậm (quét nhanh thì vài con lộ cùng lúc). 4 cú con cỡ đầu 0,62 /
  0,8 / 1 / 1,28 và một dơi treo ngược (thò từ trên xuống, nhiễu). Ban đầu có thêm một búi lông tròn ở hốc 9, đã bỏ theo
  yêu cầu: các hốc còn lại để trống.
- Đáp án là **vị trí**, đọc cú con **từ nhỏ đến lớn**: mũi tên, vương miện, cái gáo, thập tự (khác thứ tự vị trí). Không
  sáng, không đánh dấu, không chime.
- Gợi ý 2 hình + đáp án: bướm trượt tới hốc · cả 4 cú con (và dơi) thò ra cùng lúc để so cỡ.
- Test: 4 test (cỡ cách nhau ≥ 1,2 lần và đầu vừa hốc, lúc đầu không hốc nào thức, thò nhanh rụt chậm, đáp án theo cỡ);
  registry thành 17 màn.

### Chương 2 · màn 4 "Hộp chuông"
- `src/puzzles/bellBox.ts`: hộp có mặt kính, 9 chuông đồng xếp 3×3 đúng bố cục và đúng nốt của bàn phím, chìa khoá lên
  dây bên hông, một chuông nhỏ trên nắp. **Mỗi lần bấm chìa là một vòng** (bấm được cả bằng bàn phím); dừng tay khoảng
  1 s thì hộp chạy đúng bấy nhiêu nốt của bản nhạc cố định: chuông 5, 9, 2, 7 (đánh số từ trái → phải, trên → dưới),
  vòng thứ 5 là chuông trên nắp. Chưa đủ 4 vòng thì dừng giữa chừng; thừa vòng không thêm gì. Chuông bị gõ **lắc rồi
  lặng dần** nên theo dõi được cả khi tắt tiếng; không sáng lên, không đánh dấu.
- Đáp án là **vị trí và thứ tự gõ**: thắt lưng, lưỡi câu, hình vuông, kim cương. Thêm `Sound.ding()` cho chuông trên nắp
  (không trùng nốt nào của bàn phím).
- Gợi ý 2 hình + đáp án: chìa khoá tự xoay một vòng còn chuông lắc lần lượt (qua móc `act`) · nhớ vị trí 4 chuông đầu.
- Test: 4 test (số nốt theo số vòng, 4 chuông khác nhau không theo thứ tự lưới, đáp án = phím cùng vị trí, chuông lắc
  rồi lặng); registry thành 16 màn.

### Chương 2 · màn 3 "Khay bi"
- `src/puzzles/marbleTray.ts`: khay gỗ vuông với ~70 hõm mờ cùng kiểu và 8 viên bi thuỷ tinh. Chạm hoặc kéo về phía một
  góc (hoặc phím mũi tên) thì khay nghiêng, bi lăn về góc đó và nằm vào hõm: 3–6 viên thành chòm chỉ-chấm, các viên
  còn lại nằm rải rác ở những hõm khác, xa chòm và xa nhau (không chất đống ở góc: bản đầu chất đống 1–4 viên cạnh các lỗ
  khoan nên bị đọc nhầm là số thứ tự). Bi nằm nguyên khi thả tay. Mỗi góc một chòm, cạnh mỗi góc có 1–4 lỗ khoan trên thành khay;
  **đọc theo số lỗ**: 1 lỗ thập tự, 2 hình vuông, 3 lưỡi câu, 4 tam giác. Không nét nối, không chime.
- Gợi ý 3 hình: bi tự lăn về góc có 1 lỗ (dùng móc `act`) · đọc chòm và lỗ khoan · đáp án.
- Test: 7 test (bi lúc đầu xa mọi chòm, mọi trạng thái nghỉ không chồng bi, bi thừa rải rác xa chòm và xa nhau và không
  nằm ở hõm của chòm nào, hõm giấu trong các hõm khác, chạm góc nào nghiêng góc đó, thứ tự đọc theo lỗ khoan); registry
  thành 15 màn.

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
