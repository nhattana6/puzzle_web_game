# THE STAR KEEPER (Người giữ sao) — Tài liệu thiết kế

> Web game giải đố không lời, lấy cảm hứng *thể loại* từ HER TREES : PUZZLE DREAM (cảnh nhỏ → làm đúng thì ký hiệu
> ẩn lộ ra → nhập chuỗi ký hiệu để qua màn), nhưng chủ đề, nhân vật, mỹ thuật, bộ ký hiệu và từng câu đố là riêng.

---

## 1. Phân tích HER TREES : PUZZLE DREAM

### 1.1 Tóm tắt
- Nhà phát triển indie "Stone", phần thứ 3 của series, ra mắt 10/02/2026 trên Steam (PC), giá ~3.99 USD.
- Hơn 40 câu đố, chơi khoảng 1,5–3 giờ. Đánh giá Steam: Overwhelmingly Positive (~97%).

### 1.2 Vòng lặp chơi cốt lõi
1. Người chơi vào một cảnh mơ vẽ tay.
2. Click, kéo, xoay, kết hợp các vật thể trong cảnh.
3. Khi sắp xếp đúng, **các chữ cái ẩn lộ ra**.
4. Nhập các chữ tìm được vào **lưới 3×3 (A–I)** → mở câu đố tiếp theo.

### 1.3 Vì sao game thành công
| Yếu tố | Tác dụng |
|---|---|
| Mỹ thuật đen trắng vẽ tay, siêu thực | Nhận diện mạnh, dễ lan truyền qua ảnh chụp |
| Không có lời thoại / chữ | Không cần bản địa hoá, chơi được toàn cầu |
| Câu đố ngắn, mỗi cảnh một ý tưởng | Phiên chơi ngắn, cảm giác "aha" liên tục |
| Gợi ý mở sau thời gian chờ | Không bị kẹt vĩnh viễn nhưng vẫn khuyến khích tự nghĩ |
| Giá rẻ, thời lượng ngắn | Rào cản mua thấp, tỉ lệ chơi hết cao → review tốt |

### 1.4 Điểm yếu The Star Keeper khai thác
| Điểm yếu của HER TREES | Cách The Star Keeper làm khác |
|---|---|
| Chữ cái A–I không mang ý nghĩa | Ký hiệu là **chòm sao**, mỗi chòm một nốt nhạc; đáp án đúng phát thành giai điệu |
| Gợi ý chờ thời gian, thụ động | Gợi ý đổi bằng **đom đóm** tìm trong cảnh → thưởng cho sự tò mò |
| Có lúc không biết vật nào tương tác được | **Thẻ trợ giúp chung** (nút ?) + **thẻ gợi ý có hình minh hoạ** (khoanh đỏ, mũi tên, câu hướng dẫn) |
| Chỉ có trên PC | Chơi ngay trên trình duyệt, desktop và điện thoại cảm ứng |
| Các câu đố rời nhau | Bản đồ bầu trời: mỗi màn thắp lại một vì sao, nối thành đường đi |

### 1.5 Những thứ KHÔNG sao chép
Cơ chế thể loại không thuộc riêng ai, nhưng *biểu hiện cụ thể* thì có. Game **tránh**:
- Tên, chủ đề cây/giấc mơ, nhân vật cô gái goth, mỹ thuật đen trắng bút chì.
- Chữ cái làm ký hiệu. Bàn phím 3×3 được giữ vì là quy ước thể loại, nhưng ô là chòm sao có âm thanh.
- Bất kỳ câu đố cụ thể nào của HER TREES.
- Gợi ý chờ đếm ngược làm cơ chế chính (chỉ có một lưới an toàn sau 3 phút, xem 3.5).

---

## 2. Ý tưởng game

### 2.1 Pitch một câu
> Một chú cú canh giữ bầu trời đêm đi qua những căn phòng, đài thiên văn và cánh đồng để tìm lại các chòm sao đã
> lẩn vào đồ vật quanh mình, và thắp lại từng vì sao trên bản đồ bầu trời.

