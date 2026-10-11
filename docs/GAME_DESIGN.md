# THE STAR KEEPER (Người giữ sao) — Tài liệu thiết kế

> **Hướng đi hiện tại (thay thế các bản trước):** giữ cơ chế thể loại của HER TREES — mỗi màn là một cảnh nhỏ
> với một mẹo nhìn; làm đúng thì ký hiệu ẩn hiện ra; nhập chuỗi ký hiệu vào bàn phím 3×3 — nhưng với chủ đề khác hẳn.

## Khác biệt với HER TREES
| | HER TREES : PUZZLE DREAM | The Star Keeper |
|---|---|---|
| Chủ đề | Giấc mơ, cây, cô gái | Bầu trời đêm, đài thiên văn, chú cú giữ sao |
| Mỹ thuật | Đen trắng vẽ tay | Nền xanh đêm, sao vàng, nét mảnh |
| Ký hiệu | Chữ cái A–I, lưới 3×3 | 9 chòm sao (tam giác, hình vuông, vương miện, thập tự, thắt lưng, cái gáo, kim cương, mũi tên, lưỡi câu) |
| Thứ tự | theo cảnh | trái → phải, hoặc theo pha trăng |
| Gợi ý | chờ thời gian | đom đóm, mỗi gợi ý giúp một phần, tối đa 3 |
| Tiến trình | cây nở hoa | thắp lại các vì sao trên bản đồ bầu trời |

## Nguyên tắc thiết kế màn
- Một cảnh, **một mẹo**, vài thao tác; khoảnh khắc "à ra thế" là trọng tâm.
- Không thể đọc đáp án khi chưa làm mẹo (che, nguỵ trang, phân mảnh, lật gương, chòm giả…).
- Đáp án 3–4 chòm sao; thứ tự phải suy ra được từ cảnh.

## 7 màn hiện có
1. **Mây đêm** — kéo mây (hướng dẫn).
2. **Mặt hồ** — lá che trời, đọc bóng nước lộn ngược.
3. **Kính lọc đỏ** — giải mã: mực đỏ biến mất dưới kính đỏ.
4. **Đèn lồng lỗ kim** — thắp nến, xoay 4 mặt; chấm sáng không nét, lật gương; thứ tự theo pha trăng.
5. **Gấp bản đồ sao** — gấp đôi hai lần cho sao chồng nhau.
6. **Hai tấm kính** — chồng tấm sao lên tấm đường kẻ (có chòm giả); chỉ đường có sao hai đầu mới sáng.
7. **Bầu trời vỡ** — trượt 8 mảnh.

## Ý tưởng màn tiếp theo
Kính viễn vọng (chỉnh tiêu cự), đồng hồ sao (kéo giờ để sao quay quanh sao Bắc Cực), bóng đổ nhiều nguồn sáng,
nhìn qua lỗ khoá, dây diều nối sao, gương vỡ ghép lại, tiếng chuông gió đếm nhịp.

---

# (Lưu trữ) Các thiết kế trước

# PAPER SHADOWS (Giải đố Giấy & Bóng) — Tài liệu thiết kế game

> **Cập nhật hướng đi:** game chuyển từ "một chủ đề 12 con giáp" sang **tuyển tập câu đố nhiều chủ đề**,
> giữ chung khung nhận diện (giấy cắt, ánh sáng, bóng, chất liệu Việt). Các màn được nhóm thành chương theo cơ chế;
> phần lớn màn tự hoàn thành khi xếp đúng, chỉ một số màn "mật mã" dùng vòng con giáp. Con giáp trở thành một lớp
> ý nghĩa/bộ sưu tập, không còn là chủ đề bao trùm. Phần dưới đây là thiết kế gốc, giữ lại để tham khảo.

### Cấu trúc chương hiện tại
| Chương | Màn | Kết thúc |
|---|---|---|
| Ánh sáng & Bóng | Đèn ông sao · Gương đồng · Bóng sân chiều · Ao rối nước | mật mã · tự hoàn thành · mật mã · tự hoàn thành |
| Ghép đồ vật | Mâm trà ngày Tết · Gác xép Trung Thu | tự hoàn thành |
| Xoay, chồng & nối | Mương nước ruộng bậc thang · Xưởng in tranh Đông Hồ · Nền gạch bông | tự hoàn thành |

