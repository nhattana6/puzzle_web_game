# Chương 5 · Chuyến tàu đêm — Bản thiết kế (nháp)

Mở xong mái vòm, chú cú thấy những vì sao cuối cùng còn lạc ở rất xa, nơi đường ray chạy xuyên đêm. Cú lên **chuyến tàu
đêm**: mỗi màn là một toa, một ga xép hoặc một khúc đường. Bản đồ chương là tuyến đường sắt 12 ga; giải xong một màn thì
ga đó sáng đèn và vé tàu được đóng một **dấu ga**. Trạng thái: **bản nháp** (2026-10-16); người dùng bảo làm tuần tự, **màn 1, 2, 3 xong** (2026-10-16 / 17), các màn còn lại chưa làm.

## 1. Nghiên cứu: còn gì chưa dùng

### 1.1 Bốn chương đã dùng những gì
| Chương | Kiểu chính | Đã dùng hết |
|---|---|---|
| 1 | mẹo nhìn ngoài trời | che, phản chiếu lộn ngược, lọc màu, lỗ kim, gấp giấy, chồng kính, trượt mảnh, thời gian, độ sâu, dạ quang, khúc xạ, thị sai |
| 2 | đồ vật trong nhà, đáp án số/vị trí | ghép mảnh, ngưng tụ, trọng lực, cót, mồi nhử, lưu ảnh theo tốc độ, chớp đèn, tỉ số truyền, mô-men, Akari, cổng logic |
| 3 | kết hợp manh mối | rập than, dấu chồng lớp, cộng hưởng, khớp hoa văn, dòng chảy, Chladni, trời quay, chồng tranh, suy quy tắc, phơi sáng, loại trừ chéo |
| 4 | cỗ máy luật | nonogram, Latin square, rót nước, Lights Out, Sokoban, peg solitaire, Mastermind, Hashi, lập trình đường đi, Star Battle, cân đĩa |

### 1.2 Các game giải đố gần đây làm gì mà ta chưa có
Đọc các bài điểm game giải đố 2025–2026 (nguồn ở mục 8), có bốn ý dùng được ở mức *thể loại*:

| Ý | Ví dụ ngoài kia | Ta chưa có | Dùng trong Chương 5 |
|---|---|---|---|
| **Sai mà vẫn học được** | xếp hạng game theo "lỗi cho thông tin chứ không phạt" | màn sai chỉ là "chưa sáng" | **bày rồi chạy**: người chơi đặt máy rồi xem nó chạy; chạy sai thì *thấy* sai ở đâu (màn 6, 9, 12) |
| **Dạy luật bằng cảnh, không chữ** | The Witness dạy luật qua cách sắp xếp đường, màu, đối xứng | có (thẻ mẫu Chương 4) | giữ; thêm **đối thủ** dạy luật bằng cách thắng mình (màn 8) |
| **Đổi nhịp, không leo dốc đều** | Blue Prince, các game "dễ trước khi vào tầng mới" | độ khó tăng đều | **nhịp răng cưa** dễ ↔ khó (yêu cầu của người dùng, mục 2) |
| **Vật thật làm ẩn dụ** | Paper Trail gấp giấy | có nhiều | đồ đường sắt: ghi, toa, hầm, ống nhòm, domino trong toa hàng |

Các thể loại logic cổ điển còn trống (danh sách của gói `logicpuzzle` và các trang tổng hợp): **Minesweeper**,
**Slitherlink**, Nurikabe, Skyscrapers, Battleships, Kakuro, **người nói thật / nói dối**, **trò chơi đối kháng (Nim)**,
**đổi toa (shunting)**, **đường đi theo ngân sách**. Chương 5 lấy năm thể loại in đậm và để lại phần còn lại.

## 2. Khác bốn chương trước thế nào

1. **Nhịp răng cưa** (người dùng yêu cầu 2026-10-16): xen màn dễ và khó, nhưng xu hướng chung vẫn đi lên. Mỗi màn khó
   có một màn "thở" ngay sau, dùng *mẹo nhìn* chứ không phải luật mới. Đây là ngoại lệ có chủ ý của quy tắc 3 (độ khó tăng
   dần) trong CLAUDE.md.

   ```
   ★5                              8                    12
   ★4          4         6                  10
   ★3     2                   7                    11
   ★2        3       5                 9
   ★1  1
       1  2  3  4  5  6  7  8  9  10 11 12
   ```
2. **Ba kiểu màn đan nhau**: *mẹo nhìn* (1, 2, 5), *đồ chơi bày rồi chạy* (4, 6, 9), *suy luận* (3, 7, 8, 10, 11). Hai
   màn liền nhau không cùng kiểu, trừ 10–11 trước màn cuối.
3. **Lần đầu có đối thủ**: màn 8 chơi một ván với bác lửng soát vé. Bác chơi hoàn hảo, nên thua vài ván chính là cách
   học luật.
