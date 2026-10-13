# Chương 3 · Phố đêm rằm — Bản thiết kế

Chú cú rời căn gác, bay xuống con phố đêm Trung thu: đèn ông sao, sạp đồ chơi, sân đình, bến sông thả hoa đăng.
Bản đồ chương là con phố; mỗi màn là một góc phố. Trạng thái: **màn 1–5 đã làm**, 7 màn còn lại là kế hoạch.

## 1. Khác hai chương trước thế nào

1. **Kết hợp manh mối để suy ra đáp án** (yêu cầu của người dùng): mỗi manh mối đứng riêng thì chưa đủ. Kiểm bằng test:
   bỏ một manh mối thì đáp án không còn duy nhất (cùng kiểu test duyệt tổ hợp màn 11–12 Chương 2).
2. **Không lặp cơ chế Chương 2.** Cả chương chỉ có **một** màn đáp án là vị trí ô; không dùng đếm số để làm thứ tự
   (Lông cánh, Hải đăng, Hộp bánh răng đã dùng nhiều), không dùng bảng tra số → chòm, không có "tổng hợp" kiểu Bàn của cú
   (màn cuối chương kết hợp manh mối riêng của Chương 3).
3. **Đọc dấu vết**: suy ra chuyện đã xảy ra từ dấu để lại (dấu chân đè nhau, vệt than chì, bóng đổ).
4. Giữ **quy tắc riêng Chương 2**: không tự tô sáng, không nét nối, không `sound.chime()` khi chòm lộ ra; nét nối mờ
   chỉ trên hình gợi ý (`hint-line`).

### Các kiểu kết hợp manh mối

| Kiểu | Cách hoạt động |
|---|---|
| Giao hai nguồn | Mẹo A cho khoảng 6 chòm, mẹo B cũng cho khoảng 6; đáp án là các chòm có ở cả hai |
| Nối qua đặc điểm chung | Một vật cho biết *chòm nào*, vật khác cho biết *thứ tự*; phải tìm đặc điểm nối (cỡ, hoa văn, vết bẩn…) |
| Suy quy tắc từ ví dụ | Vài cặp mẫu đã giải sẵn trong cảnh; tự tìm quy tắc rồi áp vào phần còn lại |
| Tìm nguồn sai | Nhiều nhân chứng hoặc bản vẽ, một nguồn sai; tìm ra bằng mâu thuẫn |
| Loại trừ chéo | "Ai cầm đèn nào", mọi gợi ý đều bằng hình, không chữ |

## 2. Danh sách 12 màn

| # | Màn | Hiện tượng | Kiểu kết hợp | Cách chơi | Đáp án / thứ tự |
|---|---|---|---|---|---|
| 1 | **Bia đá** ✅ | rập bằng than chì | (dạy lọc) | Chà than lên giấy phủ bia: chấm khắc chìm hiện trắng. 5 chòm, 2 chòm có vòng gạch chéo → bỏ | 3 chòm, trái → phải |
| 2 | Dấu chân trên cát ✅ | dấu sau đè dấu trước | nối qua đặc điểm | Dấu đè nhau cho biết ai đi trước; ghép kiểu dép với đèn chòm sao của từng bạn | 4 chòm, thứ tự đi qua sân |
| 3 | Dàn ly nước ✅ | cộng hưởng | giao hai nguồn | Gõ chuông thì ly cùng nốt gợn nước; chỉ ly có hoa sen mới tính | 4 chòm, mực nước thấp → cao |
| 4 | Sạp đèn ✅ | — | nối qua đặc điểm | Hoa văn giấy gói của đèn khớp mái che sạp; mỗi sạp còn một móc trống | 4 chòm, sạp trái → phải |
| 5 | Hoa đăng ✅ | dòng chảy | giao hai nguồn | Thả lá dò dòng nước; chỉ đèn từ bến có cọc buộc thuyền (khớp vé đò) mới tính | 4 chòm, bến thượng → hạ nguồn |
| 6 | Tấm đồng rắc cát | sóng dừng (vân Chladni) | nối qua đặc điểm | Vặn núm tần số, cát dồn thành chấm 6 chòm; bản nhạc trên giá chọn 4 | 4 chòm, theo bản nhạc (luôn có dấu nhìn thay âm thanh) |
| 7 | Đồng hồ sao | bầu trời quay quanh sao Bắc Cực | nối qua đặc điểm | Kéo kim giờ, chòm lọt khung cửa; thiệp mời vẽ 4 giờ hẹn | 4 chòm, theo thiệp |
| 8 | Hai bức tranh | so chỗ khác nhau | tìm nguồn sai | 3 bức cùng góc phố, 1 bức sai chi tiết; chỗ khác nhau là chấm của chòm | 4 chòm, trái → phải trên bức sai |
| 9 | Mật thư tò he | — | suy quy tắc từ ví dụ | Biển mẫu có 3 câu dịch sẵn; tự tìm quy tắc (màu + số chân) để dịch dòng cuối | 4 chòm |
| 10 | Ảnh phơi sáng | phơi sáng lâu | tìm nguồn sai | Chụp khi trẻ vung pháo bông; 2 vệt của người đi ngang là nhiễu | 4 chòm, theo số khung phim |
| 11 | Ai cầm đèn nào | — | loại trừ chéo (suy luận thuần) | 4 bạn × 4 đèn × 4 vị trí, khoảng 6 tranh gợi ý; test duyệt tổ hợp | 4 chòm, theo thứ tự đoàn rước |
| 12 | Đêm rước đèn | — | nhiều lớp | Dấu chân + giấy gói + nhân chứng sai ghép lại để biết đèn nào tới đình trước | 4 **vị trí** (màn duy nhất đáp án là vị trí) |