Các nhóm cơ chế dự kiến thêm: logic không chữ (cân đĩa, khoá gỗ), quan sát (tìm điểm khác, vật giấu), âm thanh/nhịp (trống, chuông).

---

# Thiết kế gốc: MƯỜI HAI BÓNG GIẤY

> Web game giải đố point-and-click, lấy cảm hứng *thể loại* từ HER TREES : PUZZLE DREAM
> nhưng khác biệt hoàn toàn về chủ đề, mỹ thuật, cách nhập đáp án và hệ thống gợi ý.

---

## 1. Phân tích HER TREES : PUZZLE DREAM

### 1.1 Tóm tắt
- Nhà phát triển indie "Stone", phần thứ 3 của series, ra mắt 10/02/2026 trên Steam (PC), giá ~3.99 USD.
- Hơn 40 câu đố, chơi khoảng 1,5–3 giờ. Đánh giá Steam: Overwhelmingly Positive (~97%).

### 1.2 Vòng lặp chơi cốt lõi
1. Người chơi vào một cảnh mơ (dream scene) vẽ tay.
2. Click, kéo, xoay, kết hợp các vật thể trong cảnh (cành cây, cánh hoa...).
3. Khi sắp xếp đúng, **các chữ cái ẩn lộ ra** (ví dụ cành cây cuộn quanh chữ, cánh hoa xếp thành chữ).
4. Nhập các chữ tìm được vào **lưới 3×3 (A–I)** bên cạnh màn hình → mở câu đố tiếp theo.

### 1.3 Vì sao game thành công
| Yếu tố | Tác dụng |
|---|---|
| Mỹ thuật đen trắng vẽ tay, phong cách "goth girl", siêu thực | Nhận diện mạnh, rẻ để sản xuất, dễ viral qua ảnh chụp |
| Không có lời thoại / chữ | Không cần bản địa hóa, chơi được toàn cầu |
| Câu đố ngắn, mỗi cảnh một ý tưởng | Phù hợp phiên chơi ngắn, cảm giác "aha" liên tục |
| Gợi ý/lời giải mở khóa sau thời gian chờ | Không bị kẹt vĩnh viễn nhưng vẫn khuyến khích tự nghĩ |
| Giá rẻ, thời lượng ngắn | Rào cản mua thấp, tỉ lệ chơi hết cao → review tốt |

### 1.4 Điểm yếu có thể khai thác
- Chữ cái tìm được **không mang ý nghĩa** (không ghép thành từ) → đáp án thiếu chiều sâu, thiếu "meta".
- Gợi ý theo kiểu **chờ thời gian** → thụ động, không thưởng cho sự tò mò.
- Một số câu đố mơ hồ, người chơi kẹt vì không biết vật nào tương tác được.
- Chỉ có trên PC, không có bản web/mobile chơi ngay.
- Không có cốt truyện/tiến trình rõ ràng nối các câu đố với nhau.

### 1.5 Những thứ KHÔNG được sao chép
Cơ chế thể loại (point-and-click giải đố) không thuộc bản quyền riêng ai, nhưng *biểu hiện cụ thể* thì có.
Để an toàn pháp lý và tạo bản sắc riêng, game này **tránh**:
- Tên, chữ "Her Trees", chủ đề cây/giấc mơ, nhân vật cô gái goth.
- Mỹ thuật đen trắng vẽ tay kiểu bút chì/mực đen.
- Cơ chế đáp án **chữ cái + lưới 3×3**.
- Bất kỳ câu đố cụ thể nào (cành cây cuộn chữ, cánh hoa xếp chữ...).
- Gợi ý chờ đếm ngược làm cơ chế chính.

---

## 2. Ý tưởng game mới: MƯỜI HAI BÓNG GIẤY

### 2.1 Pitch một câu
> Một đứa trẻ khôi phục chiếc **đèn kéo quân** của người ông thợ làm đèn, bằng cách xoay, gấp,
> chiếu sáng những diorama bằng giấy dó để tìm lại **12 con giáp** đã thất lạc trong bóng tối.

