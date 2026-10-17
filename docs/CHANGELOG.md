# Nhật ký cập nhật — The Star Keeper

Mới nhất ở trên. Mỗi lần thay đổi màn chơi, gợi ý, âm thanh hay giao diện thì ghi vào đây,
và cập nhật README + `docs/GAME_DESIGN.md` cho khớp.

## 2026-10-17

### Chương 5, màn 3: Hang cua ruộng lúa (`crabField.ts`)
- Màn ★2, dò mìn (Minesweeper). Ruộng **9 × 6**: 28 ô đã cày hiện chấm bùn (xếp như xúc xắc) = số hang cua trong 8 ô quanh, 26 ô còn lúa. Chạm ô lúa: cờ hang → vòng "không có" → lúa.
  Chấm chuyển vàng khi đủ cờ; khi mọi số vàng, các hang đọng nước trăng thành chòm (trước đó không có chấm sáng nào). Hai ruộng mẫu 3×3 đã làm xong ở mép phải để học luật, không chữ.
- Ba chòm mỗi chòm một khối ba cột, trái → phải: **lưỡi câu, tam giác, thập tự** (bản nháp ghi cái gáo; đổi vì rộng 5 cột), cộng 3 hang lẻ; 17 hang. Lưới đổi từ 8×6 thành 9×6 cho đủ ba khối.
- **Một lời giải, suy luận được:** `countSolutions` = 1; mọi ô lúa kề một ô số; 9 ô lúa an toàn (cắm cờ hết là sai); `deduce` giải hết bằng "một số" và có đúng một bước "hai số". Bàn sinh bằng script Node.
- Gợi ý 3 hình + hình đáp án (chạm một ô chắc chắn, các cờ hiện dần, ba chòm đánh số). 273 test qua (thêm 6). Chơi thử Playwright: cắm cờ cả 17 hang (61 chấm vàng, 17 hang đọng nước), hình gợi ý (cờ
  hiện 1→17), chạm trên điện thoại 390 px (ô ~26 px).

## 2026-10-16

### Chương 5, màn 2: Hầm đom đóm (`glowTunnel.ts`)
- Màn ★3, mẹo nhìn. Vách hầm tối đen; **kéo chú cú tới đâu rồi thả thì cú hú**: vòng sóng lan (330 đơn vị/s) và mỗi ấu trùng loé sau khi sóng tới cộng một **độ trễ riêng**.
  Độ trễ của bốn chòm được chọn để từ đúng một tâm cả chòm loé cùng lúc, lần lượt 1,3 / 2,1 / 2,9 / 3,7 s; từ chỗ khác thì rời rạc lẫn 56 ấu trùng lẻ.
  Một chòm giả (hình vuông) loé trọn từ một tâm giả. Đáp án: cái gáo, vương miện, tam giác, thập tự theo thứ tự loé.
- **Sửa bản thiết kế:** ý "chòm nằm trên vòng đồng tâm" của bản nháp sai (chòm hai chiều không thể cùng cách một điểm); thay bằng độ trễ riêng, đã kiểm bằng số
  trước khi viết code. Cách tâm 40 đơn vị vẫn thấy ≥ 85% chòm, cách 250 chỉ còn ≤ 75%, cách 400 ≤ 65%.
- Gợi ý 3 hình + hình đáp án (cú trượt tới tâm; bốn chòm loé lần lượt; bốn chòm đánh số). 267 test qua (thêm 8). Chơi thử Playwright: kéo cú và đo số ấu trùng
  loé ở 1,3 / 2,1 / 2,9 / 3,7 s (7, 5, 3, 5 đúng bằng số sao từng chòm), hình gợi ý, chạm trên điện thoại 390 px.

### Chương 5, màn 1: Cửa kính toa đêm (`trainWindow.ts`)
- Màn đầu của Chương 5 (★1, màn mẹo nhìn mở đầu). Ba ô cửa kính toa tàu; đèn sáng thì kính là gương (quầng đèn, lưng ghế, bóng cú, và **chòm cái gáo giả** do
  7 đinh đồng giá hành lý ở ô giữa). **Núm gạt đèn** là rãnh dọc giữa ô 1 và 2: gạt xuống thì phòng tối dần (`glassMix`), phản chiếu mờ, sao hiện.
  Đáp án: thập tự, tam giác, lưỡi câu theo ô trái → phải. Chòm chỉ là chấm; mỗi ô thêm 7 chấm lẻ và ~20 sao mờ.
- Chương 5 được đăng ký (`CHAPTER_5`, `steady: true`, 12 vị trí sao trên bản đồ `LEVEL_STARS[4]`); mở khi giải đủ Chương 4.
- Gợi ý 2 hình + hình đáp án: núm trượt xuống kèm phòng tối dần và sao hiện (hoạt ảnh `act`), đọc ba chòm.
- 259 test qua (thêm 7: mở chương, trạng thái đầu không lộ sao, không mức nào đọc được cả chòm thật lẫn giả, vùng đọc ≥ 20% rãnh, ánh xạ núm,
  đáp án không theo thứ tự phím, chấm lẻ cách chòm). Chơi thử Playwright: kéo núm, hình gợi ý (đo vị trí núm theo thời gian), nhập đáp án, điện thoại 390 px.

### Chương 5 · Chuyến tàu đêm: bản thiết kế (nháp, chưa làm màn)
- Tài liệu mới `docs/CHAPTER5_DESIGN.md`: chú cú đi tàu đêm, 12 màn là các toa, ga xép, khúc đường. Người dùng yêu cầu thêm
  phần mới mẻ, **xen dễ và khó**, không trùng bài cũ.
- **Nhịp răng cưa** (★1–★5): 1, 3, 2, 4, 2, 4, 3, 5, 2, 4, 3, 5; mỗi màn khó có màn "thở" sau, ba kiểu màn (mẹo nhìn, đồ
  chơi bày rồi chạy, suy luận) đan nhau.
- **Mới:** kính cửa thành gương theo độ sáng, sóng âm đồng tâm trong hầm, quay ngược ống nhòm (tỉ lệ), lái đầu máy dồn
  toa, ghi tự lật sau mỗi chuyến tàu, đường đi vừa hết than, **lần đầu có đối thủ** (ván Nim, đã kiểm bằng Node có bộ bát
  1-2-3-6 cho đúng một nước thắng mỗi lượt), domino có thời gian, Slitherlink, người nói thật / nói dối; màn cuối gộp ba luật
  trên một máy. Có bảng kiểm tra trùng lặp và hai chủ đề dự phòng. Chờ người dùng duyệt trước khi làm.

