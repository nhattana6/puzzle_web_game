# Chương 4 · Đài thiên văn bỏ hoang — Bản thiết kế

Chú cú lên đài thiên văn trên đỉnh núi. Người giữ sao đời trước khoá mọi thứ bằng những cỗ máy đố; mỗi màn giải xong
đánh thức một phần của đài, màn cuối mở mái vòm. Trạng thái: **đang làm** (màn 1–7 xong, 2026-10-14; màn 8–12 chờ
duyệt từng màn).

## 1. Khác ba chương trước thế nào

1. **Mỗi màn là một cỗ máy có luật, không viết luật ra.** Người chơi tự tìm luật qua **đèn phản hồi** (nhóm chấm hoặc
   đèn nhỏ chuyển vàng khi một hàng, cột hay ràng buộc đã thoả) hoặc qua **một mẫu đã giải sẵn** trong cảnh. Không
   hướng dẫn riêng từng màn (quy tắc 8 của CLAUDE.md).
2. **Mỗi màn chỉ có một lời giải**, kiểm bằng test: duyệt tổ hợp cho đố dạng lưới, BFS cho đố nhiều bước. Bỏ một dữ
   kiện thì không còn duy nhất.
3. **Giải chưa xong thì chưa đọc được đáp án.** Ở màn khó, trạng thái sai một phần vẫn hiện chòm nhưng là chòm sai.
4. **Màn nhiều bước có nút hoàn tác / đặt lại** (thành phần giao diện mới, từ màn 5).
5. Giữ quy tắc Chương 2–3: không tự tô sáng chòm, không nét nối, không `sound.chime()` khi lộ chòm; nét nối mờ chỉ
   trên hình gợi ý (`hint-line`). Đèn phản hồi của **luật** (nhóm chấm, đèn thẻ) thì được, vì không nói chòm nào đúng.
6. Không dùng lại các thể loại đã có: Akari (Sân đèn sao), cổng logic, loại trừ chéo (Ai cầm đèn nào), suy quy tắc từ
   ví dụ (Mật thư tò he), chồng hình lộ chỗ lệch, mê cung, ống nước, gương, bánh răng, ghép hình, nghiêng bi, đòn bẩy.

## 2. Danh sách 12 màn (dễ → khó)