### 2.2 Bảng so sánh khác biệt

| | HER TREES : PUZZLE DREAM | MƯỜI HAI BÓNG GIẤY |
|---|---|---|
| Chủ đề | Giấc mơ, cây cối | Ký ức gia đình, nghề làm đèn lồng, mùa lễ hội Việt |
| Mỹ thuật | Đen trắng, vẽ tay 2D phẳng | Giấy dó màu kem + mực nho + 1 màu điểm (đỏ son), **nhiều lớp giấy 2.5D có parallax** |
| Cơ chế chính | Sắp xếp vật thể để lộ chữ | **Ánh sáng & bóng chiếu**: xoay/gấp/trượt lớp giấy để ánh đèn chiếu ra hình con giáp |
| Nhập đáp án | Chữ cái vào lưới 3×3 | Chọn **chuỗi con giáp trên vòng đèn kéo quân** (vòng tròn 12 ô) |
| Ý nghĩa đáp án | Chữ vô nghĩa | 12 con giáp đồng thời là **12 giờ** và **12 hướng** → tạo tầng meta-puzzle |
| Gợi ý | Chờ thời gian | **Đom đóm** thu được nhờ khám phá chi tiết ẩn → đổi lấy gợi ý 3 cấp |
| Tiến trình | Chuỗi câu đố rời | 4 chương theo mùa lễ hội, mỗi chương kết thúc bằng 1 meta-puzzle ráp đèn |
| Nền tảng | PC (Steam) | Web (desktop + mobile cảm ứng), có thể đóng gói Steam sau |

### 2.3 Mỹ thuật & âm thanh
- **Bảng màu**: giấy dó kem `#EFE6D2`, mực nho `#2B2622`, đỏ son `#B7372A`, ánh đèn vàng ấm `#F4C66A`.
  Ánh sáng là thứ duy nhất "rực" trong cảnh → mắt người chơi tự bị dẫn tới chỗ quan trọng.
- **Cảnh = diorama giấy cắt nhiều lớp** (3–6 lớp). Rê chuột/nghiêng điện thoại tạo parallax nhẹ, cảm giác như hộp giấy thủ công.
- Cảm hứng: tranh Đông Hồ, đèn ông sao, đèn kéo quân, múa rối nước, quạt giấy — dùng *mô-típ dân gian* (không thuộc bản quyền), tự vẽ lại.
- **Âm thanh**: tiếng giấy sột soạt, tiếng mõ gỗ, đàn bầu/sáo trúc tối giản. Mỗi con giáp có một nốt riêng; khi chọn đúng chuỗi đáp án sẽ phát thành một giai điệu ngắn.
- **Không lời thoại, không chữ** trong gameplay (giống thể loại, giữ lợi thế không cần dịch).

### 2.4 Cốt truyện (kể bằng hình, không chữ)
Người ông làm đèn đã mất; chiếc đèn kéo quân của ông nằm trên gác xép, các hình con giáp bên trong đã rơi rụng.
Mỗi khi đứa cháu thắp đèn, ánh sáng đưa em vào một diorama ký ức (Tết, Rằm tháng Giêng, mùa nước, Trung Thu).
Tìm lại đủ 12 con giáp → chiếc đèn quay trở lại, cảnh cuối là đêm Trung Thu cả xóm rước đèn.

---

## 3. Gameplay chi tiết

### 3.1 Vòng lặp cốt lõi
```
Vào diorama → Quan sát (parallax, rọi đèn) → Tương tác (xoay/gấp/trượt/kéo nguồn sáng)
  → Bóng chiếu/phản chiếu lộ ra hình con giáp → Chọn chuỗi con giáp trên vòng đèn
  → Đúng: giai điệu + 1 tấm hình gắn vào đèn kéo quân → diorama tiếp theo
```