4. **Lần đầu điều khiển phương tiện**: lái đầu máy đổi toa (màn 4).
5. **Hiện tượng mới**: kính cửa thành gương khi trong sáng hơn ngoài (1), sóng lan đồng tâm (2), nhìn ngược ống nhòm để
   thu nhỏ (5), ghi tự lật sau mỗi chuyến tàu (6), phản ứng dây chuyền có thời gian (9).
6. **Dấu ga trên vé** (thành phần giao diện mới, có thể làm sau): bản đồ chương là đường ray; mỗi màn xong đóng một dấu
   hình nhỏ của màn đó lên vé tàu dưới bản đồ. Chỉ để trang trí và cho thấy tiến trình, không phải manh mối.
7. Giữ **quy tắc Chương 2–4**: chòm chỉ là chấm, không tự tô sáng, không nét nối, không `sound.chime()` khi lộ chòm. Đèn
   phản hồi của *luật* thì được. Giữ **mỗi màn một lời giải, kiểm bằng test** của Chương 4.
8. **Tắt parallax** (`steady: true`) như Chương 4: nhiều màn có vật phải căn khớp.

## 3. Danh sách 12 màn

| # | ★ | Màn | Kiểu | Cách chơi ngắn | Đáp án / thứ tự | Bẫy, điểm khó |
|---|---|---|---|---|---|---|
| 1 | 1 | **Cửa kính toa đêm** ✅ | mẹo nhìn | Đèn trong toa sáng thì cửa kính chỉ phản chiếu khoang; vặn nhỏ đèn mới thấy sao ngoài trời | 3 chòm, trái → phải | ảnh phản chiếu của đèn trong khoang trông như một chòm (chòm giả) |
| 2 | 3 | **Hầm đom đóm** ✅ | mẹo nhìn | Cú hú, sóng âm lan thành vòng; mỗi ấu trùng loé sau một **độ trễ riêng**. Đứng đúng tâm thì độ trễ bù khoảng cách nên cả một chòm loé cùng lúc | 4 chòm, theo thứ tự loé | đứng lệch thì các chấm của chòm loé rời rạc; có một "tâm giả" cho một chòm giả |
| 3 | 2 | **Hang cua ruộng lúa** ✅ | suy luận (Minesweeper) | Ô ruộng đã cày cho biết có bao nhiêu hang cua ở 8 ô quanh; đánh dấu đủ hang | 3 chòm, trái → phải | vài hang lẻ làm nhiễu; một hang phải suy từ hai số |
| 4 | 4 | **Bãi dồn toa** | đồ chơi (shunting) | Lái đầu máy kéo/đẩy, móc/tháo toa, dồn đoàn tàu theo bảng hình bóng toa ở ga | 4 chòm, đầu tàu → đuôi | đường cụt chỉ chứa 3 toa; 2 toa thừa chắn đường |
| 5 | 2 | **Ống nhòm ngược** | mẹo nhìn | Nhìn qua ống nhòm chỉ thấy từng mái nhà; quay ngược ống nhòm thì cả thung lũng thu nhỏ, đèn các làng thành chòm | 4 chòm, theo đường ray uốn qua các làng | đường ray đi ngoằn ngoèo nên khác thứ tự trái → phải |
| 6 | 4 | **Ghi tự lật** | đồ chơi bày rồi chạy | Đặt 6 cần ghi rồi cho 4 chuyến tàu chạy lần lượt; tàu đi qua ghi nào thì ghi đó lật | 4 chòm, theo thứ tự tàu xuất phát | không có ghi lật thì không cách đặt nào đúng; 64 cách đặt, đúng 1 |
| 7 | 3 | **Than vừa đủ** | suy luận (đường đi theo ngân sách) | Bản đồ tuyến, mỗi đoạn tốn vài xẻng than; tìm đường tới ga cuối dùng **vừa hết** than | 4 chòm, theo thứ tự đi qua | đường ngắn nhất không đúng; vài đường thiếu/thừa đúng một xẻng |
| 8 | 5 | **Ván hạt sen** | đối thủ (Nim) | Bốn bát hạt sen; mỗi lượt bốc bao nhiêu tuỳ ý từ một bát; ai bốc hạt cuối thắng. Bác lửng chơi hoàn hảo | 4 chòm: bát mình bốc ở mỗi lượt, ghi trên sổ ván | mỗi lượt chỉ đúng một nước thắng; chòm có thể lặp |
| 9 | 2 | **Domino toa hàng** | đồ chơi bày rồi chạy | Đặt 3 quân domino dự phòng vào 5 chỗ trống rồi đẩy quân đầu; chuỗi đổ rẽ nhánh tới 4 chuông | 4 chòm, theo thứ tự chuông kêu | nhánh dài ngắn khác nhau nên thứ tự kêu khác thứ tự vị trí |
| 10 | 4 | **Đường ray vòng** | suy luận (Slitherlink) | Lắp một vòng ray khép kín trên lưới; số chấm trong ô là số cạnh ô có ray. Xong thì tàu đồ chơi chạy vòng | 4 chòm, theo thứ tự tàu chạy qua | 7 đèn ga ven lưới, chỉ 4 nằm trên vòng; chiều chạy theo đầu máy đặt sẵn |
| 11 | 3 | **Ai nói thật** | suy luận (nói thật / nói dối) | Sáu hành khách, mỗi người nói một câu bằng hình về người khác; người thật luôn đúng, người dối luôn sai | 4 chòm trên vé của người nói thật, theo ghế trái → phải | câu nói vòng (A nói về B, B nói về A); mỗi câu đều cần |
| 12 | 5 | **Ga cuối** (tổng hợp) | máy chạy, gộp luật | Bãi ga cuối: ghi tự lật (màn 6), than vừa đủ (màn 7), bảng hình bóng toa (màn 4). Chỉ đặt cần ghi rồi chạy | 4 chòm, theo thứ tự tàu vào ga | phải suy từ lượng than ra đường đi, từ đường đi ra trạng thái ghi lúc tàu qua |