| # | Màn | Thể loại đố | Cách chơi | Đáp án / thứ tự | Bẫy, điểm khó |
|---|---|---|---|---|---|
| 1 | **Thẻ đục lỗ** ✅ | Nonogram (Picross) 5×5 | 3 thẻ trống; nhóm chấm ở mép = các dải lỗ liền nhau trong hàng/cột; thẻ mẫu đã đục trên giá để học luật | 3 chòm, trái → phải | mỗi thẻ có 2 lỗ lẻ; đường dẫn từ dễ đến khó |
| 2 | **Tủ ngăn kéo** ✅ | Latin square 4×4 (có khối 2×2) | Mỗi ngăn một viên đá chòm sao; mỗi hàng, cột, khối đủ 4 loại; vài ngăn có sẵn | 4 ngăn có tay nắm đồng, trên → dưới | các viên có sẵn buộc suy luận bắc cầu |
| 3 | **Bình dầu đèn** ✅ | Rót nước đo lượng | Đèn chiếu chỉ hiện chòm khi chứa đúng một lượng dầu; tờ công thức vẽ 4 mức bằng vạch tô | 4 chòm theo tờ công thức | mức không đong thẳng được, phải rót qua lại |
| 4 | **Bảng cần gạt vòm** ✅ | Lights Out biến thể | Mỗi cần đảo một nhóm đèn (nan nối từ cần); mục tiêu sáng cả vòm | chòm khắc trên các cần đang gạt, theo hàng | vài cần gạt sẵn do người gác cũ |
| 5 | **Kho thấu kính** ✅ | Sokoban | Đẩy hòm thấu kính vào 4 khe trên ray kính | 4 chòm, khe trái → phải | 6 hòm cho 4 khe; đẩy vào góc là kẹt |
| 6 | **Bàn hạt sao** ✅ | Peg solitaire | Hạt nhảy qua hạt bên cạnh làm hạt đó rơi; chỉ còn hạt trên 4 đế vàng | chòm trên hạt ở 4 đế, theo chiều kim đồng hồ | mọi lời giải cho cùng một hạt mỗi đế |
| 7 | **Khoá của người gác cũ** ✅ | Mastermind | Nhật ký ghi 4 lần thử cũ kèm đèn vàng (đúng chỗ) / bạc (sai chỗ); khoá tập 2 ô để học nghĩa | mã 4 chòm suy ra từ nhật ký | duyệt 3024 mã: chỉ 1 mã khớp |
| 8 | Dây đồng nối sao | Hashi (Bridges) | Mỗi sao N đinh tán cần N sợi dây, mỗi cặp tối đa 2 sợi, dây không cắt nhau | 4 chòm xếp theo cỡ, nhỏ → lớn | rãnh dẫn thừa; nối "trông giống chòm" sẽ thiếu dây |
| 9 | Cú lên dây | Lập trình đường đi | Xếp 6 thẻ lệnh cho cú đồ chơi chạy lặp và về cành đậu | thứ tự các ô chòm sao cú đi qua | đúng 1 chương trình (BFS); đường tắt qua ô giả |
| 10 | Sân kính thiên văn | Star Battle 6×6 | Mỗi hàng, cột, vùng đúng 1 kính, không hai kính kề nhau kể cả chéo | 4 chòm từ các vùng viền đồng, trái → phải | đặt sai vẫn hiện chòm, nhưng là chòm sai |
| 11 | Cân đá chòm sao | Suy thứ tự từ cân đĩa | 5 cân đã đặt sẵn với 6 loại đá, suy ra nặng nhẹ | 4 viên trên kệ có ổ trống, nhẹ → nặng | duyệt 720 hoán vị: chỉ một thứ tự thoả (phương án thay: "Bản đồ sương mù" kiểu dò mìn) |
| 12 | Mở vòm (tổng hợp) | Chuỗi ba bảng | Kết quả bảng trước là dữ kiện bảng sau: thẻ đục lỗ → mẫu đèn cho bảng cần gạt → cần gạt xuống chỉ ô đã có kính trong Star Battle nhỏ | 4 chòm trên vòm theo bảng cuối | gộp luật màn 1, 4, 10; không bảng nào giải riêng được |

Đường khó: 1–3 một luật, lưới nhỏ, có đèn phản hồi; 4–6 phải lên kế hoạch nhiều bước, có trạng thái kẹt; 7–9 suy luận từ
dữ kiện gián tiếp, thêm đường tắt giả; 10–11 ràng buộc dày, đặt sai vẫn hiện chòm sai; 12 nối chuỗi các luật đã học.

## 3. Màn 1 · Thẻ đục lỗ (`punchCards.ts`)

- **Cảnh:** máy chiếu của người gác cũ. Bên trái ba **màn chiếu** nhỏ (ô tối) với đèn nhỏ dưới mỗi màn; bên dưới là một
  **thẻ mẫu** đã đục xong (hình chiếc ghế) đặt trên giá, kèm các nhóm chấm. Bên phải là **thẻ đang đục** 5×5 với ô lớn.
- **Luật (không viết ra):** cạnh mỗi hàng và cột là các **viên thuốc chứa chấm**; mỗi viên là một dải lỗ liền nhau (viên
  hai chấm = hai lỗ kề nhau), các viên theo thứ tự trái → phải (hoặc trên → dưới), hai dải cách nhau ít nhất một ô trống.
  Hàng không có lỗ thì hiện một vòng tròn rỗng. Thẻ mẫu cho thấy các viên đi với các lỗ ra sao; các viên chuyển **vàng**
  khi hàng/cột khớp.
