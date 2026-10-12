# Chương 2 · Căn gác của cú — Bản thiết kế

> **Trạng thái:** màn 1 (Lông cánh) đã duyệt và commit; màn 2 (Cửa sổ sương) đã duyệt và commit; màn 3 (Khay bi) đã duyệt và commit; màn 4 (Hộp chuông) đã duyệt và commit; màn 5 (Tổ cú con) đã duyệt và commit; màn 6 (Đèn kéo quân) đã làm xong, chờ người dùng kiểm tra; màn 7–10 chưa làm. Làm tuần tự từng màn,
> dừng sau mỗi màn để người dùng xác nhận. Chi tiết hình học màn 1 đã đổi so với bản nháp ban đầu: cánh là một tấm
> giấy lớn có 3 hốc hình lông, lông đứng trong lọ (mũi hướng lên), một số sao in trên cánh, số còn lại mang trên lông.

> Bản nháp để người dùng duyệt trước khi làm. Khi duyệt xong, nội dung chính được gộp vào `docs/GAME_DESIGN.md`
> (mục 4) và `docs/CHANGELOG.md`; file này giữ làm bản đặc tả chi tiết từng màn.

---

## 1. Nghiên cứu: HER TREES : PUZZLE DREAM làm gì mà Chương 1 chưa có

Đọc lại walkthrough các tầng của HER TREES (nguồn ở mục 9), có bốn kiểu câu đố mà Chương 1 gần như chưa dùng:

| Kiểu của HER TREES (mô tả chung, không chép câu đố cụ thể) | Chương 1 đang làm | Rút ra cho Chương 2 |
|---|---|---|
| **Ghép mảnh vào chỗ trống**: đặt lá rời vào đúng hình lá trống, phần nét trên mảnh nối với phần nét trên nền thì ký hiệu mới thành hình | sao hiện nguyên vẹn sau khi làm mẹo | hình chỉ thành khi **hai nửa ghép lại**; riêng từng nửa không đọc được |
| **Đếm**: số chấm, số tab, số nhánh quyết định thứ tự | thứ tự gần như luôn là pha trăng | thứ tự theo **con số đếm được** (vạch, chấm, lần chớp, vòng quay), kích thước, tầng, tốc độ |
| **Vị trí trên lưới 3×3**: lưới đánh số trong cảnh trùng với lưới phím | đáp án luôn là hình chòm sao | **đáp án là vị trí/con số**: ô số mấy thì bấm phím số mấy, không cần thấy hình sao |
| **Hình tưởng tượng**: chữ hiện ra từ khoảng trống, mép chung, chấm rời; game không tô sáng hay nối nét | chòm lộ ra thì sáng lên, có nét nối, có tiếng chuông | **không tô sáng, không nét nối, không tiếng "lộ chòm"**: người chơi tự nối chấm trong đầu |

Ngoài ra, HER TREES không có lời thoại, mỗi cảnh một ý, và thường bắt người chơi "kiểm lại" bằng một chi tiết thứ hai
(một dấu thứ tự, một mũi tên). Chương 2 giữ tinh thần đó nhưng dùng đồ vật và hiện tượng riêng.

**Không sao chép:** không lá cây, không cây, không ghép bóng con vật, không tấm che đục lỗ đặt lên hình, không mê cung
dò đường, không chồng hai hình cho ra lưới đánh số. Phần "ghép mảnh" dùng **lông vũ** (đúng chủ đề cú) và **trang sổ
rách**.

---

## 2. Chương 2 khác Chương 1 thế nào