### 2.2 So sánh với HER TREES
| | HER TREES : PUZZLE DREAM | The Star Keeper |
|---|---|---|
| Chủ đề | Giấc mơ, cây, cô gái | Bầu trời đêm, đài thiên văn, chú cú giữ sao |
| Mỹ thuật | Đen trắng vẽ tay | Nền xanh đêm, sao vàng, nét mảnh, giấy cắt nhiều lớp có parallax |
| Ký hiệu | Chữ cái A–I | 9 chòm sao: tam giác, hình vuông, vương miện, thập tự, thắt lưng, cái gáo, kim cương, mũi tên, lưỡi câu |
| Thứ tự đọc | theo cảnh | trái → phải, theo pha trăng, hoặc theo thứ tự xuất hiện |
| Gợi ý | chờ thời gian | đom đóm; mỗi gợi ý giúp một phần, tối đa 3 mỗi màn |
| Tiến trình | cây nở hoa | thắp lại vì sao trên bản đồ bầu trời |
| Nền tảng | PC (Steam) | Web (desktop + điện thoại), có thể đóng gói Steam sau |

### 2.3 Mỹ thuật & âm thanh
- **Bảng màu:** đêm `#0d1024`, bảng điều khiển `#1d2142`, ánh sao `#fff1c4`, vàng `#f4c66a`, đỏ gợi ý `#e0533c`.
  Ánh sáng và sao là thứ sáng nhất trong cảnh nên mắt người chơi tự bị dẫn tới chỗ quan trọng.
- **Cảnh 1600×900, ba lớp** (sau / giữa / trước) trôi nhẹ theo con trỏ như một hộp giấy cắt.
- **Nhân vật:** chú cú tròn mắt vàng, xuất hiện trong cảnh và trên bản đồ; không nói, chỉ chớp mắt.
- **Âm thanh (WebAudio, không cần file):** mỗi chòm sao một nốt trên thang ngũ cung, đáp án đúng phát thành giai
  điệu; tiếng giấy sột soạt khi kéo, tiếng chuông khi một chòm lộ ra, tiếng trầm khi sai.
- **Nhạc nền:** cũng tự tổng hợp — 4 hợp âm chậm (Cmaj7 → Am7 → Fmaj7 → G, mỗi hợp âm 8 s, hai giọng hơi lệch
  nhau cho mềm) và các nốt ngũ cung cao ngẫu nhiên có tiếng vang như sao lấp lánh. Bắt đầu sau lần chạm đầu tiên
  (quy định trình duyệt), tự dừng khi chuyển tab. Nút ♪ tắt/bật nhạc nền, nút loa tắt toàn bộ âm thanh; cả hai lưu lại.
- **Không chữ trong cảnh chơi**; chữ chỉ có ở thẻ trợ giúp, thẻ gợi ý và giao diện (cần bản tiếng Anh trước khi phát hành quốc tế).

### 2.4 Câu chuyện (kể bằng hình)
Một đêm, các chòm sao rơi khỏi bầu trời và lẩn vào đồ vật: sau mây, dưới mặt hồ, trong mực đỏ, trên nhãn dán trần
phòng, sau cốc nước… Chú cú giữ sao lần theo từng nơi. Mỗi màn giải xong, một vì sao trên bản đồ sáng lại và nối
với vì sao trước. Thắp đủ thì cả bầu trời trở lại (cảnh kết: dự kiến).

---

## 3. Gameplay

### 3.1 Vòng lặp cốt lõi
```
Vào cảnh → tự quan sát, thử → tìm mẹo (kéo, xoay, bấm, nhìn)
  → chòm sao ẩn lộ ra cùng dấu thứ tự → bấm chuỗi chòm sao trên bàn phím 3×3
  → đúng: giai điệu + vì sao trên bản đồ sáng lên → màn tiếp theo
```