- **Cách chơi:** chạm một màn chiếu để chọn thẻ; chạm hoặc **kéo ngón tay** trên thẻ lớn để đục (kéo sơn cả hàng,
  cùng chế độ đục hoặc bịt với ô đầu tiên). Ánh đèn xuyên qua lỗ thành chấm trên màn chiếu nhỏ tương ứng. Xong thẻ thì
  đèn dưới màn chiếu sáng vàng và có tiếng `ding` nhỏ (phản hồi của luật, không lộ chòm).
- **Ba thẻ** (đáp án theo thứ tự màn chiếu trái → phải): tam giác, lưỡi câu, vương miện. Mỗi chòm đặt lên lưới 5×5 bằng
  `snappedCells` (ô gần nhất của từng sao) và có **2 lỗ lẻ** để chỉ có một lời giải:

  | Thẻ | Chòm | Lỗ lẻ | Ghi chú |
  |---|---|---|---|
  | 1 | tam giác (3 sao) | (0,1), (1,2) | dễ: nhiều hàng, cột trống |
  | 2 | lưỡi câu (6 sao) | (0,1), (4,1) | khó nhất: không hàng nào trống, cần nhiều lượt suy luận |
  | 3 | vương miện (5 sao) | (1,3), (3,2) | vừa |

- **Chống lộ đáp án:** lúc đầu thẻ trống, các màn chiếu tối; không hàng/cột nào chỉ ra chòm. Thẻ mẫu không chứa chòm
  nào (test). Màn chiếu chỉ hiện lỗ, không nét nối, không sáng thêm.
- **Test:** mỗi thẻ có đúng 1 lời giải (duyệt mọi dòng của từng hàng) và **giải được chỉ bằng suy luận theo dòng** (không
  phải đoán thử); không chòm nào khác nằm lọt trong lỗ của một thẻ; thẻ chưa đục thì chưa xong, thừa hay thiếu một lỗ
  thì không xong; thẻ mẫu không chứa chòm nào và có dải dài 1, 3, 4, 5; đáp án không theo thứ tự bàn phím.
- **Gợi ý:** 3 hình + đáp án: đục thẻ 1 (lỗ hiện lần lượt trên thẻ và màn chiếu), làm tương tự với hai thẻ còn lại,
  đọc ba chòm trên ba màn chiếu đánh số 1–3 (có nét nối mờ chỉ trên hình gợi ý).
- **Bàn phím / chạm:** ô trên thẻ lớn là `role="checkbox"`, tới được bằng Tab, Enter hoặc Space để đục, phím mũi tên để
  đổi ô. Trên điện thoại 360 px ô thẻ lớn chỉ ~20 px, nên có chế độ kéo sơn để khỏi phải chạm từng ô.


## 4. Màn 2 · Tủ ngăn kéo (`drawerCabinet.ts`)

- **Cảnh:** một tủ gỗ 4×4 ngăn kéo, hai đường dày chia thành bốn khối 2×2. Quanh tủ có 12 đèn nhỏ: 4 bên phải (hàng), 4 bên
  dưới (cột) và 4 ở bốn góc ngoài (khối). Ngăn đã mở sẵn có đá hiện trong lòng ngăn và một chốt nhỏ (không đổi được).
- **Luật (không viết ra):** chạm một ngăn thì đổi đá theo vòng trống → 1 → 2 → 3 → 4 → trống. Mỗi nhóm (hàng, cột, khối) phải
  có đủ bốn loại đá; đèn của nhóm vàng khi đủ. Đèn chỉ nói "nhóm này đủ bốn loại", không nói đá nào đúng chỗ.
- **Bốn đá** (chỉ chấm): tam giác, lưỡi câu, vương miện, hình vuông. Không dùng mũi tên và kim cương (dễ nhầm khi chỉ còn chấm).
- **Cách điền:** bốn đá ghim ở (hàng 1, cột 1), (2, 4), (3, 3), (4, 2); lời giải duy nhất. Test duyệt mọi cách điền, và kiểm
  bỏ đi một đá ghim bất kỳ thì có nhiều hơn một cách.