### Màn 12: bố cục lại cho dễ nhìn trên điện thoại
- Người dùng báo bố cục lệch và khó nhìn trên điện thoại. Sửa: **bảng cần gạt** chuyển thẻ sang trái (ô 100), bảng cần gạt rộng 960 với bảy cần cách nhau 130
  (trước 96, các hình nhỏ chồng lên nhau và tràn ra ngoài khung), mỗi cần có khung vuông quanh hình đèn nhỏ, lưới ô của sân to hơn (18 thay vì 14),
  núm và rãnh to hơn; **thẻ đục lỗ** ô 108, chấm lề to hơn; **sân kính** ô 110, thấu kính, đinh vàng và bảy lưới nhắc cần to hơn; ba biểu tượng bảng
  to hơn; mái vòm gọn lại để bốn vòng chòm nằm hẳn trong vòm (trước vòng ngoài cùng tràn ra ngoài).

### Chương 4, màn 12: Mở vòm (màn tổng hợp) — Chương 4 đủ 12 màn
- Màn mới `openDome.ts`: **chuỗi ba bảng**, mỗi bảng theo luật một màn trước. (1) Thẻ đục lỗ 5×5 (như màn 1), lề là nhóm chấm. (2) Bảng
  cần gạt (như màn 4, dùng lại `AFFECTS`): bảy đèn nằm trên chính tấm thẻ ở sáu ô vòng quanh và ô giữa; đèn nằm dưới lỗ thì lúc đầu sáng,
  còn lại tối; gạt cần để cả bảy đèn sáng. Dưới mỗi cần là một lưới nhỏ 6×6 chỉ một ô của sân. (3) Sân kính thiên văn (như màn 10): các
  cần đang gạt xuống đặt sẵn kính cố định ở những ô đó (có đinh vàng trên ô), người chơi đặt nốt các kính còn lại.
- **Chuỗi:** bảng sau chỉ mở khi bảng trước xong (biểu tượng ở góc trên mờ đi và không bấm được); xong một bảng thì sau hơn một giây tự
  chuyển sang bảng kế; bảng đã xong khoá lại, xem lại được qua biểu tượng. Mỗi bảng chỉ có đề nhờ bảng trước: thẻ cho đèn, cần cho kính đặt sẵn.
- **Duy nhất (test duyệt):** thẻ đúng một nghiệm (đếm bằng DFS theo hàng); đúng một cách đặt cần làm sáng bảy đèn (duyệt 128, ba cần xuống);
  sân kính có hơn một nghiệm nếu **không** có kính đặt sẵn, đúng một nghiệm khi có các kính đó. Các cần còn lại chỉ vào ô không có kính.
- **Chòm sao:** sáu vùng, bốn vùng đinh tán đồng; chòm trong thấu kính phụ thuộc ô (như màn 10). Đáp án đọc theo cột từ trái sang phải:
  vương miện, lưỡi câu, thập tự, mũi tên (không đơn điệu theo bàn phím); các kính đặt sẵn chỉ lộ tối đa một chòm trước khi xong. Khi xong,
  bốn chòm hiện lên mái vòm ở góc trên bên trái.
- Có `help` ba đoạn (các bảng nối nhau; thẻ → đèn → kính đặt sẵn; luật như các màn trước và cách đọc), tự mở một lần.
- **Gợi ý:** 3 hình + đáp án (đục lỗ; gạt cần; đặt kính nốt rồi đọc). 252 test qua (thêm 5 test); chơi lại bằng Playwright ở desktop,
  điện thoại dọc và ngang: thử tab khoá, bảng sai, đủ ba bảng và nhập đáp án.
- Quy trình thử: không dùng `taskkill /IM node.exe` (tắt mọi tiến trình node, kể cả server của người dùng) nữa; chỉ tắt đúng cổng 4173 theo PID.

### Màn 11: bỏ viên khỏi kệ thì không còn chọn viên đó
- Người dùng thấy việc chạm viên trên kệ rồi viên đó vẫn đang được chọn rất khó chịu. Giờ chạm viên trên kệ thì nó **về khay luôn, không chọn gì**;
  đặt viên đang chọn lên ô đã có viên thì viên cũ về khay (cũng không được chọn). Chỉ viên chạm từ khay mới thành "đang cầm". Sửa lời trong thẻ Trợ giúp.

### Màn 11: sửa cán cân vẽ nghiêng ngược
- Người dùng báo một cân đáng ra phải sáng đèn. Nguyên nhân: cán cân vẽ **nghiêng ngược** (đĩa nặng hơn lại lên cao), trong khi đèn tính đúng,
  nên xếp theo hình sẽ thấy đèn sai. Sửa: đĩa nặng hơn thấp xuống, cân bằng thì ngang (`beamDrop`), có test kiểm hướng nghiêng với trọng lượng thật.
  Dữ liệu, lời giải và đáp án không đổi (mọi cân vẫn cần, vẫn đúng một nghiệm).

### Chương 4, màn 11: Cân đá chòm sao (suy thứ tự từ cân đĩa)
- Màn mới `starScales.ts`: năm cái cân đã cân sẵn (3 + 2 trên sàn), sáu viên đá phân biệt bằng hình (tròn, vuông, tam giác, lục giác,
  thoi, ngũ giác; không chỉ màu). Mỗi đĩa chứa 1–3 viên. Sáu viên nặng đúng 1–6 lạng, mỗi viên một mức; kệ có sáu ô đánh dấu 1–6 chấm.
  Chạm viên rồi chạm ô để đặt; viên trên kệ chạm để nhấc; chạm viên kệ khi đang cầm một viên để đổi chỗ. Chưa đủ sáu viên thì chưa có phản
  hồi; đủ sáu thì đèn trên mỗi cân sáng vàng (khớp) hoặc đỏ (lệch).
- **Duy nhất:** test duyệt 720 thứ tự và chỉ một thoả cả năm cân; **mỗi cân đều cần** (bỏ cân nào cũng thành nhiều nghiệm). Bàn sinh bằng
  Node: chọn ngẫu nhiên các cặp đĩa, yêu cầu đúng một nghiệm, không thừa cân, ít nhất ba cân có đĩa ≥ 2 viên và có cân thăng bằng.
- **Chòm sao:** bốn viên khắc chòm, hai viên trơn; hình khắc **chỉ hiện khi mọi cân khớp** (chưa giải thì không lộ). Đáp án đọc từ ô nhẹ đến
  ô nặng: mũi tên, thắt lưng, tam giác, cái gáo (không đơn điệu theo bàn phím).