### 3.2 Các động từ tương tác
| Động từ | Ví dụ trong game |
|---|---|
| Kéo | mây, tấm kính đỏ, nến, mặt trời, vòng sáng đèn bàn, bình nước, dải giấy, chú cú trên đường ray |
| Bấm | xoay đèn lồng, gấp nếp bản đồ, lật tấm kính, trượt mảnh trời, công tắc đèn |
| Xoay / chỉnh | vòng tiêu cự kính viễn vọng |
| Nhìn | đọc bóng nước, chấm sáng, chòm sao sáng lên — luôn là bước cuối của mẹo |

Mỗi động từ có icon riêng, dùng chung cho thẻ trợ giúp và huy hiệu gợi ý.

### 3.3 Đáp án: bàn phím chòm sao
- 9 chòm sao xếp 3×3; mỗi phím một nốt nhạc. Đáp án mỗi màn là **3–4 chòm theo đúng thứ tự**.
- **Quy tắc thứ tự** (không được giải thích trước: người chơi tự nhận ra qua các dấu trăng, thứ tự xuất hiện…):
  - **Trái → phải** như trên bầu trời (màn không có trăng đánh dấu).
  - **Pha trăng**: khuyết → nửa → gần tròn → tròn, vẽ cạnh mỗi chòm.
  - **Thứ tự xuất hiện** theo thời gian (màn Hoàng hôn).
- Thứ tự cố ý khác với thứ tự người chơi tìm thấy các chòm.

### 3.4 Chống đoán mò
- 3 chòm có thứ tự = 9³ = 729 khả năng, 4 chòm = 6 561.
- Trả lời sai: bàn phím khoá 1,5 s → 3 s → 6 s → 12 s → tối đa 15 s; số lần sai được lưu, tải lại trang không xoá.
- **Không lộ đáp án trước khi làm mẹo:** chòm sao bị che, nguỵ trang cùng màu, phân mảnh, lật gương, ép dẹt, làm nhoè…
- **Bẫy:** chòm giả không có trăng, trăng lẻ không có chòm, đường kẻ rối, sao mờ tràn ra khi làm quá tay.

### 3.5 Gợi ý: đom đóm
- Mỗi màn giấu 2 con đom đóm ở chi tiết phụ; bắt được thì cộng vào túi chung, mỗi con đổi 1 gợi ý.
- **Tối đa 3 gợi ý mỗi màn; mỗi gợi ý chỉ giúp một phần** (một chòm, một mặt đèn, một tấm kính…), không bao giờ
  lộ cả lời giải.
- **Gợi ý là một thẻ có hình minh hoạ**, không vẽ đè lên cảnh đang chơi: ảnh thu nhỏ của cảnh lúc đó, khoanh đỏ vật
  cần làm, huy hiệu thao tác (kéo/bấm/xoay/nhìn), mũi tên tới chỗ cần kéo, dấu đích (khung vàng, vạch đỏ trên thước,
  nét nối chòm sao, số ô đúng của mảnh), kèm một câu hướng dẫn.
- Bấm Gợi ý lần đầu thì mua gợi ý 1 và mở thẻ; bấm lại thì chỉ mở lại thẻ (không tốn đom đóm). Nút "Gợi ý tiếp" trên
  thẻ mua phần kế tiếp.
- Không tốn đom đóm nếu gợi ý không có gì mới để chỉ.
- Lưới an toàn: chưa dùng gợi ý nào sau 3 phút thì gợi ý đầu được tặng miễn phí; nút Gợi ý nhấp nháy để báo,
  người chơi tự bấm khi muốn xem (không bật thẻ lên giữa lúc đang chơi).