| | Chương 1 · Những chòm sao lạc | Chương 2 · Căn gác của cú |
|---|---|---|
| Bối cảnh | ngoài trời: mây, hồ, đồi, bầu trời | **trong nhà**: gác mái của cú, cửa sổ nhìn ra biển đêm; đèn dầu vàng ấm, gỗ, giấy, đồng thau |
| Bảng màu | xanh đêm + vàng sao | thêm gỗ `#3a2a22`, đồng `#b98a4a`, ánh đèn `#f4c66a`; màu đêm chỉ còn sau ô cửa |
| Cách chòm lộ ra | sao sáng lên, có nét nối, chuông kêu | **chỉ có chấm, cùng kiểu với vật nhiễu**, không sáng thêm, không nét, không chuông |
| Kiểu đáp án | luôn là hình chòm sao | **xen kẽ**: 5 màn đọc hình (tưởng tượng từ chấm), 4 màn đọc **con số / vị trí**, 1 màn tổng hợp |
| Quy tắc thứ tự | trái → phải, pha trăng, thứ tự xuất hiện | **không dùng pha trăng**: đếm vạch/chấm/lần chớp, kích thước, tầng trên → dưới, tốc độ, thứ tự trong dây chuyền |

### 2.1 Quy tắc riêng của Chương 2 (bổ sung vào CLAUDE.md khi duyệt)
1. **Không tự tô sáng, không vẽ nét nối.** Khi làm đúng mẹo, chấm sao chỉ *nằm đúng chỗ*: cùng màu, cùng cỡ với chấm
   nhiễu xung quanh. Không filter glow, không đổi màu, không `sound.chime()` khi một chòm "lộ". Vẫn giữ tiếng tách
   nhỏ khi vật khớp vào chỗ (đó là phản hồi thao tác, không phải phản hồi lời giải).
2. **Chòm chỉ bằng chấm** thì tránh cặp dễ nhầm: không dùng *mũi tên* (4 chấm trông như kim cương); hình vuông và kim
   cương không xuất hiện cùng màn trừ khi khung cảnh cho biết rõ chiều đứng.
3. **Con số không phải chữ.** Số trong cảnh là thứ đếm được: chấm ngón tay, vạch, lỗ, lần chớp, vòng quay, cú con.
   Không viết chữ số Ả Rập trong cảnh (giữ quy tắc "không chữ trong cảnh").
4. **Con số → phím** phải suy ra được ngay trong cảnh, theo một trong hai cách:
   - **Lưới 3×3 trong cảnh** (cửa sổ 9 ô, 9 quả chuông, 9 hốc tổ) trùng bố cục bàn phím: ô ở đâu thì bấm phím ở đó.
   - **Bảng tra trong cảnh**: tấm đồng có 9 lỗ xếp 3×3 kèm số chấm 1–9, hoặc trang sổ ghi số cạnh từng chòm (dạng
     chấm). Không bao giờ bắt người chơi tự biết "số 6 là phím thứ 6".
5. Các quy tắc chung của Chương 1 vẫn áp dụng: không lộ đáp án lúc đầu (chụp ảnh, có test), có bẫy ở màn khó, vật thao
   tác luôn tìm thấy, chơi được bằng chạm 360 px và bàn phím, không dùng màu làm manh mối duy nhất, gợi ý một thẻ giải
   cả màn.

### 2.2 Đường dạy (học bằng cách chơi, không có hướng dẫn)
- Màn 1 dạy "**chấm không nối, tự nối trong đầu**" (chỉ 3 chòm, dễ thấy).
- Màn 2 dạy "**ô trong lưới 3×3 = phím cùng vị trí**" và "**đếm chấm = thứ tự**".
- Màn 4–5 lặp lại ý lưới 3×3 bằng âm thanh và sinh vật. Màn 8 đưa vào **bảng tra số 1–9**. Màn 10 trộn cả ba.

---

## 3. Danh sách màn

Phím (thứ tự đọc 1–9): 1 tam giác · 2 hình vuông · 3 vương miện · 4 thập tự · 5 thắt lưng · 6 cái gáo · 7 kim cương ·
8 mũi tên · 9 lưỡi câu.