### 3.2 Các "động từ" tương tác
| Động từ | Mô tả | Thao tác |
|---|---|---|
| Xoay | Xoay vật thể/lớp giấy quanh tâm | Kéo vòng tròn / 2 ngón tay |
| Trượt lớp | Dịch lớp giấy trước/sau để chồng hình | Kéo ngang/dọc |
| Gấp | Gấp giấy/quạt theo nếp có sẵn, hình in ở 2 mặt ghép lại | Kéo mép giấy |
| Nguồn sáng | Di chuyển ngọn nến/mặt trăng → bóng đổ thay đổi | Kéo nguồn sáng |
| Thời gian | Thanh trượt giờ trong ngày → hướng & độ dài bóng nắng | Kéo thanh/xoay mặt trời |
| Nước | Mặt nước phản chiếu ngược; khuấy làm sóng tan/lặng | Click/kéo trên mặt nước |
| Mực loang | Nhỏ mực lên giấy dó, nghiêng giấy để mực chạy theo thớ | Nghiêng (kéo/gyro) |
| Âm thanh | Gõ mõ/chuông gió, đếm số tiếng hoặc nghe cao độ | Click |

Mỗi chương giới thiệu 1–2 động từ mới, rồi kết hợp chúng ở các câu đố cuối chương.

### 3.3 Hệ thống đáp án: Vòng đèn kéo quân
- UI là một vòng tròn 12 ô con giáp (Tý ở đỉnh, theo chiều kim đồng hồ: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi).
- Đáp án mỗi câu đố là **chuỗi 1–5 con giáp có thứ tự** (thứ tự lấy từ trái→phải, theo thứ tự xuất hiện, hoặc theo số tiếng mõ...).
- **Tầng meta**: vì vòng 12 con giáp cũng là **mặt đồng hồ giờ âm** (giờ Tý = 23h–1h, giờ Ngọ = 11h–13h...)
  và **la bàn** (Tý = Bắc, Ngọ = Nam, Mão = Đông, Dậu = Tây), các chương sau có câu đố mà đáp án không hiện ra dưới
  dạng hình con vật mà dưới dạng *giờ* hoặc *hướng*. Người chơi tự phát hiện ra quy luật này → khoảnh khắc "aha" lớn
  mà HER TREES không có.

### 3.3b Chống đoán mò
- Mỗi câu đố cần **2–3 con giáp theo đúng thứ tự** (3 con = 12³ = 1728 khả năng, không thể thử từng con).
- Thứ tự được đánh dấu bằng **dấu hình thoi ◆** (1, 2, 3 dấu), chỉ hiện ra khi một phần của câu đố đã giải xong.
  Thứ tự này cố ý khác với thứ tự trái → phải trên màn hình và thứ tự người chơi gặp chúng.
- Mỗi câu có nhiều bước phụ thuộc nhau (vòng giấy ăn khớp, phải sắp lại tấm giấy trước khi kéo nến, ghép đúng cặp con rối).
- Trả lời sai: vòng đáp án nghỉ 1,5s → 3s → 6s → 12s → tối đa 15s, số lần sai được lưu lại.

### 3.3c Ghép đồ vật (kéo thả tự do)
- Đồ vật quen thuộc nằm rải rác; kéo thả tự do khắp mặt bàn, chạm để xoay 45° (từ màn 5).
- **Nguyên tắc chọn đồ vật:** hình dáng mỗi món trùng với một bộ phận đặc trưng của con vật,
  để khi ghép xong nhìn ra ngay con gì (không cần hình gợi ý phía sau):

| Con | Đồ vật → bộ phận |
|---|---|
| Chuột | củ khoai lang → thân (đầu nhọn là mõm) · đồng xu → tai tròn · sợi lạt → đuôi dài |
| Gà | bầu hồ lô nghiêng → thân + đầu (cuống là mỏ) · chùm ớt → mào · quạt giấy → đuôi xoè · đôi đũa → chân |
| Lợn | bánh bao hồng → thân tròn · cúc áo 2 lỗ → mõm · nón lá nhỏ → tai |
| Trâu | ghế băng gỗ → thân + 4 chân · gáo dừa → đầu · lưỡi liềm → cặp sừng · bút lông → đuôi có túm |
| Rồng | dải lụa đỏ → thân uốn lượn · lược gỗ → gai lưng · cây kéo mở → hàm (vòng cầm là mắt) · quạt → vây đuôi |
| Mèo | lọ gốm → thân ngồi · bánh nướng → đầu · ná cao su → hai tai · dây thừng → đuôi cong |