### 3.6 Trợ giúp
Không có bảng hướng dẫn riêng từng màn: người chơi **tự mò** để tìm ra mẹo, vì giải thích chi tiết làm màn quá dễ.
Nút **?** chỉ mở một thẻ chung cho mọi màn, nói về *cách điều khiển*, không nói *cách giải*: kéo/bấm/xoay vật thể,
quan sát và thử, đom đóm và nút Gợi ý (tối đa 3 lần mỗi màn), chọn chòm sao trên bàn phím theo thứ tự, nút nhạc nền,
nút tắt tiếng. Thẻ không tự mở. Muốn có thêm gợi ý thì dùng thẻ gợi ý (3.5).

### 3.7 Nguyên tắc thiết kế màn
- Một cảnh, **một mẹo**, vài thao tác; khoảnh khắc "à ra thế" là trọng tâm.
- Mỗi màn mới phải có mẹo **chưa dùng** ở màn trước (xem bảng 4.2).
- Độ khó tăng dần: thêm thao tác, thêm bẫy, bỏ bớt nét nối, thêm chòm.
- Có phản hồi "gần đúng" (tự khớp khi thả gần, tiếng chuông khi một chòm lộ ra).
- Chơi được bằng chạm trên màn hình 360 px và bằng bàn phím; không dùng màu làm manh mối duy nhất.
- **Cảm ứng:** vùng cảnh tắt cuộn/zoom trang (`touch-action: none`) để kéo thả không làm trang trượt; vì vậy bố cục
  phải để bàn phím và các nút nằm ngoài cảnh, cuộn tới được. Màn dọc: cảnh trên, bàn phím dưới (cuộn bằng cách vuốt ở
  bàn phím). Điện thoại nằm ngang: cảnh trái, bàn phím phải, vừa một màn hình.

---

## 4. Danh sách màn

### 4.1 Đường cong độ khó (12 màn hiện có)
| # | Màn | Mẹo | Thao tác | Chòm | Thứ tự | Bẫy / điểm khó |
|---|---|---|---|---|---|---|
| 1 | Mây đêm | Mây che sao | kéo | 3 | trái → phải | làm quen |
| 2 | Mặt hồ | Lá che trời, bóng nước phản chiếu đủ nhưng **lộn ngược** | kéo | 3 | trái → phải | phải đọc hình ngược |
| 3 | Kính lọc đỏ | Bản đồ phủ nét mực đỏ rối; chòm sao và trăng chỉ hiện dưới kính đỏ | kéo | 3 | pha trăng | không thấy gì nếu không soi |
| 4 | Đèn lồng lỗ kim | Thắp nến, xoay 4 mặt; chấm sáng trên tường **không nét, lật gương** | kéo + bấm | 4 | pha trăng | chỉ có chấm, ngược chiều |
| 5 | Gấp bản đồ sao | Sao rải ở 4 góc tờ giấy mỏng; gấp đôi hai lần thì chồng lên nhau | bấm | 3 | trái → phải | phải gấp cả hai nếp |
| 6 | Hai tấm kính | Chồng tấm sao lên tấm đường kẻ, đúng chiều; chỉ đường có sao hai đầu mới sáng | kéo + bấm | 3 | pha trăng | chòm giả, trăng lẻ |
| 7 | Bầu trời vỡ | Trượt 8 mảnh tranh trời về đúng chỗ | bấm | 3 | pha trăng | nhiều bước |
| 8 | Hoàng hôn | Hạ mặt trời: sao hiện theo từng nhóm, sáng trước mờ sau | kéo | 4 | **thứ tự xuất hiện** | chỉ chấm; tối hẳn thì sao mờ tràn ra |
| 9 | Chỉnh tiêu cự | Mọi thứ nhoè; mỗi chòm ở một độ xa, chỉ nét ở đúng một mức tiêu cự | kéo vòng | 4 | pha trăng | khoảng nét rất hẹp |
| 10 | Sao dạ quang | Nhãn dán cùng màu trần; rọi đèn nạp sáng rồi **tắt đèn** mới thấy, sao mờ dần | kéo + bấm | 4 | pha trăng | sao phai sau vài giây, trăng lẻ |
| 11 | Cốc nước | Hình bị ép dẹt và vẽ ngược; rót nước thì cốc thành thấu kính, kéo giãn và lật lại | kéo 2 vật | 4 | pha trăng | chỉ chấm, chòm giả, trăng giả |
| 12 | Điểm nhìn | Hạt sao treo 3 hàng xa gần; đổi chỗ đứng thì hàng gần trượt nhanh hơn (thị sai); khớp thì trăng hiện bên cạnh | kéo | 4 | pha trăng | pha trăng khác cả thứ tự chỗ đứng lẫn thứ tự trên trời |