| # | Màn | Mẹo (hiện tượng) | Thao tác | Kiểu đáp án | Thứ tự | Chòm | Bẫy |
|---|---|---|---|---|---|---|---|
| 1 | Lông cánh | ghép mảnh: chấm trên lông + chấm trên cánh | kéo | hình (chấm) | số vạch trên lông 1→3 | 3 | không |
| 2 | Cửa sổ sương | hơi nước làm hiện dấu ngón tay cũ | kéo | vị trí 3×3 | số chấm ngón tay 1→3 | 3 | ô có vết bàn tay, không chấm |
| 3 | Khay bi | trọng lực: bi lăn vào hõm ẩn | kéo nghiêng | hình (chấm) | số lỗ ở góc khay 1→4 | 4 | hõm lẻ giữ bi thừa |
| 4 | Hộp chuông | lên dây cót, búa gõ 9 chuông 3×3 | xoay chìa | vị trí 3×3 + nốt | thứ tự gõ | 4 | lên dây chưa đủ thì dừng giữa chừng; chuông ở nắp |
| 5 | Tổ cú con | mồi nhử: cú con thò đầu theo con bướm | kéo | vị trí 3×3 | cú con nhỏ → lớn | 4 | dơi treo ngược, gối lông |
| 6 | Đèn kéo quân | lưu ảnh: quay đủ nhanh thì chấm các khung chồng lên | xoay + giữ | hình (chấm) | tốc độ chậm → nhanh | 4 | quá nhanh thì nhoè hết |
| 7 | Hải đăng | đối chiếu hải đồ (nhìn từ trên) với cửa sổ (nhìn ngang) | quan sát + bấm | hình (chấm trên hải đồ) | số lần chớp 1→4 | 4 | 2 hải đăng tắt, đèn thuyền chớp loạn |
| 8 | Hộp bánh răng | tỉ số răng: bánh nhỏ quay nhiều vòng hơn | xoay tay quay | số 1–9 → bảng tra | thứ tự trong dây chuyền | 4 | bánh trung gian không có dấu |
| 9 | Đồ chơi treo nôi | cân bằng đòn bẩy: thăng bằng thì sao rủ đúng chỗ | kéo móc treo | hình (chấm) | tầng trên → dưới | 4 | thăng bằng sai cách vẫn ngang nhưng sao lệch |
| 10 | Bàn của cú (tổng hợp) | ghép trang sổ rách → bảng tra; đếm trên tranh | kéo + quan sát | số → bảng tra (hình chấm) | khung tranh nhỏ → lớn | 4 | ghép trang sai chiều vẫn liền mép |

Độ khó tăng dần: 3 → 4 chòm từ màn 3; từ màn 5 có vật nhiễu cùng kiểu; màn 7–10 phải ghép hai nguồn thông tin.

---

## 4. Chi tiết từng màn

### Màn 1 · Lông cánh (`featherWing.ts`)
- **Cảnh:** bức tranh giấy cắt hình một cánh cú trên tường, có 3 chỗ trống hình lông (dài, vừa, ngắn). Trên bàn có 3
  chiếc lông rời. Cánh và lông đều có đốm trắng như lông cú thật.
- **Mẹo:** kéo mỗi lông vào chỗ trống vừa hình (chỉ khớp một chỗ, thả gần thì tự hút vào). Đốm trên lông nối tiếp đốm
  trên cánh; khi lông nằm đúng chỗ, các đốm hai bên hợp thành một chòm **chỉ bằng chấm**. Lông còn có 1, 2 hoặc 3 vạch
  sẫm ngang.
- **Đọc:** theo số vạch: 1 vạch → vương miện, 2 vạch → tam giác, 3 vạch → lưỡi câu. Vị trí trái → phải trên cánh là
  tam giác, lưỡi câu, vương miện (khác thứ tự đáp án).
- **Đáp án:** `crown, triangle, hook`.
- **Không lộ trước:** mỗi lông chỉ mang 1–2 đốm của chòm, cánh mang phần còn lại xen giữa các đốm trang trí; riêng từng
  bên không ra hình nào.
- **Hàm thuần:** `featherSlot(feather, x, y)` → slot khớp hoặc `null`; `visibleSpots(placed)`.
- **Gợi ý (3 hình):** lông đầu tiên tự trượt vào chỗ ("làm tương tự với hai lông kia") · cánh đã đủ lông, quầng sáng
  ở các vạch · đáp án.