- Mỗi món có lớp sâu (sau / thân / trước) nên chân, đuôi, tai tự nằm sau thân, đầu và mõm nằm trước.
  Mỗi món có bóng đổ; ghép xong, bóng chung thành dáng con vật.
- Hai món cùng một con giáp, đặt đúng vị trí tương đối và đúng hướng, sẽ "cạch" dính vào nhau.
- Ghép đủ thì cả nhóm sáng lên và hiện dấu ◆ thứ tự. Có món thừa không thuộc nhóm nào.

### 3.3d Đường cong độ khó (prototype)
| # | Màn | Cơ chế | Số con | Điểm khó |
|---|---|---|---|---|
| 1 | Đèn ông sao | xoay vòng ăn khớp, lật đĩa | 2 | làm quen |
| 2 | Mâm trà ngày Tết | ghép đồ vật, chỉ kéo | 3 | 10 món, 1 món thừa |
| 3 | Bóng sân chiều | sắp lại giấy cắt + kéo nến | 3 | 4 tấm (24 cách xếp), 3 vị trí nến |
| 4 | Ao rối nước | ghép nửa hình qua bóng nước | 3 | 8 con rối, 2 con thừa, có con quay ngược |
| 5 | Gác xép Trung Thu | ghép đồ vật + xoay 45° | 3 | 15 món, 3 món thừa, hầu hết bị xoay sai |
| 6 | Xưởng in tranh Đông Hồ | chồng lớp trong suốt + xoay 90° | 3 | 10 tấm phim, mỗi tấm 1 màu dạng sọc; phải chồng khít đủ màu; 2 tấm thừa |
| 7 | Nền gạch bông | đổi chỗ + xoay ô gạch | 3 | 14 viên, mỗi viên ¼ hình; ghép 3 ô 2×2 đúng chiều; 2 viên thừa |

**Tham khảo HER TREES nhưng không sao chép:** HER TREES dùng thao tác kéo, chồng, xoay vật để làm lộ chữ cái.
Ở đây giữ tinh thần "chồng lớp / xoay cho khớp" nhưng thay bằng chất liệu Việt (in khắc gỗ Đông Hồ từng màu,
gạch bông xi măng) và đáp án là con giáp + thứ tự ◆, không dùng chữ cái hay lưới 3×3.

### 3.4 Hệ thống gợi ý: Đom đóm
- Mỗi cảnh giấu đom đóm ở chi tiết phụ. Tìm thấy = thưởng sự tò mò; mỗi con đổi 1 gợi ý, tối đa 3 gợi ý mỗi màn.
- **Mỗi gợi ý chỉ giúp một phần còn sai, không bao giờ lộ cả lời giải.** Gợi ý khoanh đúng chỗ cần làm và hiện icon thao tác.

| Màn | Một gợi ý cho biết |
|---|---|
| Đèn ông sao | vị trí đúng của 1 vòng giấy (dấu vàng chỗ khấc đỏ cần chỉ tới); vòng ngoài trước |
| Mâm trà / Gác xép | toàn bộ các món của 1 con vật chưa ghép xong, nối bằng chỉ cùng màu (mỗi con một màu); báo món nào cần xoay |
| Bóng sân chiều | chỗ đúng (số 1–4 trên dây) của 1 tấm giấy sai chỗ; giấy đúng hết thì 1 chỗ đặt nến chưa tìm ra |
| Ao rối nước | 1 cặp con rối của một con giáp chưa ghép, ◀ ▶ chỉ con nào đứng trái/phải; báo con nào bị quay ngược |

- Lưới an toàn: chưa dùng gợi ý nào sau 3 phút thì gợi ý đầu tự mở miễn phí.