### 4.2 Kiểm tra trùng lặp
Mỗi màn dựa trên một hiện tượng nhìn khác nhau:

| Màn | Hiện tượng / ý tưởng |
|---|---|
| Mây đêm | che khuất |
| Mặt hồ | phản chiếu dọc |
| Kính lọc đỏ | lọc màu |
| Đèn lồng lỗ kim | chiếu sáng qua lỗ, ảnh lật |
| Gấp bản đồ sao | gấp giấy, chồng lớp |
| Hai tấm kính | chồng hai lớp trong suốt cho khớp |
| Bầu trời vỡ | sắp xếp mảnh ghép |
| Hoàng hôn | **thời gian**: độ sáng quyết định lúc xuất hiện |
| Chỉnh tiêu cự | **độ sâu**: chỉ một lớp nét |
| Sao dạ quang | **ánh sáng lưu lại**: nạp trước, thấy sau, phai dần |
| Cốc nước | **khúc xạ**: biến dạng được sửa lại |
| Điểm nhìn | **thị sai**: căn thẳng hàng nhiều lớp |

### 4.3 Ý tưởng màn tiếp theo
| Ý tưởng | Mẹo | Ghi chú |
|---|---|---|
| Đồng hồ sao | Kéo kim giờ, bầu trời quay quanh sao Bắc Cực; chòm sao chỉ lọt khung cửa sổ ở đúng giờ | thứ tự theo giờ trên mặt đồng hồ |
| Lỗ khoá | Nhìn qua lỗ khoá, đẩy cửa hé dần, mỗi độ hé thấy một phần căn phòng | ghép thông tin từ nhiều khung nhìn |
| Sao băng | Sao băng bay qua để lại vệt nối các sao; chỉ vệt đi qua đúng sao mới thành chòm | lộ nét nối thay vì lộ sao |
| Nhiều nguồn sáng | Hai ngọn đèn, mỗi đèn đổ một nửa bóng; bật đúng tổ hợp thì bóng ghép thành chòm | khác đèn lồng: bóng từ vật đặc, nhiều nguồn |
| Gương vỡ | Mảnh gương phản chiếu bầu trời phía sau người chơi; xoay từng mảnh cho ảnh liền | phản chiếu ngang, không phải mặt nước |
| Chuông gió | Gió thổi, chuông kêu theo nhịp; số tiếng chỉ vị trí phím | cần phương án hình cho người tắt tiếng |
| Diều đêm | Kéo dây diều, đuôi diều có đèn vẽ nét trên trời | vẽ bằng chuyển động |

Mục tiêu dài hạn: 30–40 màn, chia chương theo bối cảnh (phòng ngủ, đài thiên văn, cánh đồng, mặt hồ),
mỗi chương kết thúc bằng một màn tổng hợp dùng lại các mẹo của chương đó.

---

## 5. Thiết kế kỹ thuật

### 5.1 Công nghệ
| Phần | Hiện tại | Ghi chú |
|---|---|---|
| Client | TypeScript + SVG thuần + Vite, không framework | clip-path, filter, sự kiện chuột/cảm ứng có sẵn |
| Âm thanh | WebAudio tự tổng hợp: hiệu ứng (`src/core/sound.ts`), nhạc nền (`src/core/music.ts`) | không cần file âm thanh |
| Lưu tiến trình | `localStorage` (`star-keeper/save/v1`) | màn đã giải, đom đóm, mức gợi ý, số lần sai, nhạc/tắt tiếng |
| Test | vitest cho logic thuần của từng màn; Playwright chơi thử tự động | |
| Khi có tranh vẽ tay lớn | cân nhắc PixiJS v8 | render 2D WebGL nhanh hơn với nhiều ảnh raster |

