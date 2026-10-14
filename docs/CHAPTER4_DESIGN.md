# Chương 4 · Đài thiên văn bỏ hoang — Bản thiết kế

Chú cú lên đài thiên văn trên đỉnh núi. Người giữ sao đời trước khoá mọi thứ bằng những cỗ máy đố; mỗi màn giải xong
đánh thức một phần của đài, màn cuối mở mái vòm. Trạng thái: **đang làm** (màn 1–2 xong, 2026-10-14; 10 màn còn lại chờ
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
| 3 | Bình dầu đèn | Rót nước đo lượng | Đèn chiếu chỉ hiện chòm khi chứa đúng một lượng dầu; tờ công thức vẽ 4 mức bằng vạch tô | 4 chòm theo tờ công thức | mức không đong thẳng được, phải rót qua lại |
| 4 | Bảng cần gạt vòm | Lights Out biến thể | Mỗi cần đảo một nhóm đèn (nan nối từ cần); mục tiêu sáng cả vòm | chòm khắc trên các cần đang gạt, theo hàng | vài cần gạt sẵn do người gác cũ |
| 5 | Kho thấu kính | Sokoban | Đẩy hòm thấu kính vào 4 khe trên ray kính | 4 chòm, khe trái → phải | 6 hòm cho 4 khe; đẩy vào góc là kẹt |
| 6 | Bàn hạt sao | Peg solitaire | Hạt nhảy qua hạt bên cạnh làm hạt đó rơi; chỉ còn hạt trên 4 đế vàng | chòm trên hạt ở 4 đế, theo chiều kim đồng hồ | mọi lời giải cho cùng một hạt mỗi đế |
| 7 | Khoá của người gác cũ | Mastermind | Nhật ký ghi 4 lần thử cũ kèm đèn vàng (đúng chỗ) / bạc (sai chỗ); khoá tập 2 ô để học nghĩa | mã 4 chòm suy ra từ nhật ký | duyệt 3024 mã: chỉ 1 mã khớp |
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