### 3.5 Cấu trúc nội dung (~36 câu đố + 4 meta)
| Chương | Mùa / bối cảnh | Động từ chính | Số câu đố | Meta-puzzle cuối chương |
|---|---|---|---|---|
| 1. Đèn ông sao | Tết, sân nhà | Xoay, Nguồn sáng | 8 | Gắn 3 con giáp đầu vào đèn, xoay đèn cho bóng ghép thành cảnh Tết |
| 2. Mùa nước | Ao làng, múa rối nước | Nước/phản chiếu, Trượt lớp | 9 | Câu đố dùng *hướng* (la bàn) lần đầu |
| 3. Giấy dó | Xưởng làm giấy & quạt | Gấp, Mực loang | 9 | Câu đố dùng *giờ* (đồng hồ bóng nắng) |
| 4. Rằm tháng Tám | Đêm Trung Thu, rước đèn | Âm thanh + kết hợp tất cả | 10 | Đèn kéo quân hoàn chỉnh, đáp án là giai điệu 12 nốt |

Thời lượng mục tiêu: 2–3 giờ (tương đương đối thủ), giá đề xuất 2.99–4.99 USD, chương 1 chơi miễn phí trên web.

### 3.6 Ví dụ câu đố cụ thể
1. **Ngôi sao năm cánh** (Ch.1, hướng dẫn) — Xoay 5 cánh đèn ông sao. Khi các lỗ đục trên cánh thẳng hàng với khung cửa sổ, bóng trên tường hiện con chuột. Đáp án: `Tý`.
2. **Bóng sân chiều** (Ch.1) — Kéo ngọn nến quanh 3 chum nước. Ở đúng một vị trí, bóng 3 chum chồng lại thành con trâu; dịch tiếp sẽ thấy con hổ. Đáp án theo thứ tự trái→phải: `Sửu, Dần`.
3. **Ao rối** (Ch.2) — Trượt 3 con rối trên mặt ao. Hình con rối vô nghĩa khi nhìn thẳng, nhưng **phản chiếu ngược** dưới nước thành rồng và rắn. Phải khuấy nước cho lặng sóng mới đọc được. Đáp án: `Thìn, Tỵ`.
4. **Cây kim nam châm** (Ch.2, giới thiệu la bàn) — Không có con vật nào hiện ra; chỉ có con thuyền giấy trôi rồi dừng, mũi thuyền chỉ hướng Tây. Đáp án: `Dậu` (Tây trên la bàn 12 chi).
5. **Quạt gấp** (Ch.3) — Quạt 6 nan in nửa hình ở mặt trước và mặt sau. Gấp đúng các nan để nửa hình ghép thành ngựa, dê, khỉ. Thứ tự gấp = thứ tự đáp án. Đáp án: `Ngọ, Mùi, Thân`.
6. **Đồng hồ nắng** (Ch.3, giới thiệu giờ) — Kéo mặt trời qua bầu trời; bóng của cột đình chỉ vào một vết mực trên sân. Thời điểm đó là ~17h–19h. Đáp án: `Dậu` (giờ Dậu).
7. **Chuông gió** (Ch.4) — 3 chuông gió kêu lần lượt 11, 9, 12 tiếng. Đếm vị trí trên vòng con giáp. Đáp án: `Tuất, Thân, Hợi`.

---

## 4. Thiết kế kỹ thuật (web)

### 4.1 Công nghệ đề xuất
| Phần | Đề xuất | Lý do |
|---|---|---|
| Client (prototype hiện tại) | TypeScript + **SVG thuần** + Vite, không framework | Mỹ thuật hiện là vector vẽ bằng code; SVG cho clip-path, filter, sự kiện chuột/cảm ứng sẵn, không cần WebGL |
| Client (khi có nhiều ảnh raster) | Cân nhắc chuyển renderer sang **PixiJS v8** | Render 2D WebGL nhanh khi cảnh có nhiều sprite/ảnh vẽ tay lớn |
| Âm thanh | Howler.js | Ổn định trên mobile Safari |
| Dữ liệu câu đố | File JSON theo schema (mục 4.3) | Thêm câu đố không cần sửa code; dễ làm level editor |
| Server (tùy chọn) | Spring Boot hiện có: REST API lưu tiến trình, thống kê câu đố bị kẹt nhiều | Dữ liệu analytics giúp cân bằng độ khó |
| Lưu tiến trình offline | `localStorage` (bọc try/catch) + đồng bộ server khi có tài khoản | Chơi được không cần đăng nhập |