## 4. Chi tiết từng màn

### Màn 1 · Cửa kính toa đêm ★1 (`trainWindow.ts`) ✅
- **Cảnh (đã làm):** khoang toa với ba ô cửa kính, ba đèn tường, ghế băng đỏ; chú cú đậu trên ghế. **Núm gạt đèn là một rãnh dọc trên vách giữa ô 1 và ô 2** (lên = sáng, xuống = tối; biểu tượng bóng đèn to ở trên, nhỏ ở dưới). Chạm hay kéo ở bất kỳ chỗ nào của rãnh đều đưa núm tới đó (vùng bắt rộng cho ngón tay); phím ↑ ↓ ← → nhích 0,05. Đèn lúc đầu sáng hết (`LIGHT_START` = 1).
- **Mẹo:** đèn sáng thì mỗi ô kính là một tấm gương mờ phủ sắc ấm, chỉ thấy ảnh khoang (quầng đèn, lưng ghế, bóng chú cú); ở ô giữa
  có **7 chấm đinh đồng của giá hành lý phản chiếu thành chòm cái gáo giả** (bẫy cho người đọc vội). Gạt xuống thì phòng tối
  dần, ảnh phản chiếu mờ đi và sao ngoài trời hiện lên. Độ hiện là hàm thuần `glassMix(light)`: phản chiếu = clamp((l − 0,2)/0,4),
  sao = clamp((0,55 − l)/0,35), độ tối phòng = (1 − l)·0,78. Có khoảng giữa mà cả hai cùng mờ nên phải gạt hết cỡ; vùng đọc
  được chòm thật (`skyReadable`) chiếm ≥ 20% rãnh, và không có mức nào đọc được cả chòm thật lẫn chòm giả.
- **Đáp án:** ba chòm ngoài trời, mỗi ô một chòm, trái → phải: thập tự, tam giác, lưỡi câu (không theo thứ tự phím). Chòm giả
  (cái gáo) không nằm trong đáp án.
- **Chống lộ:** lúc đầu sao ngoài trời có độ hiện 0 (test). Chòm thật chỉ là chấm (không nét nối), cùng cỡ với 7 chấm lẻ mỗi ô
  và ~20 sao mờ; chấm lẻ cách chòm ≥ 52 và cách nhau ≥ 46 để không tự thành chòm khác (test). Phản chiếu và sao nằm ở chỗ khác nhau.
- **Gợi ý:** 2 hình + hình đáp án (thẻ tự thêm): núm trượt xuống kèm ngón tay, phòng tối dần và sao hiện (hoạt ảnh `act`); đọc ba ô
  đánh số 1–3 (nét nối mờ chỉ trên hình gợi ý).
- **Chưa có `help`** (chưa cần: cảnh chỉ có một núm gạt).
- **Hiện tượng mới:** kính cửa thành gương khi bên trong sáng hơn bên ngoài. Khác *Mặt hồ* (phản chiếu lộn ngược luôn
  có): ở đây phản chiếu là thứ che, phải giảm nó đi.

### Màn 2 · Hầm đom đóm ★3 (`glowTunnel.ts`) ✅
- **Sửa so với bản nháp:** bản nháp nói "chòm nằm trên vòng đồng tâm quanh một điểm" nhưng chòm là hình hai chiều nên không thể cùng cách một điểm.
  Cách làm đúng: **mỗi ấu trùng có độ trễ riêng** (loé sau khi sóng tới) bằng *thời điểm của chòm − thời gian sóng tới từ tâm*, nên từ đúng tâm cả
  chòm loé cùng một lúc, còn từ chỗ khác thì từng chấm loé rời nhau.