### Màn 2 · Cửa sổ sương (`frostWindow.ts`)
- **Cảnh:** cửa sổ 9 ô kính xếp 3×3, bên ngoài là đêm. Trên bệ cửa có ấm trà bốc hơi.
- **Mẹo:** kéo ấm trà lại gần ô kính: ô đó mờ hơi nước, và **dấu ngón tay ai đó vẽ từ trước** hiện ra trên lớp sương
  (hiện tượng có thật: dầu từ ngón tay làm hơi nước đọng khác đi). Ba ô có 1, 2, 3 chấm ngón tay; một ô có vết cả bàn
  tay (nhiễu); các ô khác chỉ mờ trơn. Sương tan sau ~4 giây.
- **Đọc:** ô có 1 chấm → phím cùng vị trí, rồi 2 chấm, rồi 3 chấm. Ô 6 (1 chấm), ô 1 (2 chấm), ô 8 (3 chấm).
- **Đáp án:** `dipper, triangle, arrow` (không phải hình sao nào cả: lần đầu người chơi nhận ra *vị trí* là đáp án).
- **Không lộ trước:** kính trong suốt, dấu ngón tay có `display: none` khi ô chưa mờ.
- **Hàm thuần:** `fogAt(kettle, pane)` (0..1), `marksVisible(fog)`.
- **Gợi ý (3 hình):** ấm trà tự trượt tới một ô, ô mờ ("đưa ấm qua từng ô") · cả 9 ô cùng mờ, quầng sáng ở 3 ô có chấm ·
  đáp án.

### Màn 3 · Khay bi (`marbleTray.ts`)
- **Cảnh:** khay gỗ vuông vẽ hoa văn rối, 20 viên bi thuỷ tinh lăn tự do. Mỗi góc khay khoan 1, 2, 3 hoặc 4 lỗ nhỏ.
- **Mẹo:** kéo cạnh khay (hoặc phím mũi tên) để nghiêng về một góc. Bi lăn về góc đó và **rơi vào các hõm khắc chìm**
  khó thấy trên hoa văn; khi khay về phẳng, bi nằm yên trong hõm, xếp thành chòm chỉ bằng chấm. Mỗi góc một chòm; nghiêng
  sang góc khác thì bi rời đi.
- **Đọc:** góc 1 lỗ → thập tự, 2 lỗ → hình vuông, 3 lỗ → lưỡi câu, 4 lỗ → tam giác.
- **Đáp án:** `cross, square, hook, triangle`.
- **Bẫy:** mỗi góc có 1–2 hõm lẻ giữ thêm bi (chấm thừa) nằm hơi tách khỏi chòm.
- **Hàm thuần:** `restingMarbles(tiltCorner)` → vị trí bi; test chòm thật luôn có đủ chấm, chấm thừa không nằm trên
  đường của chòm.

### Màn 4 · Hộp chuông (`bellBox.ts`)
- **Cảnh:** hộp gỗ có mặt kính, bên trong 9 quả chuông xếp 3×3 (đúng bố cục và đúng nốt của bàn phím) và một trục có
  búa nhỏ. Bên hông có chìa lên dây cót. Trên nắp hộp có thêm một chuông trang trí.
- **Mẹo:** xoay chìa (kéo vòng tròn hoặc giữ phím). Mỗi vòng cót cho một nốt: lên dưới 4 vòng thì giai điệu dừng giữa
  chừng. Đủ 4 vòng thì búa gõ lần lượt 4 chuông, chuông rung (thấy được khi tắt tiếng), rồi chuông trên nắp kêu kết thúc
  (nhiễu: chuông ngoài lưới).
- **Đọc:** vị trí các chuông theo thứ tự bị gõ: 5, 9, 2, 7. Người có nghe thì thấy thêm: bàn phím phát đúng nốt đó.
- **Đáp án:** `belt, hook, square, diamond`.
- **Hàm thuần:** `notesPlayed(windTurns)`, `bellAt(time)`.