### 5.2 Cấu trúc một màn
Mỗi màn là một module trong `src/puzzles/` export một `PuzzleDef`:
- `id`, `name`, `answer` (chuỗi chòm sao theo thứ tự đọc), vị trí đom đóm.
- `mount({ scene, sound })` vẽ cảnh vào ba lớp và trả về `revealHints(n)`, `hintTargets()`, `destroy()`.
- **Gợi ý:** `revealHints(n)` bật n phần gợi ý (trả về số phần thật sự có); `hintTargets()` trả về `HintTarget`
  gồm vị trí + bán kính vòng khoanh, thao tác, `to` (chỗ cần kéo tới → mũi tên), `note` (câu hướng dẫn; thiếu thì
  dùng câu mặc định theo thao tác). `src/ui/hintPicture.ts` nhân bản SVG của cảnh, bỏ phần tương tác và đom đóm,
  rồi vẽ vòng khoanh, huy hiệu, mũi tên lên bản sao. Dấu gợi ý riêng của màn (class `ghost-mark`, `hint-tick`,
  `hint-line`, `filter-ghost`, `plate-ghost`, `number-badge`, `cell-label`) bị ẩn trong cảnh thật bằng CSS và chỉ
  hiện trên bản sao.
- Phần quyết định "chòm nào đã lộ" (che, nhoè, khớp, nạp sáng…) tách thành **hàm thuần** để viết test:
  ví dụ `batchesOut(darkness)`, `blurFor(focus, depth)`, `stepCharge(...)`, `throughWater(x)`, `alignedSpot(eye)`.
- Test bắt buộc cho mỗi màn: lúc bắt đầu không lộ chòm nào; làm đúng thì lộ đúng từng chòm; bẫy không chồng lên chòm thật.

### 5.3 Lộ trình
| Giai đoạn | Nội dung | Mục tiêu kiểm chứng |
|---|---|---|
| ✅ Prototype | 12 màn, bản đồ, bàn phím, đom đóm, thẻ trợ giúp, thẻ gợi ý có hình, nhạc nền | Vòng lặp "mẹo → chòm sao → bàn phím" có vui không? |
| Thử nghiệm người chơi | 10–20 người chơi thử, ghi chỗ kẹt và thời gian mỗi màn | Cân lại độ khó, chữ hướng dẫn |
| Mỹ thuật & bản tiếng Anh | Thay vector bằng tranh vẽ tay; dịch giao diện | Sẵn sàng cho cổng game quốc tế |
| Mở rộng nội dung | Thêm màn theo bảng 4.3, chia chương | 30–40 màn, 1,5–3 giờ chơi |
| Phát hành | Bản web (itch.io, Poki/CrazyGames) → cân nhắc Steam | Lượt chơi, tỉ lệ chơi hết |

---

## 6. Nhật ký cập nhật
Xem [CHANGELOG.md](CHANGELOG.md). Mỗi thay đổi về màn chơi, gợi ý, âm thanh hay giao diện đều ghi vào đó và cập nhật
các mục liên quan trong tài liệu này.

---

## 7. Tham khảo
- [Steam — HER TREES : PUZZLE DREAM](https://store.steampowered.com/app/3300800/HER_TREES__PUZZLE_DREAM/)
- [Thinky Games — bài giới thiệu](https://thinkygames.com/features/her-trees-puzzle-dream-is-an-abstract-point-and-click-puzzle-game-with-a-goth-girl-aesthetic/)
- [9Puz — walkthrough (cơ chế lưới chữ A–I)](https://9puz.com/3753-her-trees-puzzle-dream-walkthrough/)
- [Metacritic](https://www.metacritic.com/game/her-trees-puzzle-dream/)