- **Đáp án:** bốn ngăn có tay nắm đồng ở cột 4, 1, 2, 3 của hàng 1–4 (thanh ngang; ngăn khác là núm tròn), đá trong chúng đọc từ
  hàng trên xuống: hình vuông, vương miện, tam giác, lưỡi câu. Không theo thứ tự phím và không theo thứ tự cột. Các ngăn có tay
  nắm đều trống lúc đầu nên phải điền đúng mới đọc được.
- **Gợi ý:** 2 hình + đáp án: điền các ngăn còn lại (đá hiện lần lượt trong ngăn), bốn ngăn tay nắm đồng đánh số 1–4.
- **Bàn phím / chạm:** ô là nút (Tab, Enter/Space để đổi đá); ngăn lớn 160 px nên chạm dễ cả trên điện thoại.

## 5. Màn 4 · Bảng cần gạt vòm (`domeLevers.ts`)

- **Cảnh:** đèn bên trái, cần gạt bên phải (bố cục lại để thấy đủ cả trên điện thoại). Vòm có 7 đèn (một đèn giữa, sáu đèn quanh theo chiều kim đồng hồ từ trên).
  phía trên mỗi cần là **hình nhỏ của 7 đèn** với các đèn cần đó đổi được tô vàng, phía dưới mỗi cần khắc một chòm chỉ chấm.
  Khác bản nháp ban đầu (nan nối): không vẽ dây vì dây từ 7 cần tới 7 đèn sẽ cắt nhau chằng chịt.
- **Luật (không viết ra):** gạt một cần đổi sáng ↔ tối các đèn trong hình nhỏ của nó; gạt lại thì đổi lại. Mọi đèn sáng thì
  chuông `ding` nhỏ vang lên. Đèn lúc nào cũng cho thấy kết quả của vị trí các cần hiện tại.
- **Dữ liệu:** `AFFECTS` (mỗi cần 2–3 đèn, mỗi đèn 2–4 cần, không hai cần giống nhau), ma trận 7×7 khả nghịch trên GF(2) nên đúng một
  tập cần xuống làm sáng cả vòm: các cần 2, 3, 5, 7 (đánh số từ 1). Người gác cũ để sẵn cần 1 và 6 xuống (cách lời giải 6 cần).
- **Đáp án:** chòm khắc dưới các cần xuống trong lời giải, từ trái sang phải: vương miện, lưỡi câu, tam giác, hình vuông (không
  theo thứ tự phím). 7 chòm khắc gồm đủ trừ mũi tên và kim cương.
- **Gợi ý:** 2 hình + đáp án: gạt các cần cần đổi (cần và đèn đổi lần lượt), bốn cần xuống đánh số 1–4.

## 6. Màn 5 · Kho thấu kính (`lensDepot.ts`)

- **Cảnh:** kho 9×7 ô; hàng trên là thanh ray có 4 khe cách nhau (khe 0–3 từ trái sang), mỗi khe vẽ viền một hình (tròn,
  vuông, tam giác, lục giác) bằng nét đứt; trên mỗi khe là một màn nhỏ. Có 4 hòm gỗ có thấu kính (viền tròn, vuông, tam giác, lục
  giác) và 2 hòm xám nứt (viền thoi) làm vướng. Chú cú là quân cờ.
- **Luật:** cú đẩy hòm đi tiếp một ô nếu ô sau trống; không kéo, không đẩy hai hòm cùng lúc, không bước vào khe. Hòm chỉ vào được
  khe cùng hình viền (hòm khác bị chặn như tường). Hòm vào khe thì kẹt ở đó và chiếu chòm của nó lên màn phía trên. Xong cả 4
  khe thì `ding`.
- **Điều khiển:** phím mũi tên (cảnh phải được focus), bốn nút mũi tên, vuốt ngón tay (mỗi nửa ô một bước), hoặc chạm về phía ô cần
  tới; **Hoàn tác** (nút duy nhất, hoặc phím Z / Backspace; mỗi lần lùi một lần đẩy cùng các bước đi trước nó, không có nút Đặt lại). Cảnh không cuộn trang khi chạm.