- **Cảnh:** vách hầm tối đen (không thấy ấu trùng nào lúc đầu), vài vòm đá, đường ray dưới đáy. Kéo chú cú tới đâu cũng được trong vách; **thả ra (hoặc chạm cú,
  hoặc Enter / Space) thì cú hú**: một vòng sóng mảnh lan ra (330 đơn vị/giây) và các ấu trùng loé (sáng nhất ở thời điểm của mình, mờ tuyến tính trong 0,14 s mỗi
  phía). Phím mũi tên dời cú 40 đơn vị. Hú lại thì làm lại từ đầu.
- **Dữ liệu:** `CENTER` = (800, 450); bốn chòm loé lúc 1,3 / 2,1 / 2,9 / 3,7 s: cái gáo, vương miện, tam giác, thập tự (không theo thứ tự phím). Một **chòm giả** (hình
  vuông) loé trọn từ `DECOY_CENTER` lúc 4,5 s, không nằm trong đáp án. 56 ấu trùng lẻ, cách chòm ≥ 40 và **không loé cùng lúc với chòm đang đọc** từ hai tâm (± 0,34 s).
- **Đo bằng số (test):** từ đúng tâm cả 4 chòm loé trọn (độ sáng trung bình ≥ 0,99, tối đa 1 chấm lẻ sáng cùng lúc); cách tâm 40 đơn vị thì ≥ 0,85 ở mọi hướng;
  cách 250 thì ≤ 0,75 và cách 400 thì ≤ 0,65 (xuống dần, nên có cảm giác "nóng / lạnh"). Mỗi chòm đọc rõ dọc theo đường thẳng từ tâm qua chòm đó, nhưng
  **thứ tự loé chỉ đúng khi đứng ở tâm** nên vẫn phải tìm ra tâm.
- **Gợi ý:** 3 hình + hình đáp án: cú trượt tới giữa hầm (ngón tay đi cùng); bốn chòm lần lượt loé (mô phỏng, vì tiếng hú thật quá nhanh để xem ở tốc độ gợi ý);
  bốn chòm đánh số 1–4 (nét nối mờ chỉ trên hình gợi ý).
- **Chưa có `help`:** cảnh chỉ có cú; bấm / thả cú là hú.

### Màn 3 · Hang cua ruộng lúa ★2 (`crabField.ts`) ✅
- **Cảnh (đã làm):** ruộng **9 × 6** ô (ô 124 đơn vị; bản nháp ghi 8 × 6 nhưng cần 9 cột để ba chòm đứng cạnh nhau, mỗi chòm một khối 3 cột), nền trời đêm và đồng lúa. **30 ô đã cày** (nền nâu, có vằn
  luống) hiện số **chấm bùn** xếp như xúc xắc (0–8) = số hang cua trong 8 ô quanh; **24 ô còn lúa**. Bên phải **hai ruộng mẫu 3 × 3** đã làm xong (ô giữa 2 chấm có 2 cờ; ô giữa 1 chấm có 1 cờ,
  chấm đã vàng) để tự học luật; không có chữ.
- **Cách chơi:** chạm ô lúa: **cờ hang** (hang tối + cờ đỏ) → **vòng "không có"** → lúa. Ô đã cày không chạm được. Chấm bùn chuyển **vàng** khi số cờ quanh ô đúng bằng số chấm. Xong khi mọi số đều vàng
  (`isSolved`): `ding` nhỏ và các hang đọng **nước trăng** (chấm sáng, không nét): đó là chòm. Trước đó cờ chỉ là cờ, không có chấm sáng nào. **Xong thì khoá ruộng** (không chạm hay Enter được nữa, ô bỏ khỏi thứ tự Tab) và **làm nổi đáp án**: các hang của ba chòm có quầng sáng, mọi ô còn lại (kể cả 3 hang lẻ và các số) mờ xuống 40% (người dùng yêu cầu 2026-10-17); không vẽ nét nối.
- **Dữ liệu:** 17 hang: ba chòm mỗi chòm một khối ba cột, **trái → phải: hình vuông (4 hang, bốn góc ô 3×3), tam giác (3), thập tự (5)**, cộng 3 hang lẻ (17 → 15 hang). Bản nháp ghi cái gáo, bản đầu làm lưỡi câu: lưỡi câu khi bấm vào lưới thành hình ngoằn ngoèo khó nhận (người dùng báo 2026-10-17), nên đổi sang hình vuông là hình rõ nhất trên lưới thô. Đáp án không theo thứ tự phím,
  các hang của hai chòm không kề nhau (test). Thứ tự hang trong mỗi chòm khớp thứ tự sao của `glyphs.ts` để vẽ nét nối trên hình gợi ý.