- Có `help` ba đoạn (trọng lượng 1–6 lạng, cách đọc cân và cộng đĩa nhiều viên, thao tác và đèn), tự mở một lần.
- **Gợi ý:** 2 hình + đáp án: một viên trượt lên kệ (làm tương tự cho các viên còn lại), rồi các viên khắc sáng, đọc nhẹ → nặng.
- 246 test qua (thêm 5 test); chơi lại bằng Playwright (desktop, điện thoại dọc và ngang): thử sai (đèn đỏ), đổi chỗ, đặt đúng, nhập đáp án.

### Màn hình chính: quay lại đúng chương
- Bấm về màn hình chính từ một màn thì hub mở lại **chương của màn đó** (trước đây luôn về Chương 1). `chapterOfLevel` (ui/chapters.ts) tìm
  chương; `mountHub` nhận chương mở đầu; `main.ts` nhớ chương của màn vừa rời. Có test; kiểm bằng Playwright (từ màn 10 về hub mở Chương 4).

### Chương 4, màn 10: Sân kính thiên văn (Star Battle 6×6)
- Màn mới `telescopeYard.ts`: sân 6×6 chia sáu vùng (tô màu **và** viền kem giữa các vùng, không dựa riêng vào màu). Đặt sáu kính: mỗi
  hàng, cột, vùng đúng một kính, không hai kính kề nhau kể cả chéo. Chạm ô: chấm ghi nhớ → kính → xoá; kính phạm luật có viền đỏ
  (`conflicting`); đồng hồ sáu thấu kính cho biết đã đặt mấy kính; nút dọn sân.
- **Duy nhất:** test duyệt 720 hoán vị hàng-cột và chỉ một thoả luật vùng và không kề nhau. Bàn sinh bằng Node: mọc sáu vùng liên thông từ
  lời giải ngẫu nhiên, giữ bàn có đúng một nghiệm và giải được bằng suy luận (đơn ứng viên, "k vùng nằm gọn trong k hàng/cột" và ngược lại),
  chọn bàn cần dùng bước cặp hai lần (4 bàn trong 80 000 thử).
- **Chòm sao:** bốn vùng có đinh tán đồng (đinh là dấu hình dạng, không chỉ màu). Kính đặt ở vùng đó hiện một chòm trong thấu kính, chòm
  tuỳ **ô** (bảng `LENS`): ô đúng cho chòm đúng của vùng, các ô còn lại cho chòm khác (test đảm bảo khác chòm đúng). Hai vùng không đinh tán
  cho thấu kính trống. Đáp án đọc **theo cột từ trái sang phải**: thập tự, kim cương, hình vuông, thắt lưng, không đơn điệu theo bàn phím.
  Lúc đầu không lộ chòm nào (chưa có kính).
- Có `help` ba đoạn (luật hàng/cột/vùng/không kề nhau; chạm ô ba trạng thái và viền đỏ; đinh tán và cách đọc), tự mở một lần.
- **Gợi ý:** 2 hình + đáp án: sáu kính hiện dần, rồi bốn thấu kính đồng sáng lên, đọc trái → phải.
- 240 test qua (thêm 7 test); chơi lại bằng Playwright (desktop, điện thoại dọc và ngang): thử sai (viền đỏ), dọn sân, đặt đúng, đáp án được chấp nhận.

## 2026-10-15

### Chương 4, màn 9: Cú lên dây (lập trình đường đi)
- Màn mới `windUpOwl.ts`: sàn 6×6 với bốn ô chòm sao (chỉ chấm, không nét), ba ô nứt và một cành đậu. Người chơi xếp **8 thẻ lệnh**
  (bước ×4, quay trái ×2, quay phải ×2) vào 8 ô rồi bấm chạy; cú đồ chơi làm cả dãy **hai vòng liền nhau**, hướng nhìn cuối vòng một
  là hướng đầu vòng hai. Rơi nếu bước ra ngoài sàn hoặc xuống ô nứt. Xong khi đã dẫm đủ bốn ô chòm và dừng ở cành đậu.
- Bản đầu có thẻ **nhảy hai ô** (7 thẻ) nhưng người dùng thấy hình thẻ nhảy (mũi tên vòng cung, rồi mũi tên chồng hai đầu) không cùng
  kiểu các mũi tên khác và đề nghị bỏ; bây giờ chỉ có ba loại thẻ cùng kiểu (bước thẳng, gập trái, gập phải), thêm một thẻ bước (ba
  → bốn) cho đủ 8. Bàn sinh lại; ô nứt không còn có thể bay qua nên là chướng ngại thật.
- **Duy nhất:** trong 420 cách xếp tám thẻ (8!/(4!·2!·2!)) chỉ một cách thoả (test duyệt hết). Bàn sinh bằng Node: chọn một chương
  trình, chạy trên sàn trống để lấy các ô cú đi qua, chọn bốn ô làm ô chòm, đặt ô nứt rồi kiểm tra duy nhất.
- **Đáp án:** bốn chòm theo thứ tự cú dẫm lên (cái gáo, tam giác, lưỡi câu, vương miện), không đơn điệu theo bàn phím. Xong thì mỗi ô
  hiện thẻ 1–4 chấm theo thứ tự đi qua (như màn 6, 8). Nét thẻ bước/gập vẽ cùng độ dày và cỡ đầu mũi tên.
- Cú chỉ còn một mũi tên vàng (hướng nhìn); bỏ chìa khoá lên dây vẽ cạnh cú vì trông như mũi tên thứ hai (người dùng báo).
- Hình chòm trong ô **ẩn đến khi cú dẫm lên** (theo yêu cầu): lúc đầu mỗi ô chòm chỉ là một ngôi sao mờ, đi qua mới hiện chấm của chòm
  (giữ hiện qua các lần chạy sau); trên hình gợi ý cũng hiện dần theo bước chạy.
- **Bố cục:** thẻ llớn xếp hai hàng 4+4 (ô trên, khay dưới), nút chạy và gỡ ở cột bên phải để chạm được trên điện thoại. Chạm thẻ trong
  khay thì thẻ vào ô trống đầu tiên; chạm thẻ trong ô thì về khay. Có `help` ba đoạn (nghĩa của thẻ, hai vòng, điều kiện xong), tự mở một lần.
- **Gợi ý:** 3 hình + đáp án: xếp thẻ lần lượt vào ô, chạy (cú đi hết hai vòng, ô chòm sáng dần), đọc theo thẻ chấm.
- 233 test qua (6 test cho màn: duy nhất, dùng đúng thẻ trong khay, ô phân biệt trong sàn, thứ tự đi qua, rơi khỏi sàn/xuống ô nứt, đáp
  án không đơn điệu); chơi lại bằng Playwright (desktop, điện thoại dọc và ngang).

## 2026-10-14