### Màn 5 · Tổ cú con (`owletNest.ts`)
- **Cảnh:** vách gỗ 9 hốc tổ 3×3, tối om. Một con bướm đêm giấy treo trên que.
- **Mẹo:** kéo bướm lướt qua các hốc: hốc có cú con thì cú con thò đầu ra, mắt dõi theo bướm, rồi rụt lại khi bướm đi.
  Bốn cú con **khác cỡ rõ rệt**. Hốc 1 có con dơi treo ngược cũng thò ra (không phải cú: tai nhọn, lộn ngược); hốc 9
  có búi lông tròn trông như cú nhưng không có mắt và không động đậy.
- **Đọc:** cú con nhỏ nhất → lớn nhất: hốc 8, 3, 6, 4.
- **Đáp án:** `arrow, crown, dipper, cross`.
- **Hàm thuần:** `peeking(lure)` → các hốc đang thò đầu.

### Màn 6 · Đèn kéo quân (`spinLantern.ts`)
- **Cảnh:** đèn kéo quân bằng giấy 4 tầng; mỗi tầng có khe hở và 8 khung hình, mỗi khung chỉ một chấm ở chỗ khác nhau.
  Đứng yên hoặc quay chậm thì chỉ thấy chấm nhảy loạn.
- **Mẹo:** xoay cánh quạt trên đỉnh (kéo vòng, hoặc thắp nến cho đèn tự quay rồi kéo để tăng tốc). Ở một khoảng tốc độ,
  **ảnh lưu lại trên mắt** làm các chấm của một tầng hiện cùng lúc thành chòm (chỉ chấm). Mỗi tầng chỉ rõ ở một khoảng
  tốc độ riêng; quay quá nhanh thì mọi tầng nhoè thành vòng.
- **Đọc:** theo thứ tự hiện ra khi tăng dần tốc độ: kim cương, thắt lưng, vương miện, lưỡi câu (tầng 3, 1, 4, 2).
- **Đáp án:** `diamond, belt, crown, hook`.
- **Không lộ trước:** lúc đứng yên mỗi tầng chỉ thấy 1 chấm.
- **Hàm thuần:** `afterimage(speed, tier)` → độ rõ 0..1.

### Màn 7 · Hải đăng (`lighthouses.ts`)
- **Cảnh:** cửa sổ gác mái nhìn ra bờ biển đêm, xa xa có 6 ngọn hải đăng. Trên bàn là hải đồ (nhìn từ trên) đánh 6 hải
  đăng; cạnh mỗi hải đăng vẽ một chòm chỉ bằng chấm. Tấm rèm che nửa cửa sổ.
- **Mẹo:** kéo rèm ra để thấy hết bờ biển. 4 ngọn đang sáng chớp theo nhóm 1, 2, 3, 4 lần rồi nghỉ (như hải đăng thật có
  "chữ ký" riêng); 2 ngọn tắt. Người chơi phải **đối chiếu vị trí** từ hải đồ (nhìn từ trên, có mũi đất, đảo) sang cảnh
  nhìn ngang. Một con thuyền cũng nhấp nháy đèn không đều (nhiễu).
- **Đọc:** hải đăng chớp 1 lần → chòm vẽ cạnh nó trên hải đồ, rồi 2, 3, 4 lần.
- **Đáp án:** `hook, square, triangle, cross`. Hai hải đăng tắt mang chòm giả (`dipper`, `crown`).
- **Hàm thuần:** `flashOn(lighthouse, t)`; test nhóm chớp đếm được (khoảng nghỉ ≥ 2 lần khoảng giữa hai chớp).

### Màn 8 · Hộp bánh răng (`gearBox.ts`)
- **Cảnh:** hộp đồng mở nắp, bên trong là chuỗi 5 bánh răng nối nhau từ tay quay; 4 bánh có chấm sơn trên một răng, bánh
  thứ 3 (trung gian) không có. Mặt trước hộp gắn tấm đồng có **9 lỗ xếp 3×3, cạnh mỗi lỗ khắc 1–9 chấm** theo thứ tự đọc
  (bảng tra số → phím).