Đường khó: 1 dạy lọc bớt; 2–7 một mẹo nhìn kết hợp một manh mối; 8–10 thêm nguồn sai và suy quy tắc; 11 suy luận thuần;
12 gộp mọi kiểu. Nốt nhạc của mỗi chòm (chưa màn nào dùng) thành manh mối ở màn 3 và 6, luôn kèm tín hiệu nhìn thấy.

## 3. Màn 1 · Bia đá (`stoneRubbing.ts`)

- **Cảnh:** một tấm bia đá, tờ giấy trắng ghim lên trên (không có gì trên giấy); một thỏi than chì nằm bên phải.
- **Mẹo:** kéo thỏi than chà lên giấy (vệt rộng ~92 px). Chỗ khắc chìm không ăn than nên để lại chấm trắng, phần còn lại
  chuyển xám có kẻ sọc — hiện ra **chỉ nơi thỏi than đã đi qua**. Cần chà nhiều hàng, vì hàng chòm so le cao/thấp.
- **Nội dung khắc:** 5 chòm chỉ bằng chấm (vương miện, thập tự, cái gáo, tam giác, lưỡi câu), 12 chấm nhiễu, và vòng
  tròn gạch chéo khắc **phía trên** chòm thứ 2 và thứ 5 (đặt cạnh chứ không đè lên để không che chấm sao).
- **Đáp án:** ba chòm không bị gạch, trái → phải: vương miện, cái gáo, tam giác.
- **Chống lộ đáp án:** giấy trơn, không vân nổi; test: chưa chà thì không chòm nào hiện, một vệt ở giữa hoặc dọc một hàng
  cũng chưa đủ.
- **Cài đặt:** mặt nạ SVG `mask` chứa đường nét thỏi than; bên dưới là tấm xám có chấm trắng vẽ sẵn, nên không tính toán lại
  khi chà. Logic thuần: `revealedCarvings(strokes)` (một chòm hiện khi ≥ 80% chấm nằm trong bán kính 36 px của vệt).
- **Gợi ý:** 3 hình — thỏi than trượt chà lên giấy (vệt mọc theo), cả tờ đã chà với các chòm không bị gạch được
  đánh số, hình đáp án.

## 4. Màn 2 · Dấu chân trên cát (`sandFootprints.ts`)

- **Cảnh:** bên trái giá treo 4 đèn lồng, mỗi đèn mang một chòm chỉ bằng chấm và có một thẻ vẽ đế dép của em đó
  (vạch ngang, chấm, ziczac, vòng tròn). Bên phải là sân cát với **chồng 6 dấu chân** (4 em, 1 giày người lớn với đế
  kẻ ô, 1 dấu chân chó) và một tấm ván gỗ có 6 ô.
- **Mẹo:** dấu mới đè lên dấu cũ nên dấu dưới cùng bị che nhiều nhất. **Chạm một dấu để nhấc nó sang ván**; chạm lại
  để trả về. Dấu nhấc ra xếp vào ván theo thứ tự nhấc (nhấc dấu trên cùng trước thì nó nằm ô đầu), nên đọc ván sẽ
  đảo ngược thứ tự qua sân — cái bẫy nhỏ của màn.
- **Kết hợp manh mối:** (1) đế dép ↔ đèn lồng cho biết *chòm nào*; (2) thứ tự chồng lớp cho biết *thứ tự*. Thiếu một
  trong hai thì không ra đáp án.
- **Đáp án:** thứ tự qua sân là em 3, em 1, em 4, em 2 (đánh số từ trái sang phải trên giá) → thập tự, kim cương,
  vương miện, lưỡi câu — khác thứ tự treo. Giày người lớn và dấu chó là nhiễu (không có đèn lồng).
- **Chống đoán mò:** mọi cặp dấu của các em đều đè lên nhau (test), nên thứ tự luôn xác định; mọi dấu đều thấy ít
  nhất một phần lúc đầu.
- **Gợi ý:** 3 hình: nhấc dấu trên cùng ra ván (dấu tự trượt), các dấu đã xếp trên ván với đèn lồng đánh số theo
  thứ tự qua sân, hình đáp án.

## 5. Màn 3 · Dàn ly nước (`glassChimes.ts`)

- **Cảnh:** hàng 9 chuông đồng (thứ tự bàn phím) mỗi chuông khắc một chòm chỉ bằng chấm; kệ 7 ly nước mực khác nhau,
  4 ly có hoa sen nổi. Mỗi ly *cùng nốt* với một chuông; 2 chuông (hình vuông, thắt lưng) không có ly.