### Màn 8 (Dây đồng nối sao): giảm độ khó một chút
- Người dùng thấy màn hơi khó. Hai thay đổi: (1) **ít dây đôi hơn**: lời giải giờ có 3 sợi đôi (trước 6); dây đôi buộc người chơi suy
  luận cả số lượng chứ không chỉ có/không. Chọn bằng leo đồi trên các cách đặt dây đôi của cùng bố cục sao, giữ đúng một nghiệm (test duyệt);
  (2) **hiện sẵn các đường có thể nối**: mỗi cặp sao có thể nối được vẽ một nét chấm mờ, nên người chơi thấy ngay sao nào nối được
  với sao nào (đặc biệt các đường chéo) thay vì phải tự tìm; dây thật đè lên nét chấm.
- Số sao, bốn chòm và đáp án không đổi (tam giác, mũi tên, vương miện, cái gáo). Bố cục sao giữ nguyên; thử dời hình chỉ làm mất tính
  duy nhất nên bỏ. 227 test qua; chơi lại bằng Playwright, nhập đáp án được chấp nhận.

### Màn 8 (Dây đồng nối sao): dây đi cả đường chéo, chòm đúng hình bàn phím
- Người dùng muốn làm theo dạng đường xéo, không cần vuông góc. Dây giờ đi **ngang, dọc hoặc chéo 45°** tới sao kề ngay trên đường đó.
  Cắt nhau tính bằng giao hai đoạn thẳng (`crosses`, so hướng bằng tích có hướng); cặp nối được duyệt theo bốn hướng. Dây đôi vẽ lệch
  vuông góc với dây.
- Nhờ vậy bốn chòm vẽ đúng dáng trên bàn phím thay vì dạng gấp khúc: **tam giác** (3 sao), **mũi tên** (4), **vương miện chữ W** thật với
  hai đường chéo xuống và hai đường chéo lên (5) và **cái gáo** (7). Bỏ hình vuông, thập tự, lưỡi câu của bản cũ.
- Bàn mới sinh lại (đặt từng hình có kiểm tra không cắt, không đè lên sao; chỉ số đan xen 0,74): 19 sao, 35 cặp nối được (18 mồi nhử),
  vẫn **đúng một nghiệm** (test duyệt). Bốn nhóm 3, 4, 5, 7 sao nên **đáp án**: tam giác, mũi tên, vương miện, cái gáo (số sao tăng dần).
- Thẻ chấm xếp thứ tự giờ tự chọn chỗ trống cạnh nhóm (không đè lên sao hay thẻ khác). `help` và gợi ý sửa lời cho có "chéo". 227 test
  qua; chơi lại bằng Playwright, nhập đáp án được chấp nhận.

### Màn 8 (Dây đồng nối sao): lưỡi câu thành vương miện (chữ W), các chòm đan xen nhau
- Người dùng muốn thay lưỡi câu bằng hình **W** (vương miện) và sắp xếp lại để không nhìn một phát ra hình. Chòm thứ ba giờ là **vương
  miện** vẽ bằng đường ngang/dọc kiểu sóng vuông (hai đầu cao, giữa thấp hơn, hai đáy; 8 sao, hộp 5×7), như dáng chữ W trên bàn phím.
- **Các chòm đan xen**: sinh bàn với điều kiện ≥ 45% số sao có sao gần nhất thuộc chòm khác, nên các nhóm không còn đứng tách thành cụm riêng
  như bản trước (bản đang dùng: 63%). Lúc đầu chỉ thấy một đám sao, hình chỉ hiện khi nối dây. Có test cho chỉ số này.
- Bàn mới: 24 sao, 30 cặp nối được (8 mồi nhử), vẫn **đúng một nghiệm** (test duyệt). Bốn nhóm có 4, 5, 7, 8 sao nên **thứ tự đáp án đổi**:
  hình vuông, thập tự, cái gáo, vương miện (theo số sao tăng dần; thẻ chấm 1–4 vẫn hiện khi xong). 227 test qua; chơi lại bằng Playwright,
  nhập đáp án được chấp nhận.

### Màn 8 (Dây đồng nối sao): vẽ lại chòm số 3 cho giống bàn phím
- Người dùng báo hình số 3 (nhóm 3 chấm, lưỡi câu) không khớp. Hình chữ J cũ (thân 3 sao, đáy 2 sao, móc 1 sao) khác lưỡi câu trên bàn
  phím: ở đó thân dài (4 sao) rồi mới quặt sang phải và lên. Vẽ lại thành thân **4 sao** thẳng đứng, một sao sang phải ở đáy rồi một sao
  lên (6 sao, hộp 7×3), đúng thứ tự ngoặt của lưỡi câu.
- Vì hình đổi nên sinh lại bàn: 22 sao, 27 cặp có thể nối (7 mồi nhử), vẫn **đúng một nghiệm** (test duyệt) và bốn nhóm 4, 5, 6, 7 sao. Test
  hình lưỡi câu cập nhật. Đáp án và gợi ý không đổi. 226 test qua; chơi lại bằng Playwright, nhập đáp án được chấp nhận.

### Chương 4 · màn 8 "Dây đồng nối sao" (Hashi / Bridges)
- **`copperWires.ts`**: 22 ngôi sao trên lưới 11×11, mỗi sao có chấm là số sợi dây đồng phải nối vào nó. Dây đi ngang hoặc dọc tới sao kề
  trên cùng hàng/cột, không cắt nhau, giữa hai sao tối đa hai sợi. Chạm sao rồi chạm sao kề: một sợi, chạm lần nữa: dây đôi, lần ba: gỡ.
  Sao đủ dây sáng vàng, thừa dây viền đỏ; vòng nét đứt chỉ các sao kề nối được. Bản đồ có 29 cặp có thể nối, 9 cặp là mồi nhử.
- **Dây vẽ nên chòm sao** (ý của kế hoạch): nghiệm duy nhất gồm bốn nhóm riêng: hình vuông (4 sao), dấu cộng/thập tự (5), lưỡi câu (6) và
  cái gáo (7). Chỉ dùng chòm vẽ được bằng đường ngang/dọc. Không bắt buộc các nhóm nối với nhau (khác Hashi gốc). Test duyệt toàn bộ
  cách đặt 0/1/2 sợi: **chỉ một** cách khớp số và không cắt nhau.
- **Đáp án** theo số sao tăng dần: hình vuông, thập tự, lưỡi câu, cái gáo. Thứ tự không suy ra được từ cảnh nên (như màn 6) khi xong, mỗi
  nhóm hiện thẻ chấm vàng 1–4 chấm. Thẻ hiện ngay khi mọi sao đủ dây.
- Màn mới lạ nên có `help` (thẻ Trợ giúp tự mở một lần): nghĩa của chấm, cách nối và gỡ dây, luật không cắt nhau. 226 test qua; thử
  Playwright trên desktop và điện thoại 390×844.