### 4.2 Cách làm bóng chiếu đơn giản
Không cần raycasting vật lý thật. Mỗi câu đố là một **máy trạng thái**:
- Mỗi vật thể có các thuộc tính rời rạc hoặc liên tục (góc xoay, vị trí, đã gấp hay chưa).
- Điều kiện thắng = tất cả thuộc tính nằm trong ngưỡng sai số (ví dụ góc ±6°).
- Khi đạt điều kiện, **fade-in hình bóng vẽ sẵn** (prebaked) + hiệu ứng ánh sáng. Khi gần đạt, hiện bóng mờ một phần để người chơi biết đang đi đúng hướng.
- Bóng "thật" (đổ theo nguồn sáng) chỉ dùng cho vài cảnh đặc biệt, có thể làm bằng sprite bóng biến dạng (skew/scale) theo vị trí nến.

### 4.3 Ví dụ schema câu đố

> Prototype hiện viết mỗi câu đố là một module TypeScript trong `src/puzzles/` (mỗi câu có cơ chế riêng).
> Schema JSON dưới đây là hướng đi khi làm level editor cho các câu đố cùng kiểu.

```json
{
  "id": "ch1_star_lantern",
  "chapter": 1,
  "layers": [
    { "id": "wall",   "sprite": "ch1/wall.png",   "depth": 0 },
    { "id": "window", "sprite": "ch1/window.png", "depth": 1 },
    { "id": "star",   "sprite": "ch1/star.png",   "depth": 3 }
  ],
  "interactables": [
    { "id": "petal_1", "verb": "rotate", "parent": "star", "steps": 8, "initial": 3 },
    { "id": "petal_2", "verb": "rotate", "parent": "star", "steps": 8, "initial": 6 }
  ],
  "solution": {
    "state": { "petal_1": 0, "petal_2": 0 },
    "reveal": { "sprite": "ch1/shadow_rat.png", "layer": "wall" },
    "answer": ["ty"]
  },
  "fireflies": [ { "id": "ff1", "layer": "window", "x": 412, "y": 88 } ],
  "hints": ["highlight:petal_1,petal_2", "verb:rotate", "ghost:solution"]
}
```

### 4.4 Lộ trình phát triển
| Giai đoạn | Nội dung | Mục tiêu kiểm chứng |
|---|---|---|
| 0. Prototype (2–3 tuần) | Engine cảnh nhiều lớp, 1 động từ (xoay), vòng đáp án, 3 câu đố xám (greybox) | Cơ chế "bóng chiếu → chọn con giáp" có vui không? |
| 1. Vertical slice (4–6 tuần) | Chương 1 đầy đủ mỹ thuật + âm thanh + đom đóm | Cho 10–20 người chơi thử, đo chỗ kẹt |
| 2. Sản xuất (2–3 tháng) | Chương 2–4, meta-puzzle, level editor nội bộ | Nội dung hoàn chỉnh |
| 3. Phát hành | Demo chương 1 trên web/itch.io, bản đầy đủ trên web + Steam | Wishlist/feedback |

### 4.5 Nguyên tắc thiết kế câu đố
- Mỗi câu đố chỉ có **một ý tưởng mới**; câu đố kết hợp chỉ ở cuối chương.
- Luôn có **phản hồi "gần đúng"** (bóng hiện mờ, âm thanh cao dần) để giảm đoán mò.
- Vật tương tác được phải có dấu hiệu thị giác nhất quán (ví dụ viền chỉ đỏ son mảnh).
- Kiểm tra mọi câu đố trên màn hình điện thoại 360px và thao tác chỉ bằng chạm.
- Không dựa vào màu sắc làm manh mối duy nhất (hỗ trợ người mù màu).

---

## 5. Tham khảo
- [Steam — HER TREES : PUZZLE DREAM](https://store.steampowered.com/app/3300800/HER_TREES__PUZZLE_DREAM/)
- [Thinky Games — bài giới thiệu](https://thinkygames.com/features/her-trees-puzzle-dream-is-an-abstract-point-and-click-puzzle-game-with-a-goth-girl-aesthetic/)
- [9Puz — walkthrough (cơ chế lưới chữ A–I)](https://9puz.com/3753-her-trees-puzzle-dream-walkthrough/)
- [Metacritic](https://www.metacritic.com/game/her-trees-puzzle-dream/)