- **Mẹo:** chạm chuông thì chuông đung đưa, nốt của chòm vang lên, và **ly cùng nốt gợn sóng** (vòng sóng đậm + hoa
  sen nhún). Dấu hiệu nhìn thấy được nên người tắt tiếng vẫn chơi được; sóng tắt sau ~1,8 giây nên phải nhớ cặp
  chuông–ly.
- **Kết hợp manh mối (giao hai nguồn):** ghép chuông–ly bằng cộng hưởng, rồi lọc theo **hoa sen** (ly không hoa là
  nhiễu: 3 ly gợn nhưng không tính), rồi xếp theo **mực nước thấp → cao**.
- **Đáp án:** thứ tự mực nước 0,28 → 0,42 → 0,58 → 0,78 cho cái gáo, tam giác, lưỡi câu, vương
  miện. Khác thứ tự bàn phím (tam giác, vương miện, cái gáo, lưỡi câu) và thứ tự ly trên kệ.
- **Bẫy:** ly không hoa sen ứng với thập tự, kim cương, mũi tên; mũi tên và kim cương dễ nhầm khi chỉ còn chấm nên
  không cho cả hai vào đáp án (test).
- **Gợi ý:** 3 hình: chạm một chuông làm một ly gợn (vòng sóng lan theo), các ly có hoa sen đánh số theo mực nước
  với chòm của chuông tương ứng, hình đáp án.

## 6. Màn 4 · Sạp đèn (`lanternStalls.ts`)

- **Cảnh:** 4 sạp với mái che hoa văn khác nhau (vạch chéo `/`, chấm nhỏ, ô vuông, sóng); mỗi sạp có một móc trống với
  vết đèn mờ (đèn đã bán). Hàng 6 khách bên dưới, mỗi người giơ một đèn lồng bọc giấy hoa văn.
- **Mẹo:** khớp hoa văn giấy gói với mái che để biết khách mua ở sạp nào. **Chạm đèn để mở giấy** (tờ giấy rơi xuống
  chân khách, vẫn thấy hoa văn) và đọc chòm trong đèn. Chạm lại để gói lại.
- **Kết hợp manh mối:** (1) hoa văn giấy ↔ mái che nối khách với sạp; (2) chòm trong đèn chỉ thấy khi mở giấy;
  (3) thứ tự theo sạp, không theo hàng khách.
- **Bẫy:** hai khách mua chỗ khác có hoa văn na ná (vạch chéo ngược `\`, chấm to); khách vạch chéo ngược lại **cùng
  màu mực** với mái sạp đầu nên khớp theo màu sẽ sai; không khách nào cùng màu mực với sạp cùng hoa văn (test).
- **Đáp án:** thứ tự sạp trái → phải: cái gáo, thập tự, tam giác, lưỡi câu — khác thứ tự hàng khách (tam giác, vương
  miện, cái gáo, lưỡi câu, mũi tên, thập tự).
- **Gợi ý:** 3 hình: mở giấy một đèn (giấy rơi xuống), các đèn đã mở với số 1–4 theo thứ tự sạp, hình đáp án.

## 7. Màn 5 · Hoa đăng (`riverLanterns.ts`)

- **Cảnh:** dòng sông chảy **từ phải sang trái** (nguồn ở bên phải, các vệt sóng trôi dần về trái). Sáu bến gỗ, 3 ở bờ
  trên và 3 ở bờ dưới, mỗi bến một hoa đăng mang một chòm. Bên trái sông tách hai nhánh quanh một cù lao lau: nhánh
  trên tới bậc thềm đình (mái chùa, chú cú đứng đó), nhánh dưới tới cối xay nước; đầu cù lao có bụi lau.
- **Mẹo:** chạm hoa đăng để thả, nó trôi theo dòng và dừng ở đích; chạm lại để đưa về bến. Mỗi đèn tới một nơi:
  đình, cối xay hoặc mắc vào bụi lau. Đèn thả từ bờ dưới cũng có thể bị dòng chính đưa sang nhánh trên.
- **Kết hợp manh mối (giao hai nguồn):** (1) đích của mỗi đèn: chỉ đèn tới đình mới tính (4 đèn; 1 vào cối xay, 1 mắc
  lau); (2) thứ tự **từ bến gần nguồn nhất tới xa nguồn**, tức là đọc từ phải sang trái — ngược thói quen đọc,
  phải quan sát chiều nước chảy mới biết.
- **Đáp án:** cái gáo, lưỡi câu, tam giác, thập tự. Mũi tên và kim cương không có trong màn (tránh nhầm khi chỉ còn chấm).
- **Cài đặt:** các tuyến trôi được vẽ tay trong "toạ độ dòng chảy" rồi lật gương lên cảnh; đường cong Catmull–Rom, tốc
  độ 200 px/s. Test: mọi điểm trên mọi tuyến nằm trên mặt nước, tránh cù lao; thứ tự bến; đích.
- **Gợi ý:** 3 hình: thả một đèn (đèn tự trôi tới đích), cả sáu đèn đã tới nơi với số 1–4 theo thứ tự bến, hình đáp án.