- **Mẹo:** quay tay quay **đúng một vòng** (tay quay có chốt chặn sau mỗi vòng). Bánh càng nhỏ quay càng nhiều vòng; đếm
  số lần chấm sơn đi qua kim chỉ ở đỉnh mỗi bánh: 4, 9, 1, 6 theo thứ tự bánh tính từ tay quay.
- **Đọc:** số vòng → lỗ có bấy nhiêu chấm → phím cùng vị trí.
- **Đáp án:** `cross, hook, triangle, dipper`.
- **Không lộ trước:** bánh đứng yên thì không có số nào; số răng vẽ được nhưng quá nhiều để đếm (gợi ý khéo cho ai thích
  tính tỉ số).
- **Hàm thuần:** `turnsFor(gear, crankTurns)`.

### Màn 9 · Đồ chơi treo nôi (`mobile.ts`)
- **Cảnh:** đồ chơi treo trên nôi cú con: 4 tầng thanh ngang, mỗi đầu thanh treo vài ngôi sao gỗ. Các thanh đang nghiêng
  lệch nên sao lộn xộn. Trên bàn có vài quả nặng nhỏ hình hạt dẻ.
- **Mẹo:** kéo điểm móc dây trên mỗi thanh (hoặc treo thêm quả nặng) cho thanh **thăng bằng** (mô-men hai bên bằng nhau).
  Khi thanh nằm ngang, sao treo dưới nó rủ đúng chỗ thành một chòm chỉ bằng chấm.
- **Đọc:** tầng trên → dưới: cái gáo, hình vuông, vương miện, thắt lưng.
- **Đáp án:** `dipper, square, crown, belt`.
- **Bẫy:** thêm quả nặng ở cả hai bên vẫn làm thanh ngang nhưng dây dài ngắn khác nên sao lệch: chỉ một cách cân bằng ra
  hình đúng.
- **Hàm thuần:** `tilt(bar, hookX, weights)`, `starPositions(bars)`.

### Màn 10 · Bàn của cú (tổng hợp, `owlDesk.ts`)
- **Cảnh:** bàn làm việc của cú. Sổ sao bị xé thành 3 dải; khi ghép lại, trang sổ có 8 chòm **chỉ bằng chấm** (không có
  mũi tên, để khỏi nhầm với kim cương; trang sổ có chiều đứng rõ nên vuông và kim cương phân biệt được), cạnh mỗi chòm là
  một số chấm mực từ 1–9 (bỏ số 5), đánh **lộn xộn**, không theo thứ tự phím. Trên tường có 4 khung tranh cỡ khác nhau, mỗi
  tranh vẽ cú con đang ôm một số hạt dẻ.
- **Mẹo:** ghép 3 dải giấy (mép rách phải khớp; một dải lật ngược vẫn liền mép nhưng chấm mực bị úp, phải lật lại),
  đọc bảng tra. Đếm hạt dẻ trên mỗi tranh.
- **Đọc:** tranh nhỏ → lớn: 7, 2, 9, 4 hạt → tra sổ → chòm (người chơi phải nhận ra chòm từ chấm rồi tìm phím).
- **Đáp án:** `hook, cross, diamond, belt` (sổ đánh số sao cho số 7 ≠ phím 7, v.v.).
- **Hàm thuần:** `stripsAssembled(strips)`, `legendNumber(glyph)`.

---

## 5. Kiểm tra trùng lặp