- **Dữ liệu:** `MAP`, `START`, `PUSHES` (17 lần đẩy). Bản đồ sinh bằng kéo ngược từ trạng thái xong rồi giải BFS; test mô phỏng
  đúng chuỗi đẩy (đi bộ tới ô đứng rồi đẩy) tới khi cả 4 khe đầy, kiểm hòm sai khe, hòm xám và cú không vào được khe, không đẩy
  được hai hòm hay hòm vào tường.
- **Đáp án:** lưỡi câu, vương miện, thắt lưng, hình vuông (khe 0–3), chỉ lộ khi thấu kính vào khe; không theo thứ tự phím.
- **Gợi ý:** 2 hình + đáp án: một lần đẩy mẫu (hòm trượt, ngón tay đi cùng) và cả bốn thấu kính đã vào khe với bốn màn đánh số 1–4.

## 7. Màn 3 · Bình dầu đèn (`oilJars.ts`)

- **Cảnh:** bên trái ba bình đứng cạnh nhau (8, 5 và 3 phần, mỗi bình một vạch cho từng phần); bình lớn có ngọn lửa và là **bình
  đèn**. Bên phải là tờ công thức 2×2: mỗi ô vẽ một bình đèn thu nhỏ đổ tới một mức và một cửa sổ tối cho chòm.
- **Luật:** chỉ rót, không có vòi hay chỗ đổ, tổng dầu luôn là 8. Chạm bình nguồn (nhấc lên) rồi bình đích; rót tới khi nguồn cạn hoặc
  đích đầy. Không có nút Hoàn tác hay Đặt lại (người dùng bỏ đi): không bao giờ kẹt vì mọi trạng thái đều quay được về bình đầy (test kiểm).
- **Mức công thức:** 4, 1, 7, 2 (không có mức nào rót thẳng được). Mức 4 cần 7 lần rót (8-0-0 → 3-5-0 → 3-2-3 → 6-2-0 → 6-0-2 → 1-5-2
  → 1-4-3 → 4-4-0, đi qua mức 1); mức 7 và 2 cần chuỗi khác 5 lần rót. Chòm của một ô hiện khi bình đèn đạt mức đó và ở lại.
- **Đáp án:** các ô từ trái sang phải, từ trên xuống: lưỡi câu, tam giác, thắt lưng, vương miện (không theo thứ tự phím). Chòm chỉ
  hiện sau khi đạt mức nên không đọc được lúc đầu.
- **Gợi ý:** 3 hình: chuỗi rót thứ nhất (bình tự đổi mức theo hoạt ảnh), chuỗi thứ hai, ba cửa sổ đánh số 1–4.

## 8. Màn 6 · Bàn hạt sao (`starBoard.ts`)

- **Cảnh:** bàn gỗ hình chữ thập (khung 5×5 bỏ bốn góc, 21 lỗ). 10 hạt: 4 hạt xanh viền vàng mang chòm sao chỉ chấm (tam giác, lưỡi
  câu, vương miện, hình vuông) và 6 hạt xám trơn. **Bốn đế vàng** là bốn lỗ kề tâm (trên, phải, dưới, trái), lúc đầu đều trống.
- **Luật (không viết ra):** hạt nhảy thẳng ngang hoặc dọc qua một hạt kề và vào lỗ trống ngay sau; hạt bị nhảy qua rơi xuống. Xong
  khi còn đúng 4 hạt và cả bốn đế đều có hạt. Chạm hạt có thể nhảy thì nhấc lên và hiện vòng nét đứt ở các lỗ đáp được; chạm lỗ đó để
  nhảy. Một nút **Hoàn tác** lùi một lần nhảy (không có Đặt lại, theo yêu cầu).
- **Một đáp án:** bàn chọn bằng tìm kiếm: kéo ngược từ trạng thái xong với 4 hạt chòm và thêm hạt trơn khi lùi, rồi duyệt toàn bộ 404
  trạng thái đạt được: 91 trạng thái bế tắc, **đúng 1** trạng thái xong. Test kiểm mọi cách xong đều có cùng chòm ở từng đế, không có
  hạt trơn trên đế, và bế tắc nhiều hơn xong.