- **Một lời giải, suy luận được (test):** `countSolutions` duyệt mọi cách đặt hang trên 24 ô lúa: đúng 1; mọi ô lúa đều kề ít nhất một ô số; **9 ô lúa là ô an toàn** (nên cắm cờ tất cả ô lúa là sai);
  đổi bất kỳ ô lúa nào khỏi lời giải thì không xong. `deduce` giải bằng suy luận (một số quyết định, rồi hai số lồng nhau) và cần **ít nhất một bước "hai số"** (đúng 1 trong bản đã chọn).
  Bàn sinh bằng script Node: hang cố định, rồi bỏ dần số khỏi các ô an toàn mà vẫn giữ duy nhất và giải được bằng luật trên.
- **Gợi ý:** 3 hình + hình đáp án: chạm một ô chắc chắn có hang (cờ hiện); các cờ còn lại hiện lần lượt tới khi mọi số vàng; ba chòm đánh số 1–3 (nét nối mờ chỉ trên hình gợi ý).
- **Điện thoại:** ô ~26 px ở 390 px; không cuộn ngang. Chưa có `help` (luật học qua hai ruộng mẫu).

### Màn 4 · Bãi dồn toa ★4 (`shuntingYard.ts`)
- **Cảnh:** bãi ga có đường chính (sát sân ga), hai nhánh cụt (chứa 3 và 2 toa) và đường cụt kéo (đầu máy + 3 toa).
  Trên tường ga là **bảng thành phần đoàn tàu**: 4 hình bóng toa theo thứ tự (toa khách, toa thư, toa bồn, toa hàng kín).
  Có 6 toa, 2 toa thừa có hình bóng khác (toa than, toa sàn).
- **Luật:** đầu máy chạy qua lại (nút ◀ ▶ hoặc phím mũi tên), chạm vào toa để móc hay tháo, chạm cần ghi để đổi nhánh.
  Đầu máy kéo hoặc đẩy cả dãy toa đang móc; nhánh đầy thì không vào được.
- **Chống lộ:** toa không có đèn, cửa sổ tối. Chỉ khi đoàn tàu dừng ở sân ga **đúng cả 4 hình bóng theo thứ tự** thì
  đèn sân ga sáng và cửa sổ hiện chòm. Khớp một phần thì vẫn tối (không dò được từng toa).
- **Dữ liệu:** BFS trên trạng thái bãi: giải được, ít nhất ~14 lần thao tác, trạng thái đầu không khớp; có nút **Hoàn
  tác**.
- **Đáp án:** 4 chòm từ toa sát đầu máy đến toa cuối.
- **Gợi ý:** 2 hình + đáp án: một lần dồn mẫu (đầu máy kéo toa vào nhánh), đoàn tàu đã xong ở sân ga.
- **Khác *Kho thấu kính*:** kéo được, móc nhiều toa, giới hạn sức chứa nhánh, bài toán thứ tự chứ không phải đẩy vào chỗ.

### Màn 5 · Ống nhòm ngược ★2 (`reverseBinoculars.ts`)
- **Cảnh:** tàu chạy chậm trên cầu cạn; ngoài cửa sổ là thung lũng đêm rộng hơn cả cửa sổ. Trên bàn có ống nhòm.
- **Mẹo:** nâng ống nhòm (chạm) thì thấy phóng to, kéo để lia: chỉ thấy từng mái nhà sáng đèn, không đọc được gì. **Bấm lật
  ống nhòm** (nhìn đầu to): thung lũng thu nhỏ vào một vòng tròn, đèn các làng thành **4 chòm** và đường ray uốn khúc nối
  qua chúng, đầu máy ở một đầu.
- **Chống lộ:** mỗi chòm rộng hơn cửa sổ và hơn khung ống nhòm thuận (test `visibleDots(view)`: ở cửa sổ thường và ống
  nhòm thuận không khung nào chứa trọn một chòm).
- **Đáp án:** 4 chòm theo thứ tự đường ray đi qua, tính từ phía đầu máy (khác trái → phải).
- **Gợi ý:** 2 hình + đáp án: ống nhòm tự lật, đọc dọc đường ray.
- **Hiện tượng mới:** **tỉ lệ**: cái quá lớn chỉ đọc được khi thu nhỏ. Khác *Chỉnh tiêu cự* (độ nét theo độ sâu).

### Màn 6 · Ghi tự lật ★4 (`flipSwitches.ts`)
- **Cảnh:** sơ đồ bãi ga trên bàn điều độ: một đường vào, 6 ghi (cần gạt hai vị trí), 4 kho mỗi kho có hình bóng hàng
  (gỗ, than, bồn, thư). Bên trái là hàng 4 chuyến tàu chờ (thứ tự cố định), mỗi chuyến chở một loại hàng.