### Màn 7 (Khoá của người gác cũ): thêm giải thích, bỏ khoá tập
- Người dùng thấy màn hơi khó, nên thêm giải thích, và hỏi phần thử có cần không. Trả lời: **khoá tập** bên trái chỉ để dạy nghĩa chốt
  vàng/bạc; có giải thích rồi thì không cần nữa, và nó làm rối thêm nên **đã bỏ**. Hàng thử mã dưới cùng thì giữ (nó là công cụ giúp
  đỡ khó: đèn mỗi trang báo mã thử có khớp trang đó).
- **Giải thích**: (1) chú giải ngắn bên trái trong cảnh (chốt vàng, chốt bạc, vòng rỗng, cách dùng hàng thử); (2) vì chữ trong cảnh nhỏ
  trên điện thoại nên thêm cơ chế `PuzzleDef.help`: vài câu hiện **trên đầu thẻ Trợ giúp**, và thẻ **tự mở một lần** khi vào màn có
  `help` (lưu vào `seenGuides`). Chỉ màn này dùng; các màn khác vẫn chỉ có thẻ trợ giúp chung, đáp án không bao giờ nói ở đây.
- Trang sổ giữ nguyên, đáp án không đổi. Test bỏ phần khoá tập. 221 test qua; kiểm trên desktop và điện thoại.

### Chương 4: ảnh đứng yên khi rê chuột, con cú không đè ô
- Người dùng báo khung hình cứ đung đưa khi rê chuột rất khó chịu. Nguyên nhân: cảnh có hiệu ứng parallax (các lớp trôi theo con trỏ,
  tới 16 px), và các màn Chương 4 đặt vật cần căn khớp ở hai lớp khác nhau (khung ở lớp giữa, ô và đèn ở lớp trước) nên chúng lệch nhau
  khi rê. Thêm cờ `steady` cho chương (`Chapter.steady`, `Scene.parallax`): **Chương 4 tắt parallax**, ảnh đứng yên. Chương 1–3 giữ
  nguyên. Muốn tắt cả game thì đặt `steady: true` cho các chương còn lại.
- Màn 7: con cú dời sang trái (x 560 → 470) để không đè lên ô thử đầu tiên.

### Chương 4 · màn 7 "Khoá của người gác cũ" (Mastermind)
- **`oldKeeperLock.ts`**: cuốn sổ của người gác cũ có 5 lần thử mở khoá bốn chòm, mỗi lần kèm các chốt: **chốt vàng** = đúng chòm đúng
  chỗ, **chốt bạc** = đúng chòm nhưng sai chỗ. Bảy chòm (bỏ mũi tên và kim cương). Hàng dưới cùng của sổ có 4 ô để thử mã (chạm đổi
  chòm); mỗi trang có một đèn sáng khi mã đang thử cho đúng số chốt ghi ở trang đó. Chỉ một mã làm sáng cả 5 đèn.
- **Khoá tập** bên trái: mã hai chòm hiện sẵn, hai ô để thử và hai chốt hiện kết quả ngay, để người chơi tự thấy nghĩa chốt vàng và
  bạc mà không cần chữ.
- Đáp án: mã bốn chòm từ trái sang phải: vương miện, thắt lưng, cái gáo, tam giác. Test duyệt toàn bộ 7^4 = 2401 mã (kể cả mã lặp
  chòm): chỉ một mã khớp cả 5 trang, và bỏ bất kỳ trang nào cũng có nhiều hơn một mã. Mọi trang đều có ít nhất một chốt, không trang
  nào là mã thật. Cách tính chốt chuẩn Mastermind, có xử lý chòm lặp.
- Gợi ý 2 hình + đáp án: hàng thử hiện dần bốn chòm của đáp án (cả 5 đèn sáng), rồi bốn ô đánh số 1–4. 221 test qua; chơi thử
  Playwright trên desktop và điện thoại 390×844.

### Màn 6 (Bàn hạt sao): hiện thứ tự đọc sau khi xong
- Người dùng nhận xét màn 6 không có manh mối nào cho thứ tự đọc (theo chiều kim đồng hồ từ đế trên cùng) nên đề nghị cho thấy thứ tự
  sau khi hoàn thành. Giờ khi còn đúng 4 hạt trên 4 đế, mỗi đế hiện một **thẻ chấm vàng** (1 đến 4 chấm, đếm chấm chứ không chữ số) cạnh
  hạt: đọc theo thứ tự đó. Hoàn tác thì thẻ ẩn đi. Thẻ nằm trong cảnh nên hình gợi ý bước 2 cũng có sẵn thẻ; bỏ các huy hiệu số
  riêng của hình gợi ý cho khỏi trùng. Trước khi xong thì không hiện gì, đáp án vẫn không lộ.

### Chương 4 · màn 6 "Bàn hạt sao" (peg solitaire)
- **`starBoard.ts`**: bàn hình chữ thập 21 lỗ (khung 5×5 bỏ bốn góc) với 10 hạt. Một hạt nhảy thẳng qua hạt bên cạnh vào lỗ trống ngay
  sau đó, hạt bị nhảy qua rơi xuống. Có 4 hạt mang chòm sao (tam giác, lưỡi câu, vương miện, hình vuông, chỉ chấm) và 6 hạt trơn.
  Bốn **đế vàng** quanh tâm (trên, phải, dưới, trái); xong khi chỉ còn đúng 4 hạt, mỗi hạt một đế. Chạm hạt (nhấc lên, các lỗ nhảy
  tới được hiện vòng đứt nét vàng) rồi chạm lỗ đích. Một nút Hoàn tác lùi một lần nhảy. Có tiếng `ding` nhỏ khi xong.
- **Một đáp án**: bàn cờ chọn bằng tìm kiếm (kéo ngược từ trạng thái xong) sao cho mọi cách kết thúc đủ 4 hạt trên 4 đế đều cho cùng
  chòm ở từng đế; test duyệt toàn bộ 404 trạng thái. 91 cách bế tắc, chỉ 1 cách xong. Đáp án: chòm trên bốn đế **theo chiều kim đồng
  hồ từ đế trên cùng**: lưỡi câu, vương miện, hình vuông, tam giác. Lúc đầu cả bốn đế đều trống.
- Lời giải mẫu 6 lần nhảy (dùng cho gợi ý và test). Gợi ý 2 hình + đáp án: một lần nhảy mẫu (hạt trượt, hạt bị nhảy qua mất đi), rồi
  bàn đã xong với bốn đế đánh số 1–4 theo chiều kim đồng hồ. 215 test qua; chơi thử Playwright trên desktop và điện thoại.