- **Đáp án:** chòm trên bốn đế **theo chiều kim đồng hồ từ đế trên cùng**: lưỡi câu, vương miện, hình vuông, tam giác (không theo thứ tự
  phím). Cách xong (6 lần nhảy, lưu ở `SOLUTION`): (2→0), (0→9), (7→5), (13→15), (18→20), (20→11) theo chỉ số ô.
- **Thứ tự đọc chỉ hiện khi xong:** cảnh không có manh mối nào về thứ tự (người dùng yêu cầu thêm), nên khi còn đúng 4 hạt trên 4 đế,
  mỗi đế hiện một thẻ chấm vàng 1–4 chấm cạnh hạt: đọc theo số chấm tăng dần. Quy tắc chung cho màn mà thứ tự không suy ra được từ cảnh:
  cho thấy thứ tự ngay khi màn xong để người chơi biết nhập thế nào.
- **Bài học thiết kế:** đế phải là ô nhiều hướng vào được. Bản đầu đặt đế ở bốn đầu mút nhánh (trên, phải, dưới, trái cùng hàng/cột
  với tâm) thì không hạt nào tới được vì lỗ ở đầu mút chỉ vào được từ tâm, mà tâm chỉ vào được từ đầu mút.
- **Gợi ý:** 2 hình + đáp án: một lần nhảy mẫu (hạt trượt, hạt bị nhảy qua mất đi), bàn đã xong với bốn đế đánh số 1–4.

## 9. Màn 7 · Khoá của người gác cũ (`oldKeeperLock.ts`)

- **Cảnh:** bên phải cuốn sổ 5 trang; mỗi trang một hàng bốn chòm (chỉ chấm) đã thử, bốn chốt (vàng, bạc, hoặc vòng rỗng) và một đèn.
  Hàng dưới cùng của sổ có bốn ô viền vàng để thử mã. Bên trái là **chú giải** ngắn (chốt vàng, chốt bạc, vòng rỗng). Bản đầu có khoá tập (mã hai chòm hiện sẵn) nhưng người dùng thấy rối nên bỏ.
- **Luật (có giải thích theo yêu cầu người dùng):** chốt vàng = đúng chòm đúng chỗ, chốt bạc = đúng chòm sai chỗ (tính chuẩn Mastermind, có xử lý chòm lặp).
  Đèn của trang sáng khi mã đang thử cho đúng số chốt vàng và bạc ghi ở trang đó. Giải thích nằm ở chú giải trong cảnh và ở đầu thẻ Trợ giúp (`help`, tự mở một lần).
- **Dữ liệu:** 7 chòm (bỏ mũi tên, kim cương); mã bí mật vương miện, thắt lưng, cái gáo, tam giác. Năm trang được chọn bằng tìm
  kiếm sao cho đúng một trong 2401 mã khớp và mỗi trang đều cần (bỏ đi thì nhiều hơn một mã). Các trang: (thập tự, vương miện,
  lưỡi câu, tam giác) 1V1B; (tam giác, thập, cái gáo, hình vuông) 1V1B; (thắt lưng, hình vuông, thập, lưỡi câu) 1B; (thập, hình vuông,
  tam giác, thắt lưng) 2B; (thập, hình vuông, thắt lưng, cái gáo) 2B.
- **Đáp án:** mã từ trái sang phải. Ding nhỏ khi cả 5 đèn sáng; chưa điền đủ 4 ô thì không đèn nào sáng.
- **Gợi ý:** 2 hình + đáp án: bốn ô thử hiện dần chòm của đáp án, rồi bốn ô đánh số 1–4.
- **Cơ chế `help`:** `PuzzleDef.help` (vài câu) hiện đầu thẻ Trợ giúp và tự mở thẻ một lần cho màn đó. Chỉ dùng cho màn mà ký hiệu không đọc được từ cảnh;
  không dùng để nói cách giải. Hiện chỉ màn 7 dùng.