- **Luật:** đặt các cần ghi rồi bấm chạy. Tàu đi theo ghi, và **mỗi ghi lật sang phía kia ngay sau khi một tàu đi qua theo
  chiều mũi ghi** (tàu đi qua từ phía nhánh thì không lật). Tàu thứ hai gặp ghi đã đổi.
- **Phản hồi:** xem đường tàu đi (vệt bánh trên sơ đồ ở lại sau khi chạy, nên chạy sai cũng biết sai ở đâu). Chỉ khi cả
  4 tàu vào đúng kho thì cửa kho mở và hiện chòm.
- **Duy nhất:** test duyệt 64 cách đặt → đúng 1; và nếu ghi **không** lật thì 0 cách đúng (buộc phải hiểu luật lật).
  Trong 64 cách, ít nhất 10 cách đưa đúng 2–3 tàu (bẫy gần đúng).
- **Đáp án:** chòm trên cửa 4 kho, theo thứ tự tàu xuất phát.
- **Gợi ý:** 3 hình + đáp án: đặt các cần, tàu thứ nhất chạy (ghi lật theo), cả 4 tàu đã vào kho.
- **Khác *Bảng mạch sao*:** cổng logic không có trạng thái; ở đây máy **nhớ** (mỗi chuyến đổi máy cho chuyến sau).

### Màn 7 · Than vừa đủ ★3 (`coalRoute.ts`)
- **Cảnh:** bản đồ tuyến 12 ga trên tấm gỗ; mỗi đoạn ray có 1–4 vạch tà vẹt (= số xẻng than). Ga đầu có đầu máy, ga cuối
  có xưởng. Thùng than của đầu máy có **N cục than** (ví dụ 15). 7 ga có biển chòm sao.
- **Luật:** chạm ga kề để đi tiếp, chạm ga trước để lùi; mỗi đoạn đi qua lấy bớt than. Không đi lại một ga. Tới xưởng
  **vừa hết than** thì lò tắt đúng lúc và cửa xưởng mở; tới nơi còn thừa than thì cửa không mở, hết than giữa đường thì tàu
  dừng.
- **Duy nhất:** test duyệt mọi đường đơn: đúng một đường dài N; đường ngắn nhất ngắn hơn N; có đường dài N − 1 và N + 1
  (bẫy).
- **Đáp án:** 4 chòm của các ga có biển chòm mà đường đúng đi qua, theo thứ tự đi qua (3 ga có biển chòm còn lại không
  nằm trên đường).
- **Gợi ý:** 2 hình + đáp án: đầu máy chạy trọn đường (than giảm dần), đọc 4 ga.

### Màn 8 · Ván hạt sen ★5 (`lotusNim.ts`)
- **Cảnh:** toa ăn. Bàn có 4 bát hạt sen, mỗi vành bát vẽ một chòm (chấm). Đối diện là bác lửng soát vé. Cạnh bàn là
  **sổ ván**: mỗi nước của cú ghi một ô (vẽ lại chòm của bát cú vừa bốc).
- **Luật (không viết ra, học bằng cách chơi):** đến lượt, chạm một hạt trong một bát thì bốc hạt đó và mọi hạt bên trên
  (một nước = một bát, ít nhất một hạt). Ai bốc hạt cuối cùng thắng. Cú đi trước. Thua thì bát đầy lại, sổ ván xoá.
- **Đối thủ:** khi có nước thắng, bác lửng đi nước thắng đầu tiên; khi không có, bốc 1 hạt ở bát nhiều nhất (cố định để
  ván lặp lại được).
- **Dữ liệu:** kiểm khả thi: bốn bát **1, 2, 3, 6 hạt** (sắp xếp lại trên bàn) cho **đúng một nước thắng ở mỗi lượt** của
  cú, cú đi 4 nước. Test duyệt cây trò chơi: đi lệch nước thắng bất kỳ thì bác lửng thắng.
- **Đáp án:** 4 ô trên sổ ván sau khi thắng (có thể lặp chòm, ví dụ bát 4, bát 1, bát 3, bát 3 theo thứ tự trên bàn).
- **Khó ở đâu:** phải tìm ra chiến lược (cặp bát bằng nhau thì bắt chước; tổng XOR). Màn khó nhất về tư duy, nhưng chỉ 4
  nước và ván ngắn nên thử – sai – học được.
- **Gợi ý:** 3 hình + đáp án: nước đầu (hạt tự nhấc), làm tương tự (bác lửng đáp lại), sổ ván đầy và đọc.
- **Cần duyệt:** có cho `help` (một câu: "ai bốc hạt cuối thắng") hay để người chơi tự học qua thua?

### Màn 9 · Domino toa hàng ★2 (`dominoCar.ts`)
- **Cảnh:** sàn toa hàng, đường domino rẽ hai lần thành 4 nhánh dài ngắn khác nhau, cuối mỗi nhánh một chuông nhỏ. Có 5
  chỗ trống trên đường, khay có 3 quân dự phòng.