- Ghi chú thiết kế: phải chọn đế vàng là bốn lỗ kề tâm; bản đầu đặt đế ở bốn đầu mút nhánh thì **không bao giờ tới được** (hạt chỉ vào
  được các đầu mút từ tâm, mà tâm chỉ vào được từ các đầu mút).

### Màn 5 (Kho thấu kính): chỉ giữ một nút Hoàn tác
- Người dùng chỉ muốn một nút roll back ở màn 5: bỏ nút Đặt lại, giữ **Hoàn tác** đặt giữa phía trên bốn nút mũi tên. Vì chỉ còn một
  nút, mỗi lần bấm lùi **một lần đẩy** cùng các bước đi trước nó (trước đây lùi từng bước đi) nên gỡ kẹt không phải bấm hàng chục lần;
  chưa đẩy lần nào thì lùi về chỗ xuất phát. Câu gợi ý bỏ chữ "Đặt lại".

### Màn 3 (Bình dầu đèn): bỏ hai nút Hoàn tác và Đặt lại
- Người dùng bảo bỏ hai nút này ở màn 3, không cần. Gỡ cả hai nút lẫn lịch sử hoàn tác trong `oilJars.ts`. Không ảnh hưởng độ khó vì
  mọi trạng thái đều rót ngược được về bình đầy (test "không kẹt" vẫn giữ). Câu gợi ý bước 2 sửa thành "từ lúc bình đèn đầy (rót ngược
  về nếu cần)". Màn 5 giữ hai nút vì có thể kẹt hòm.

### Các nút công cụ (Hoàn tác, Đặt lại, mũi tên) dùng chung một kiểu
- Người dùng thấy hai nút Hoàn tác và Đặt lại mỗi cái một kiểu (cỡ biểu tượng và độ đậm khác nhau; màn 3 và màn 5 mỗi nơi tự vẽ nút).
  Gom về `toolButton` trong `src/core/svg.ts`: cùng bán kính 60, cùng vòng viền, cùng độ đậm nét, cùng cỡ biểu tượng (khung 24 đơn vị,
  phóng 2,1 lần; biểu tượng Hoàn tác chiếm ít khung hơn nên được phóng thêm 1/8 và bớt nét tương ứng để trông cùng cỡ). Bốn nút mũi
  tên của màn 5 cũng đi qua `toolButton` (`arrowIcon`). Màn mới có nút công cụ thì dùng `toolButton`, đừng tự vẽ.

### Biểu tượng Hoàn tác / Đặt lại: vẽ lại lần hai, đặt lên khỏi nền sàn
- Người dùng báo bản vẽ lại lần đầu vẫn chưa đúng. Chụp ở độ phân giải cao thấy hai biểu tượng vẫn lệch và nét không đều (tự vẽ đường
  cong bằng tay). Thay bằng hình mũi tên quay lại và mũi tên vòng chuẩn (bộ hình Lucide `undo-2` và `rotate-ccw`, khung 24 đơn vị, đúng
  tâm), phóng 1,5 lần, nét tròn đầu; dùng chung cho màn 3 và 5 (`undoIcon`, `resetIcon` trong `src/core/svg.ts`).
- Hai nút của màn 3 nằm vắt ngang đường chân sàn (nửa trên nền trời, nửa dưới nền gỗ) nên đưa lên hẳn phía trên đường sàn, ngay dưới
  tờ công thức.

### Sửa hình biểu tượng Hoàn tác và Đặt lại (màn 3 và 5)
- Người dùng gửi ảnh: biểu tượng bị lệch tâm và mũi tên Đặt lại vẽ sai (đầu mũi tên thành chữ L, trông như nút nguồn). Vẽ lại hai
  biểu tượng thành hàm dùng chung `undoIcon` và `resetIcon` trong `src/core/svg.ts` (cùng tâm (0, 0), rộng khoảng 40 đơn vị, đầu mũi
  tên tính từ tiếp tuyến của cung), dùng cho cả màn 3 và màn 5; nút màn 5 cũng to hơn một chút.

### Màn 3 (Bình dầu đèn): sửa nút mũi tên Hoàn tác
- Người dùng báo mũi tên back (Hoàn tác) của màn 3 bị lỗi. Chưa tái hiện được lỗi chạy sai, nhưng sửa mọi chỗ nghi ngờ: (1) Hoàn tác trước
  đây **ẩn lại cả ô công thức đã hiện** trong khi Đặt lại thì giữ, trái với "đã đọc thì ở lại"; giờ Hoàn tác chỉ đưa các bình về, ô đã hiện
  giữ nguyên; (2) bấm Hoàn tác khi chưa có nước nào để hoàn mà một bình đang được chọn thì bình vẫn nhấc lên; giờ luôn bỏ chọn;
  (3) nút Hoàn tác và Đặt lại quá nhỏ trên điện thoại dọc (bán kính khoảng 11 px) nên to hơn (hình 62, vùng chạm 84 đơn vị, chữ
  tượng hình phóng 1,25 lần); (4) tờ công thức bị các ô sát mép phải nên nới thêm lề. Thử lại: desktop, điện thoại dọc và ngang.

### Chương 4 · màn 3 "Bình dầu đèn" (rót nước đo lượng) và bố cục lại màn 4
- **Màn 3 (`oilJars.ts`)** làm theo yêu cầu bổ sung màn còn thiếu; chèn vào chỉ số 2 của `CHAPTER_4` nên bốn màn 1–5 giờ đúng thứ tự
  trên bản đồ. Ba bình 8 / 5 / 3 phần: bình đèn lớn (có ngọn lửa) đầy, hai bình kia rỗng, không có vòi hay chỗ đổ. Chạm bình nguồn rồi
  bình đích để rót cho tới khi nguồn cạn hoặc đích đầy (bình nhấc lên khi được chọn); mỗi bình có vạch cho từng phần. Tờ công thức
  có 4 ô, mỗi ô vẽ một bình đèn đổ tới một mức (4, 1, 7, 2); bình đèn đạt đúng mức thì chòm của ô đó hiện ra và **ở lại**. Mức 4 cần
  7 lần rót, mức 1 và 7 cần 5 lần. Mọi trạng thái đều quay về được bình đầy nên không bao giờ kẹt (vẫn có Hoàn tác, Đặt lại; đặt lại
  không xoá các ô đã hiện). Đáp án: bốn ô từ trái sang phải, từ trên xuống: lưỡi câu, tam giác, thắt lưng, vương miện.