| Màn | Hiện tượng | Không trùng với |
|---|---|---|
| Lông cánh | ghép mảnh cho chấm nối tiếp | khác "trượt mảnh 3×3" (vị trí), khác HER TREES (không lá, không tấm che) |
| Cửa sổ sương | hơi nước đọng làm hiện dấu cũ | khác "sao dạ quang" (nạp sáng) |
| Khay bi | trọng lực | mới |
| Hộp chuông | cơ cấu + âm thanh, lưới 3×3 | khác "Chuông gió" (ý tưởng cũ, chưa làm) — thay thế ý tưởng đó |
| Tổ cú con | sinh vật phản ứng với mồi | mới |
| Đèn kéo quân | lưu ảnh khi quay | khác "Hoàng hôn" (thời gian), đây là tốc độ |
| Hải đăng | đối chiếu bản đồ ↔ cảnh, đếm chớp | khác "thị sai" (không đổi chỗ đứng) |
| Hộp bánh răng | tỉ số truyền | khác "vòng xoay ăn khớp" cũ: không xoay cho khớp hình, chỉ đếm vòng |
| Treo nôi | cân bằng đòn bẩy | mới |
| Bàn của cú | tổng hợp ghép + đếm + bảng tra | màn tổng hợp |

---

## 6. Gợi ý trong Chương 2
Giữ nguyên hệ thống: 1 gợi ý / màn, tốn 1 đom đóm, thẻ nhiều hình, hình cuối là đáp án, hoạt ảnh của chính vật thể.
Riêng Chương 2:
- Hình "đọc" có quầng sáng vàng ở **chỗ cần đếm** (vạch, chấm ngón tay, lỗ góc khay). Trên hình gợi ý được phép vẽ nét
  nối mờ cho chòm (`ghost-mark`), vì cảnh thật không có nét.
- Màn đáp án là vị trí/số: hình đáp án vẫn là các chòm đánh số như thường lệ (bàn phím là nơi dùng chúng).

## 7. Thay đổi kỹ thuật
1. **Chương:** `src/puzzles/index.ts` tách `CHAPTER1` / `CHAPTER2`; `chapters.ts` gán `levels: CHAPTER2`, bỏ
   `comingSoon`. Chương 2 mở khi giải xong màn 12 (hoặc mở ngay: xem câu hỏi ở mục 8).
2. **Bản đồ:** `LEVEL_STARS` trong `hub.ts` đổi thành mảng theo chương; Chương 2 có bản đồ riêng (hình gác mái: các vì
   sao là đèn treo dọc xà nhà).
3. **Không chime:** thêm test cho mọi màn Chương 2: mount với `Sound` giả, làm đúng mẹo, khẳng định `chime` không được gọi
   và chấm của chòm thật không mang filter/class khác chấm nhiễu.
4. **Âm thanh mới** (WebAudio, `sound.ts`): tiếng búa gõ chuông (dùng nốt bàn phím), tiếng bi lăn, tiếng bánh răng tách.
5. **Test** mỗi màn: không lộ lúc đầu; làm đúng thì ra đúng chòm/số; bẫy không trùng chòm thật; số màn trong test
   registry thành 22.
6. Đom đóm: 2 id mới mỗi màn, tiền tố `c2-`.

Làm theo 4 đợt, mỗi đợt build + chơi thử + cập nhật artifact: (a) khung chương 2 + màn 1–2; (b) màn 3–5; (c) màn 6–8;
(d) màn 9–10.

## 8. Câu hỏi còn mở
1. Chương 2 mở ngay hay phải giải xong Chương 1? (Đề xuất: mở sau khi giải màn 12.)
2. Tiếng tách khi vật khớp chỗ có tính là "tự highlight" không? (Đề xuất: giữ, vì đó là phản hồi thao tác.)
3. 10 màn có đủ không, hay muốn 12 như Chương 1? (Ý tưởng dự phòng: "Bóng đèn kéo rèm", "Lọ cát thời gian".)

## 9. Nguồn tham khảo
- [9Puz — HER TREES : PUZZLE DREAM walkthrough](https://9puz.com/3753-her-trees-puzzle-dream-walkthrough/)
- [Steam — HER TREES : PUZZLE DREAM](https://store.steampowered.com/app/3300800/HER_TREES__PUZZLE_DREAM/)
- [AUTOMATON — bài giới thiệu (tiếng Nhật)](https://automaton-media.com/articles/newsjp/20260219-422479/)