- **Luật:** kéo quân dự phòng vào chỗ trống, chạm quân đầu để đẩy. Chuỗi đổ theo thời gian thật (quân đổ cách nhau ~0,08 s),
  nên **nhánh ngắn tới chuông trước**. Nút dựng lại.
- **Chống lộ:** chòm khắc trong lòng chuông chỉ hiện khi **cả 4 chuông kêu trong một lần đẩy** (lá cờ nhỏ trên khay
  dựng lên); kêu thiếu thì chuông không mở.
- **Duy nhất:** test duyệt C(5,3) = 10 cách đặt → đúng 1 cách tới đủ 4 chuông; thứ tự kêu do độ dài nhánh quyết định.
- **Đáp án:** 4 chòm theo thứ tự chuông kêu (chuông lắc thấy được khi tắt tiếng).
- **Gợi ý:** 2 hình + đáp án: một quân trượt vào chỗ trống, chuỗi đổ tới các chuông.

### Màn 10 · Đường ray vòng ★4 (`railLoop.ts`)
- **Cảnh:** sàn chơi 6×6 ô; một số ô có 0–3 chấm. 7 đèn ga nhỏ ở các đỉnh lưới, mỗi đèn có biển chòm. Một đầu máy đồ chơi
  đặt sẵn trên một cạnh (là ray cố định, quay về một chiều).
- **Luật (học qua đèn):** chạm cạnh: ray → dấu chéo → trống (hoặc kéo ngón tay vẽ ray). Ray phải là **một vòng khép kín**,
  không rẽ nhánh; số chấm trong ô = số cạnh ô có ray. Chấm vàng khi ô đủ ray.
- **Xong:** vòng khép kín và mọi số đúng → tàu đồ chơi chạy theo chiều đầu máy, đèn ga trên vòng sáng khi tàu đi qua.
- **Duy nhất:** test bộ giải: đúng một vòng, giải được bằng suy luận; 4 trong 7 đèn ga nằm trên vòng.
- **Đáp án:** 4 chòm theo thứ tự tàu đi qua, từ đầu máy.
- **Gợi ý:** 2 hình + đáp án: ray hiện dần, tàu chạy một vòng.

### Màn 11 · Ai nói thật ★3 (`honestPassengers.ts`)
- **Cảnh:** khoang ghế ngồi, 6 hành khách (thỏ, sóc, nhím, ếch, rùa, chuột) ngồi trái → phải, mỗi người úp một vé. Trên
  đầu mỗi người là một bong bóng lời nói **bằng hình**: mặt người được nói tới + mặt trời (người đó nói thật) hoặc mặt trăng
  (nói dối); hoặc hai mặt + dấu "=" (hai người cùng loại) hay "≠".
- **Luật:** người nói thật luôn nói đúng, người nói dối luôn nói sai. Chạm hành khách để đặt thẻ mặt trời / mặt trăng.
  Không có đèn từng người (tránh dò từng người); chỉ khi cả 6 thẻ nhất quán thì 4 người nói thật lật vé.
- **Duy nhất:** test duyệt 64 cách gán → đúng 1; bỏ bất kỳ câu nào thì nhiều hơn 1.
- **Đáp án:** chòm trên vé của 4 người nói thật, theo ghế trái → phải.
- **Gợi ý:** 2 hình + đáp án: thẻ hiện dần, vé lật.
- **Khác *Ai cầm đèn nào* và *Đêm rước đèn*:** ở đó là xếp người với vật hoặc tìm một nhân chứng sai; ở đây lời nói
  chéo nhau về chính sự thật thà của nhau, nhiều người dối cùng lúc.
- **Cần duyệt:** nghĩa của mặt trời / mặt trăng không đọc được từ cảnh → đề xuất `help` một câu (theo ngoại lệ quy tắc 8).

### Màn 12 · Ga cuối ★5 (`terminalStation.ts`)
- **Cảnh:** bàn điều độ ga cuối. 4 chuyến tàu vào ga theo thứ tự cố định; mỗi chuyến có **hình bóng toa** và **thùng than
  còn k cục**. Bãi có 6 ghi tự lật (luật màn 6), đoạn ray có vạch tà vẹt (luật màn 7), 4 sân ga mỗi sân treo một **bảng
  hình bóng** (luật màn 4).
- **Luật:** chỉ đặt các cần ghi rồi chạy. Tàu đúng là tàu vào sân có hình bóng của nó **và** tới nơi vừa hết than.
- **Suy luận:** từ số than của mỗi tàu suy ra nó phải đi đường dài bao nhiêu → đường nào → ghi phải ở vị trí nào lúc tàu đó
  qua → (lùi qua các lần lật) vị trí ban đầu của ghi.