- **Màn 4 bố cục lại** vì chữ "hiển thị không đầy đủ" (vòm tròn bị cắt mép trên và bảng cần gạt đè lên đèn dưới): đèn bên trái, cần gạt bên
  phải, hai bên không chồng nhau. Mỗi cần rộng 127 đơn vị với hình nhỏ các đèn và chòm khắc đặt thẳng hàng; thử cả desktop, điện thoại
  dọc 390×844 và ngang 844×390, thấy đủ 7 đèn, 7 cần, 7 hình nhỏ và 7 chòm.
- Test: 5 test cho màn 3 (rót đúng, bốn mức đều đạt được và cần ≥ 3 lần rót, hai chuỗi gợi ý đi qua cả bốn ô, không kẹt, đáp án không
  theo thứ tự phím). 209 test qua. Đã chơi thử bằng Playwright: giải màn 3 bằng hai chuỗi rót, nhập đáp án.

### Chương 4 · màn 4 "Bảng cần gạt vòm" (Lights Out) và màn 5 "Kho thấu kính" (Sokoban)
- Người dùng yêu cầu làm màn 4 và 5 trước (màn 3 "Bình dầu đèn" để sau). Hai màn đứng thứ 3 và 4 trong `CHAPTER_4` cho tới khi
  màn 3 được thêm vào đúng vị trí (chèn vào chỉ số 2 của `CHAPTER_4`, và cập nhật danh sách id trong test mở chương).
- **Màn 4 (`domeLevers.ts`)**: 7 đèn dưới vòm (vòng sáu quanh một đèn giữa) và 7 cần gạt. Phía trên mỗi cần có hình nhỏ của 7 đèn với
  các đèn nó đổi được tô vàng (không có dây cắt nhau). Gạt một cần thì đổi sáng ↔ tối các đèn đó; gạt lại thì đổi lại. Người gác cũ
  để sẵn 2 cần xuống. Ma trận cần → đèn khả nghịch nên chỉ có **một** vị trí các cần làm sáng cả 7 đèn (test duyệt 128 tổ hợp).
  Đáp án: chòm khắc dưới các cần đang xuống khi cả vòm sáng, từ trái sang phải (vương miện, lưỡi câu, tam giác, hình vuông).
- **Màn 5 (`lensDepot.ts`)**: kho 9×7, chú cú **đẩy** (không kéo) 6 hòm thấu kính tới 4 khe trên thanh ray phía trên. Mỗi khe vẽ viền
  một hình (tròn, vuông, tam giác, lục giác) và chỉ nhận hòm có thấu kính cùng viền; 2 hòm xám nứt (viền thoi) không vào khe nào.
  Thấu kính vào khe thì chiếu chòm lên màn nhỏ phía trên; đáp án là bốn màn từ trái sang phải (lưỡi câu, vương miện, thắt lưng, hình
  vuông). Đẩy vào góc hay sát tường có thể kẹt nên có nút **Hoàn tác** và **Đặt lại** (thành phần giao diện mới). Điều khiển: phím
  mũi tên, bốn nút mũi tên trên cảnh, hoặc kéo ngón tay (mỗi nửa ô một bước) / chạm về phía ô muốn tới.
- Bản đồ màn 5 sinh bằng cách kéo ngược từ trạng thái xong rồi kiểm bằng bộ giải BFS (17 lần đẩy); test mô phỏng chính chuỗi đẩy đó.
  Đáp án màn 5 chỉ lộ khi thấu kính vào khe nên không đọc được từ lúc đầu.
- Test mới: 5 cho màn 4 và 5 cho màn 5; 204 test qua. Đã chơi thử bằng Playwright cả hai màn trên desktop, vuốt trên điện thoại 390×844
  (màn 5), thẻ gợi ý 3 hình mỗi màn.

### Chương 4 · màn 2 "Tủ ngăn kéo" (Latin square / sudoku 4×4)
- Tủ 4×4 ngăn kéo, bốn loại đá sao (tam giác, lưỡi câu, vương miện, hình vuông, chỉ chấm). **Mỗi hàng, cột và khối 2×2 (ngăn bằng
  đường dày) phải đủ bốn loại.** Bốn ngăn đã mở sẵn với đá ghim (chốt nhỏ); chạm ngăn khác để đổi đá (trống → 1 → 2 → 3 → 4 → trống).
  Mười hai đèn quanh tủ (cạnh hàng, cột, khối) chuyển vàng khi nhóm đó đủ bốn loại; tiếng `ding` nhỏ khi cả tủ xong.
- Đáp án: đá trong **bốn ngăn có tay nắm đồng** (thanh ngang; ngăn khác là núm tròn), từ hàng trên xuống hàng dưới: hình vuông,
  vương miện, tam giác, lưỡi câu (không theo thứ tự phím, và không theo thứ tự cột).
- Chỉ 4 đá ghim, đủ để có đúng một cách điền; test duyệt mọi cách điền và kiểm bỏ đi bất kỳ đá ghim nào cũng thành nhiều hơn một cách.
  194 test qua. Đã chơi thử bằng Playwright (điền hết, nhập đáp án, thẻ gợi ý 3 hình).

### Chương 4 · Đài thiên văn bỏ hoang: màn 1 "Thẻ đục lỗ" (nonogram)
- Người dùng duyệt kế hoạch Chương 4 (12 màn giải đố dễ → khó, `docs/CHAPTER4_DESIGN.md`) và yêu cầu làm trước màn 1. Chương 4 hết
  "Sắp ra mắt": `CHAPTER_4` có 1 màn, tab chương đã mở (cần giải đủ Chương 3), bản đồ có sẵn 12 vị trí sao (`LEVEL_STARS[3]`).
- Màn 1 là **nonogram 5×5, ba thẻ**: nhóm chấm ở mép cho các dải lỗ liền nhau trong hàng/cột; đục lỗ cho khớp thì ánh đèn xuyên
  qua thành chấm trên màn chiếu. Ba thẻ là ba chòm (tam giác, lưỡi câu, vương miện), mỗi thẻ 2 lỗ lẻ để chỉ có một lời giải; một thẻ
  mẫu (chiếc ghế) đã đục sẵn trên giá để học luật, không viết hướng dẫn. Chạm hoặc kéo để đục (kéo sơn cả hàng), bàn phím dùng Tab,
  Enter, phím mũi tên. Đèn dưới màn chiếu vàng khi thẻ xong, tiếng `ding` nhỏ (không `chime`).
- Test mới: mỗi thẻ đúng 1 lời giải và giải được chỉ bằng suy luận theo dòng, không chòm lạ lọt trong lỗ, thẻ mẫu không chứa chòm,
  đáp án không theo thứ tự phím, Chương 4 chỉ mở sau Chương 3. 188 test qua. Đã chơi thử bằng Playwright: desktop, cảm ứng 390×844
  và 360×740 (kéo sơn không cuộn trang), thẻ gợi ý 4 bước.