- **Duy nhất:** test duyệt 64 cách → đúng 1. Bỏ điều kiện than thì nhiều hơn 1 (than là manh mối cần thiết).
- **Đáp án:** chòm trên đèn 4 sân ga, theo thứ tự tàu vào ga (khác thứ tự sân trái → phải).
- **Gợi ý:** 3 hình + đáp án: đặt cần, tàu đầu chạy (than giảm, ghi lật), cả bốn vào ga.
- **Khác *Mở vòm*:** không phải ba bảng nối tiếp, mà ba luật **cùng lúc trên một máy**.

## 5. Kiểm tra trùng lặp

| Màn | Hiện tượng / thể loại | Gần nhất đã có | Khác ở đâu |
|---|---|---|---|
| Cửa kính toa đêm | kính thành gương theo độ sáng hai bên | Mặt hồ, Mây đêm | phản chiếu là thứ che, giảm đèn trong để thấy ngoài |
| Hầm đom đóm | sóng lan đồng tâm, cùng khoảng cách thì cùng lúc | Hoàng hôn (thứ tự sáng) | không kéo thời gian; tìm tâm trong không gian |
| Hang cua ruộng lúa | Minesweeper | Thẻ đục lỗ (lưới + số) | số đếm ô kề, không phải dải hàng/cột |
| Bãi dồn toa | shunting | Kho thấu kính (Sokoban) | kéo được, móc nhiều toa, sức chứa nhánh |
| Ống nhòm ngược | tỉ lệ, thu nhỏ | Chỉnh tiêu cự | không có độ nét; cái cần thấy lớn hơn khung |
| Ghi tự lật | máy có trạng thái | Bảng mạch sao | mạch không nhớ; ở đây mỗi chuyến đổi máy |
| Than vừa đủ | đường đi đúng ngân sách | Cú lên dây | chọn đường trên đồ thị theo tổng, không phải xếp lệnh |
| Ván hạt sen | trò chơi đối kháng | (chưa có) | lần đầu có đối thủ |
| Domino toa hàng | phản ứng dây chuyền có thời gian | Hộp chuông (thứ tự gõ) | thứ tự do độ dài nhánh, người chơi lắp đường |
| Đường ray vòng | Slitherlink | Dây đồng nối sao (Hashi) | một vòng kín quanh số ô, không phải nối đảo |
| Ai nói thật | người nói thật / nói dối | Ai cầm đèn nào, Đêm rước đèn | lời nói về nhau, nhiều người dối |
| Ga cuối | ba luật cùng lúc | Mở vòm | một máy, không chuỗi bảng |

Khi làm xong màn nào thì chép dòng của màn đó vào `docs/GAME_DESIGN.md` mục 4.2.

## 6. Phương án chủ đề khác (nếu không chọn tàu đêm)
- **Làng chài và biển đêm:** thuyền thúng, lưới, thuỷ triều, sứa phát sáng. Hợp với màn 2 (sóng), màn 3 (ruộng muối thay
  ruộng lúa); mất màn 4, 6, 12 (đường ray).
- **Rừng tràm đom đóm:** thiên nhiên, tiếng ếch, nước ngập. Đẹp nhưng trùng chủ đề với đom đóm làm gợi ý.

Đề xuất giữ **tàu đêm**: đường ray cho nhiều cỗ máy mới (dồn toa, ghi, than) và bản đồ chương thành tuyến đường rất tự nhiên.

## 7. Làm thế nào, theo thứ tự
1. Người dùng duyệt chủ đề, nhịp răng cưa và danh sách 12 màn (cùng hai câu hỏi `help` ở màn 8, 11).
2. Thêm `CHAPTER_5` (rỗng → dần đủ), `LEVEL_STARS[4]` (12 vị trí theo đường ray), chương mới trong `chapters.ts` với
   `steady: true`. Dấu ga trên vé làm sau, khi có đủ vài màn.
3. Làm **tuần tự từng màn**, dừng sau mỗi màn để người dùng thử (như Chương 4). Mỗi màn: logic thuần + test duy nhất và
   chống lộ, gợi ý 2–4 hình, chơi thử Playwright ở desktop, điện thoại dọc và ngang.
4. Sinh bàn (màn 3, 4, 6, 7, 10, 12) bằng script Node trong scratchpad, chép dữ liệu cố định vào file màn; test duyệt lại.

## 8. Nguồn
- [12 Best Puzzle Games on Steam (2026) — GameGeeker](https://gamegeeker.com/editors-picks/best-puzzle-games-on-steam-2026?market=CA)
- [12 Best Hidden Puzzle Gems Worth Discovering (2026) — GameGeeker](https://gamegeeker.com/editors-picks/hidden-puzzle-gems-worth-discovering?market=FR)
- [logicpuzzle — CTAN (danh sách thể loại đố lưới)](https://ctan.org/pkg/logicpuzzle?lang=en)