- Sửa trong lúc làm: thẻ mẫu ban đầu hình ngôi nhà vô tình chứa bốn góc của hình vuông nên đổi thành hình chiếc ghế.

### Chốt Chương 3 · Phố đêm rằm (12 màn)
- Người dùng chốt chương. Kiểm tra cuối bằng Playwright cho cả 12 màn trên desktop (1280×800) và điện thoại cảm ứng (390×844):
  không lỗi console; trạng thái đầu không lộ đáp án; thẻ gợi ý mở đủ bước (màn 8 có 4 hình, các màn khác 3 hình); nhập đáp án
  thì màn được ghi là đã giải và hiện thẻ "đã giải". 179 test qua.
- Sửa câu gợi ý màn 11: từ khi cho chọn trùng, cả 6 thẻ có thể sáng với cách xếp có trùng, nên câu nói rõ "một cách xếp đủ 4 bạn
  và 4 đèn khác nhau".
- Danh sách màn: Bia đá · Dấu chân trên cát · Dàn ly nước · Sạp đèn · Hoa đăng · Tấm đồng rắc cát · Đồng hồ sao · Ba bức tranh ·
  Mật thư tò he · Ảnh phơi sáng (lia máy) · Ai cầm đèn nào · Đêm rước đèn. Chương 4 vẫn là "Sắp ra mắt".
- Còn để ý: màn 12 rất đông hình trên điện thoại hẹp (4 thẻ bạn, 9 mái, 5 lời khai trong một khung), đọc được nhưng nhỏ.

## 2026-10-13

### Màn 10 (Ảnh phơi sáng): đổi cách chơi sang lia máy
- Người dùng thấy màn vẫn quá đơn giản và muốn đổi cách chơi. Bỏ thanh thời gian phơi sáng; giờ là **tốc độ lia máy**: sáu người
  chạy qua phố với tốc độ và chiều khác nhau, ai chạy đúng tốc độ máy lia thì nét (đốm lửa thành chòm, đếm được nút tua trên
  đèn), mọi thứ khác kể cả phố bị kéo thành vệt ngang (bộ lọc `feGaussianBlur` theo chiều ngang). Bốn người có tua 1–4 nút cho
  thứ tự; người đứng yên và một người không tua là bẫy. Test mới (mỗi tốc độ chỉ một người nét, đáp án khác cả vị trí lẫn tốc độ).

### Màn 10 (Ảnh phơi sáng): khó hơn một chút
- Yêu cầu của người dùng: màn hơi đơn giản. Thêm hai bẫy: một khách **đi chậm** (chỉ nhoè quá ngưỡng đọc khi phơi ≥ 70%, nên phơi
  vừa còn yếm trùng) và một bạn đứng yên **hay lắc người** (nhoè nhẹ, vẫn đọc được yếm, không được bỏ). Hàm `blurOf`, test mới.

### Bản đồ Chương 3: nhãn "Đêm rước đèn" không còn bị đồi che
- Ngôi sao màn 12 nằm sát đồi con cú nên chữ "Đêm" bị mép đồi che một ít. Dời sao 12 lên và sang phải một chút ([330, 460]), sao 11 sang
  [520, 430] cho đều.

### Màn 12: bỏ lời khai sai
- Yêu cầu của người dùng (kèm ảnh thẻ lời khai về bạn mũ đỏ): thẻ đó tô cột ngoài cùng, **tô cột giữa** để khớp đáp án. Thẻ này
  chính là lời khai sai cố ý, nên sau khi sửa **cả 5 lời khai đều đúng** và màn không còn một lời sai phải loại. Đã cập nhật
  `CLAIMS`, ghi chú gợi ý, test và tài liệu.

### Màn 12: sửa tương tự màn 11
- Yêu cầu của người dùng: màn 12 cũng **cho chọn trùng** (một bạn có thể đặt dấu lên nhiều mái che, không còn hoán đổi) và
  mỗi thẻ lời khai có **đèn nhỏ sáng khi các dấu đặt thoả điều kiện của thẻ**, không cần đúng vị trí. Hàm `claimLights` và
  test mới.

### Màn 11: thẻ sáng khi thoả điều kiện, không cần đúng vị trí
- Yêu cầu tiếp của người dùng: **thẻ sáng ngay khi thoả điều kiện**, kể cả khi bạn/đèn bị chọn trùng ở nhiều chỗ (bản đầu
  làm tối thẻ khi trùng). Một thẻ về bạn/đèn đã đặt sáng nếu điều kiện đúng với **bất kỳ** chỗ nào bạn/đèn đó đang ở;
  thẻ "không cầm" tắt khi hai thứ chung một chỗ nào đó; thẻ về thứ chưa đặt không sáng. Đáp án duy nhất của màn không đổi.

### Màn 11: cho phép chọn trùng bạn/đèn
- Yêu cầu của người dùng: khi đổi bạn nhỏ hoặc đèn ở một chỗ mà trùng với chỗ khác thì **không hoán đổi** nữa mà cho trùng.
  Chỗ cũ giữ nguyên. Thẻ nói về bạn/đèn xuất hiện nhiều hơn một lần thì **không sáng** (coi như chưa xác định).
  Test mới cho trường hợp trùng.

### Chương 3 hoàn tất: màn 11 "Ai cầm đèn nào" và màn 12 "Đêm rước đèn"; thêm Chương 4 "Sắp ra mắt"
- **Màn 11** `procession.ts`: suy luận thuần. 4 bạn × 4 đèn × 4 chỗ trong đoàn, 6 thẻ gợi ý bằng hình; chạm ô bạn nhỏ/đèn
  để thử, đèn góc thẻ vàng khi đúng. Đáp án duy nhất (duyệt 576 cách, bỏ thẻ nào cũng thành nhiều hơn 1 cách).
- **Màn 12** `nightProcession.ts`: màn cuối, đáp án là **vị trí** 3×3. Dấu chân (thứ tự) + giấy gói (hoa văn → mái che) +
  5 lời khai bằng hình có một lời sai (không thể đúng với giấy gói). Dùng lại `drawPattern` (màn 4) và `drawSole`
  (màn 2); biểu tượng bạn nhỏ dùng chung ở `kidIcons.ts`. Đáp án duy nhất kiểm bằng duyệt tổ hợp.
- **Chương 4**: thêm vào `CHAPTERS` với `comingSoon: true` (tab có ổ khoá, màn hình "Sắp ra mắt"); chưa có màn.
- Test (177): duy nhất của cả hai màn, mỗi thẻ cần thiết, lời khai sai, hoa văn khớp mái, đáp án không theo thứ tự phím.

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
