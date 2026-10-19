# CLAUDE.md — The Star Keeper (Người giữ sao)

Hướng dẫn cho mọi phiên làm việc trên repo này. Đọc hết trước khi thiết kế hoặc sửa màn chơi. Các quy tắc dưới đây
được người dùng chốt qua nhiều vòng góp ý; đừng làm ngược lại khi chưa hỏi.

## Làm việc với người dùng
- **Trả lời bằng tiếng Việt.** Chữ trong game có **hai ngôn ngữ** (từ 2026-10-19, CrazyGames bắt buộc tiếng Anh): mọi chữ
  viết dạng `tr('tiếng Việt', 'English')` (`src/core/i18n.ts`), kể cả aria-label và ghi chú gợi ý. Chữ ở cấp module
  (tên màn, `help`, tên chòm, tên chương…) phải là getter hoặc hàm, vì ngôn ngữ chỉ biết sau khi khởi động. Ngôn ngữ:
  lựa chọn đã lưu (nút "English / Tiếng Việt" trên bản đồ) → locale của SDK/trình duyệt → tiếng Anh. Tên màn tiếng Anh
  giữ ngắn cỡ bản tiếng Việt để nhãn trên bản đồ không chồng nhau.
- **Nhánh chính là `main`** (các nhánh cũ như `claude/magical-euler-omnccd`, `claude/chapter-2` đã gộp vào). Luôn bắt
  đầu từ `main` mới nhất (`git fetch origin main`), không dựa trên nhánh cũ. Không tạo PR nếu chưa được yêu cầu.
- Bản chơi online là artifact https://claude.ai/artifact/Nj2J2s1QVahb1yeYaB4sqX. Sau mỗi thay đổi: build, đóng gói,
  cập nhật đúng artifact này (giữ nguyên URL), xem mục "Phát hành".
- **Mỗi thay đổi phải cập nhật tài liệu trong cùng commit:** `README.md`, `docs/GAME_DESIGN.md` (mục liên quan) và
  `docs/CHANGELOG.md` (mục mới nhất ở trên, theo ngày).
- Nếu người dùng nói "khoan/dừng commit" mà lệnh đã chạy xong, nói thẳng và hoàn lại bằng `git revert` (không viết lại
  lịch sử).
- Khi yêu cầu mơ hồ, chọn cách hiểu ít phá huỷ nhất, làm, rồi nói rõ cách hiểu và phương án khác.

## Ý tưởng game
- Lấy cơ chế *thể loại* của HER TREES : PUZZLE DREAM (cảnh nhỏ → làm đúng mẹo thì ký hiệu ẩn lộ ra → nhập chuỗi ký hiệu
  trên bàn phím 3×3), **không sao chép**: không chữ cái A–I, không chủ đề cây/giấc mơ, không câu đố cụ thể nào của họ.
- Chủ đề: bầu trời đêm, chú cú giữ sao. Ký hiệu là **9 chòm sao** (`src/core/glyphs.ts`): tam giác, hình vuông, vương
  miện, thập tự, thắt lưng, cái gáo, kim cương, mũi tên, lưỡi câu. Mỗi chòm một nốt nhạc.
- Màn hình chính chia **chương** (`src/ui/chapters.ts`): Chương 1 "Những chòm sao lạc" có 12 màn (`CHAPTER_1`); Chương 2
  "Căn gác của cú" (`CHAPTER_2`, thiết kế ở `docs/CHAPTER2_DESIGN.md`) có 12 màn, đã làm xong; hai màn cuối (11, 12) là màn suy luận thuần với đáp án duy nhất kiểm bằng test duyệt tổ hợp. Màn mới cho Chương 2 thì
  thêm vào `CHAPTER_2` trong `src/puzzles/index.ts` và vị trí sao vào `LEVEL_STARS[1]` (`hub.ts`).
- **Chương 3 "Phố đêm rằm"** (đã chốt 2026-10-14; `CHAPTER_3`, thiết kế ở `docs/CHAPTER3_DESIGN.md`, **đủ 12 màn**; màn 11 "Ai cầm đèn nào" là suy luận thuần, màn 12 "Đêm rước đèn" đáp án là vị trí). **Chương 4 "Đài thiên văn bỏ hoang"** (`CHAPTER_4`, kế hoạch 12 màn giải đố dễ → khó ở `docs/CHAPTER4_DESIGN.md`, **đủ 12 màn** (2026-10-16): "Thẻ đục lỗ", "Tủ ngăn kéo", "Bình dầu đèn", "Bảng cần gạt vòm", "Kho thấu kính", "Bàn hạt sao", "Khoá của người gác cũ", "Dây đồng nối sao", "Cú lên dây", "Sân kính thiên văn", "Cân đá chòm sao", "Mở vòm" (màn tổng hợp: thẻ đục lỗ → cần gạt → sân kính)). **Chương 4 tắt parallax** (`steady: true` ở `src/ui/chapters.ts`; người dùng thấy ảnh đung đưa khó chịu và vật ở hai lớp lệch nhau). Mỗi màn là cỗ máy đố có luật tự tìm, có đúng một lời giải kiểm bằng test; màn mới thêm vào `CHAPTER_4` và vị trí sao vào `LEVEL_STARS[3]` (đã có sẵn 12 vị trí).
  **Chương 5 "Chuyến tàu đêm"** (`CHAPTER_5`, `docs/CHAPTER5_DESIGN.md`; thiết kế 12 màn, **làm xong màn 1** "Cửa kính toa đêm" và **màn 2** "Hầm đom đóm" 2026-10-16, **màn 3** "Hang cua ruộng lúa" **màn 4** "Bãi dồn toa" và **màn 5** "Ống nhòm ngược" 2026-10-17, **màn 6** "Ghi tự lật" và **màn 7** "Than vừa đủ" và **màn 8** "Ván hạt sen" và **màn 9** "Domino toa hàng" và **màn 10** "Đường ray vòng" và **màn 11** "Ai nói thật" và **màn 12** "Ga cuối" (tổng hợp) 2026-10-18, làm tuần tự từng màn, dừng sau mỗi màn để người dùng thử; vị trí sao có sẵn ở `LEVEL_STARS[4]`, `steady: true`): người dùng muốn
  phần mới mẻ và **xen dễ ↔ khó** (nhịp răng cưa, ngoại lệ của quy tắc 3), không trùng bài cũ.
  Chương 3 giữ quy tắc riêng Chương 2 bên dưới, thêm **kết hợp nhiều manh mối để suy ra đáp án** (người dùng yêu cầu) và **không lặp
  cơ chế Chương 2** (cả chương chỉ một màn đáp án là vị trí; không đếm số làm thứ tự; không bảng tra số → chòm). Màn mới:
  thêm vào `CHAPTER_3` và vị trí sao vào `LEVEL_STARS[2]` (đã có sẵn 12 vị trí).
- **Quy tắc riêng Chương 2** (người dùng yêu cầu): **không tự tô sáng, không vẽ nét nối, không `sound.chime()` khi
  chòm lộ ra** — chấm chỉ nằm đúng chỗ, giống chấm nhiễu, người chơi tự tưởng tượng. Tiếng "tách" khi vật khớp chỗ thì
  giữ. Xen kẽ các màn mà **đáp án là con số/vị trí** (đếm vạch, chấm, lần chớp; ô trong lưới 3×3 = phím cùng vị trí;
  hoặc bảng tra có sẵn trong cảnh), không bắt buộc màn nào cũng hiện hình sao. Không dùng pha trăng làm thứ tự.
  Nét nối mờ chỉ được vẽ trên hình gợi ý (class `hint-line`), không bao giờ trong cảnh chơi.

## Quy tắc thiết kế màn (bắt buộc)
1. **Một cảnh, một mẹo nhìn**, vài thao tác; khoảnh khắc "à ra thế" là trọng tâm.
2. **Không trùng ý tưởng** với các màn đã có (xem bảng dưới) và các bản thiết kế cũ (vòng xoay ăn khớp, bóng nến, ghép
   đồ vật thành con vật, chồng phim màu, xoay ô gạch, gương chiếu tia, ống nước). Ghi màn mới vào bảng kiểm tra trùng
   lặp ở `docs/GAME_DESIGN.md` mục 4.2.
3. **Độ khó tăng dần** theo thứ tự màn: thêm thao tác, thêm bẫy, bỏ bớt nét nối, thêm chòm.
4. **Đáp án 3–4 chòm sao có thứ tự** để không đoán mò được. Quy tắc thứ tự phải suy ra được từ cảnh: trái → phải,
   **pha trăng** (khuyết → nửa → gần tròn → tròn, vẽ cạnh mỗi chòm), hoặc thứ tự xuất hiện. Thứ tự đáp án nên khác thứ
   tự người chơi tìm thấy và khác thứ tự vị trí (ví dụ màn 12: khác cả thứ tự chỗ đứng lẫn vị trí trên trời).
5. **Không lộ đáp án trước khi làm mẹo** — cả hình chòm sao lẫn trăng. Đã từng phải sửa:
   - màn 3: chòm vẽ mực đỏ mờ và trăng in sẵn trên bản đồ → bỏ hẳn, chỉ hiện dưới kính đỏ;
   - màn 9: độ nhoè ban đầu chưa đủ → nhoè hơn;
   - màn 10: nhãn dán lệch màu trần vài đơn vị → gần trùng màu;
   - màn 11: hình ép dẹt còn nét nối nên vẫn đọc được → chỉ chấm sao, thêm nhiễu và trăng giả;
   - màn 8: kéo một mạch là thấy cả 4 chòm → mỗi chòm chỉ sáng trong một khoảng, có cụm sao giả, hết đêm thì mọi sao
     sáng lại lẫn vào nhau.
   Luôn chụp ảnh trạng thái ban đầu để kiểm tra bằng mắt, và viết test "lúc bắt đầu không lộ chòm nào".
6. **Có nhiễu/bẫy** ở màn khó: chòm giả không trăng, trăng lẻ không chòm, cụm sao giả, đường kẻ rối.
7. Chòm chỉ hiện bằng chấm (không nét) thì tránh các chòm dễ nhầm khi chỉ còn chấm (mũi tên 4 chấm trông như kim cương).
8. **Không có hướng dẫn riêng từng màn.** Người chơi tự mò. Nút **?** chỉ mở thẻ trợ giúp chung (`src/ui/guide.ts`):
   Ngoại lệ do người dùng yêu cầu: màn 7 đến 12 Chương 4 (Khoá của người gác cũ … Mở vòm) và màn 8, 10, 11, 12 Chương 5 (Ván hạt sen, Đường ray vòng, Ai nói thật, Ga cuối) có `PuzzleDef.help` — vài câu giải thích nghĩa chốt, hiện đầu thẻ Trợ giúp và tự mở một lần. Chỉ thêm cho màn có ký hiệu không đọc được từ cảnh, không nói cách giải.
   kéo/bấm/xoay vật, quan sát, đom đóm và gợi ý, chọn chòm trên bàn phím, nút nhạc, nút loa. Không giải thích mẹo.
9. Vật thao tác được phải luôn tìm thấy và kéo lại được (màn 8: mặt trời lặn sau đồi → thêm thanh thời gian luôn hiện).
10. Không dùng màu làm manh mối duy nhất; chơi được bằng chạm (màn 360 px) và bàn phím.

Các mẹo đã dùng (đừng lặp): che bằng mây · phản chiếu mặt hồ (lộn ngược) · lọc màu kính đỏ · đèn lỗ kim chiếu chấm lật
gương · gấp giấy cho sao chồng nhau · chồng hai tấm kính · trượt mảnh 3×3 · thứ tự sáng lên lúc hoàng hôn · độ nét theo
độ sâu · sao dạ quang nạp sáng rồi tắt đèn · khúc xạ qua cốc nước · thị sai đổi chỗ đứng. Chương 3 (đã chốt): rập than chì · dấu chân chồng lớp · cộng hưởng ly nước · khớp hoa văn giấy gói ·
dòng chảy hoa đăng · sóng dừng Chladni · bầu trời quay theo kim giờ · chồng tranh tìm chỗ lệch · suy quy tắc tò he · lia máy
khi phơi sáng · suy luận đoàn rước · nhiều lớp manh mối. Ý tưởng còn lại: xem
`docs/GAME_DESIGN.md` mục 4.3.

## Gợi ý (bắt buộc)
- **Đom đóm cố định 2 con mỗi người chơi**, không nhặt trong cảnh, không tặng theo thời gian (người dùng yêu cầu;
  cách tăng sẽ tính sau — đừng tự thêm). Save cũ được đặt lại về 2 trừ số gợi ý đã mua.
- **Mở màn tuần tự:** màn sau cần giải màn trước trong chương; Chương 2 cần giải đủ Chương 1 (`levelUnlocked` trong
  `src/ui/chapters.ts`; hub và `main.ts` đều chặn). Màn đã giải luôn mở.
- **Mỗi màn 1 gợi ý, tốn 1 đom đóm, và gợi ý giải cả màn.** Không giới hạn 3 lần, không gợi ý từng phần. Mua rồi xem
  lại miễn phí (nút hiện ✓).
- Gợi ý là **thẻ nhiều hình, mỗi lần hiện một hình**, chuyển bằng nút ‹ ›, chấm bước, phím ← →. **Hình cuối là đáp án**
  (các chòm đánh số). Không dồn mọi bước lên một màn hình. Không vẽ gì lên cảnh đang chơi.
- **Luôn trình bày đầy đủ từ đầu màn**, không cắt bước theo việc người chơi đã làm. Thẻ dựng một bản sao ẩn của màn
  (`def.mount` vào `Scene` ngoài màn hình, âm thanh tắt), chụp hình trước mỗi bước rồi gọi `apply` của bước đó, nên mỗi
  hình đúng trạng thái của bước (đèn sáng sau khi thắp nến…).
- **Mỗi bước có hoạt ảnh của chính vật thể**, lặp lại: vật được kéo tự trượt tới đích, tấm kính tự xoay, đèn lồng lật
  mặt, bản đồ gấp lại. **Không vẽ mũi tên, không vòng khoanh đỏ, không huy hiệu.** Chỉ thêm chấm "ngón tay" trắng nhỏ
  (kéo/bấm) và quầng sáng vàng nhẹ cho bước "đọc". Nền hình đóng băng (không sao nhấp nháy…).
- **Ngắn gọn:** thao tác lặp lại cho nhiều chòm thì chỉ minh hoạ một lần (chòm đầu tiên) và câu mô tả nói "làm tương tự
  với các chòm còn lại". Mục tiêu 2–4 hình mỗi màn kể cả hình đáp án. Không liệt kê ~20 nước trượt (màn 7: 1 nước mẫu +
  hình đã ghép xong).
- Hoạt ảnh **chạy bằng script** (`animateHintPicture` + vòng `requestAnimationFrame` trong thẻ), **không dùng SMIL**
  (Safari không tự chạy SMIL chèn vào sau) và **vẫn chạy khi bật giảm chuyển động** (đó là nội dung chính).
- API (`src/puzzles/types.ts`): `hintSteps()` trả về `HintStep[]`; mỗi bước có `note` (một câu tiếng Việt, ngắn),
  `targets` và `apply`. `HintTarget`: `x, y, r, verb` ('drag' | 'tap' | 'rotate' | 'look'), `to` (đích kéo), `object`
  (selector `[data-hint="…"]` của vật để hoạt ảnh — gắn `data-hint` cho vật trong cảnh), `turn` (độ xoay), `flip`
  (lật mặt), `act` (hoạt ảnh riêng của màn, nhận bản sao SVG, trả về hàm theo tiến độ 0..1). `apply` phải đặt trạng thái
  **ngay lập tức** (không tween, không hẹn giờ) rồi vẽ lại.
- `hintPicture.ts` đổi tên mọi id trong bản sao để clip/gradient của từng hình độc lập — giữ nguyên cơ chế này.
- Dấu gợi ý riêng trong cảnh (class `ghost-mark`, `hint-tick`, `hint-line`, `filter-ghost`, `plate-ghost`,
  `number-badge`, `cell-label`) bị ẩn khỏi cảnh thật bằng CSS, chỉ hiện trên hình gợi ý.

## Giao diện, âm thanh, cảm ứng
- **Cả vùng cảnh không cuộn trang khi chạm** (`.scene:not(.hint-picture) { touch-action: none }`). Người dùng đã chọn
  giữ cách này (đừng đổi sang "chỉ chặn ở vật thao tác"). Điện thoại nằm ngang (cao ≤ 520 px): cảnh trái, bàn phím phải,
  vừa một màn hình.
- **Nhạc nền** tự tổng hợp bằng WebAudio (`src/core/music.ts`), bắt đầu sau lần chạm đầu, dừng khi chuyển tab. Nút ♪
  bật/tắt nhạc, nút loa tắt toàn bộ âm thanh; cả hai lưu trong save và giữ khi "Chơi lại từ đầu".
- Điện thoại hẹp: chấm tiến trình xuống hàng riêng để không đẩy nút Gợi ý ra ngoài.
- **Phóng to cảnh (từ 2026-10-19, cho điện thoại):** chụm hai ngón, nút kính lúp −/+ trên thanh trên cùng (điện thoại
  hẹp: cùng hàng chấm tiến trình), con lăn chuột; khi đã phóng to, kéo chỗ trống hoặc hai ngón để di chuyển, kéo vật sát
  mép thì cảnh tự trôi theo. Làm trong `Scene` bằng `viewBox` (`sceneView` là hàm thuần có test), nên các màn không phải
  sửa gì; toạ độ kéo thả đi qua `getScreenCTM`. Phần tử được bấm/kéo cần class `interactive`, `role="button"`/`slider`,
  `tabindex` (đã có qua `asButton`/`draggable`) để kéo một ngón không thành di chuyển cảnh. Không đặt nút đè lên cảnh
  (vật phải luôn bấm được); bản đồ nhỏ ở góc chỉ hiện khi phóng to và không nhận chạm. Bản sao của thẻ gợi ý tạo
  `Scene` với `{ zoomable: false }`. **Điện thoại dọc:** bàn phím gọn (≤ 38vh), cảnh chiếm phần cao còn lại, lúc đầu
  hiện toàn cảnh (có dải trên/dưới), phóng to thì lấp đầy khung; thẻ Gợi ý rộng sát màn hình.
- **Chạm bằng ngón tay (từ 2026-10-19):** trên màn cảm ứng, cảnh chỉ bằng 0,22–0,37 kích thước vẽ nên nhiều vật chỉ còn
  12–25 px (đo: 345/380 vật bấm/kéo được dưới 44 px ở 390×844). `Scene` tự đỡ: chạm (touch/pen, không phải chuột) rơi
  cách một vật bấm/kéo được ≤ `TOUCH_SLOP` = 22 px (màn hình) thì giao cho vật đó, vật gần nhất thắng, vật nhỏ hơn thắng
  khi bằng nhau (`nearestBox`); `pointerdown` giả cùng `pointerId` được gửi tới vật nên kéo tiếp tục theo ngón, và click
  giả gửi sau khi nhấc tay (click thật của trình duyệt bị bỏ). **Màn mới không phải làm gì thêm** miễn vật có class
  `interactive`, `role="button"/"slider"`, `tabindex` hoặc qua `scene.draggable` (đặt `touch-action: none` inline) — vật
  tương tác mà không có dấu nào trong đó sẽ không được đỡ. Trạng thái "khoá" thì đặt `pointer-events: none`. Kéo dùng
  "độ lệch lúc nắm" (`grab = p - vị trí`) để nắm lệch tâm không bị giật. **Chạm đúp** chỗ trống để phóng 2,2× (lần hai
  thu lại). Nút trên thanh trên cùng ≥ 44 px khi `pointer: coarse`. Gợi ý "chụm hai ngón hoặc chạm đúp" hiện đúng một
  lần (`save.seenTips`). Khi khung cao hơn cảnh (điện thoại dọc), nhóm vẽ bị cắt theo khung 1600×900 (`clip-path`) để
- **Vật nhỏ được vẽ to hơn trên điện thoại (từ 2026-10-19, `src/core/grow.ts`):** trên khung cảnh hẹp (< 700 px; máy tính
  không đổi gì, không bọc gì) mỗi vật bấm/kéo được là nhóm `<g>` có hình vẽ thật (bỏ vùng chạm trong suốt) nhỏ hơn
  `GROW_MIN_PX` = 28 px thì được phóng tới 28 px (tối đa `GROW_MAX` = 2,4×) quanh tâm hình vẽ, bằng một nhóm bọc
  `.grow-wrap` bên trong vật (`transform: scale`), chỉ tạo khi vật thật sự phóng. Không đụng tới vật dài mảnh (dài/ngắn
  > 2,6: cần gạt, thanh trượt), không phóng tới mức chạm vật tương tác bên cạnh (mỗi vật dùng 80% nửa khoảng trống trên
  trục còn rộng nhất), các vật cùng kích thước dùng chung hệ số nhỏ nhất (hàng đèn, lưới sao không bị to nhỏ lẫn lộn),
  hệ số giảm theo mức phóng to và tự tính lại khi đổi cỡ khung hay xoay máy. **Chỉ vật tương tác là `<g>` mới được phóng**
  (hình đơn như `rect` thì không bọc được). Vật không nên phóng (ghép khít với hình khác, như lông vũ ở "Lông cánh") đặt
  `data-nogrow`; vật có biển/nhãn không tương tác sát bên (trạm ở "Than vừa đủ") đặt `data-grow="1.4"` để giới hạn
  hệ số. Nội dung vật bị vẽ lại (`replaceChildren`) thì tự quét lại. Khi thêm màn có vật nhỏ: chụp ảnh 390×844 trước/sau
  để xem có chồng lên biển, nhãn hay vật khác không.
- **Màn hình chính trên điện thoại dọc (≤ 700 px, portrait; `src/ui/mapLayout.ts`):** bản đồ màn xếp **dọc** (zigzag
  600 đơn vị rộng, sao và tên to hơn, không cuộn ngang); dòng tiến trình và nút chơi lên trên bản đồ, nút chơi `sticky`
  nên luôn thấy khi cuộn; màn kế tiếp tự cuộn vào tầm nhìn nếu đang ngoài. Xoay máy thì vẽ lại. Máy tính và điện thoại
  ngang giữ bản đồ ngang (`LEVEL_STARS`). Thêm màn/chương: bản dọc tự tính vị trí, không cần thêm toạ độ.
- **Nút chơi của mỗi chương (`playTarget` trong `chapters.ts`, có test):** còn màn thì mở màn chưa giải kế tiếp (chữ
  "Bắt đầu" nếu chương chưa giải màn nào, "Chơi tiếp" nếu đã giải); **chương đã xong thì sang màn chưa giải đầu tiên của
  chương kế tiếp** (màn 1 nếu chương đó mới); không còn gì để chơi phía sau thì chữ **"Chơi lại"** và về màn 1 của cả game
  (không xoá tiến trình; muốn xoá thì "Chơi lại từ đầu" ở chân trang). Chương còn khoá thì nút tắt.
- **Không bôi chữ được:** `user-select: none` cho cả trang (không chỉ cảnh), sự kiện `selectstart` bị chặn (`embed.ts`),
  bắt đầu kéo thì xoá vùng chọn. Trước đây kéo vật ra ngoài khung cảnh, nhấn giữ hay chạm đúp có thể bôi xanh chữ ở thanh
  trên, thẻ, nhãn.
- **Thẻ nổi (Trợ giúp, Gợi ý, đã giải):** nội dung dài phải cuộn được mà nút đóng vẫn hiện; khi mở thì cuộn về đầu (focus bằng `preventScroll`), vì chữ giải thích riêng của màn nằm trên cùng. Điện thoại ngang (cao ≤ 520 px): thẻ Gợi ý xếp hình và câu cạnh nhau. Bản đồ chương trên điện thoại dọc cuộn ngang. Nhãn trên bản đồ không được chồng lên chú cú hay tràn mép (`LEVEL_STARS` trong `hub.ts`).
- Bàn phím sai thì khoá 1,5 s → 3 → 6 → 12 → tối đa 15 s; số lần sai được lưu.

## Kỹ thuật
- TypeScript + SVG thuần + Vite, không framework. Cảnh 1600×900, ba lớp `back/mid/front` có parallax theo con trỏ; vật
  cần căn khớp nhau nên cùng một lớp.
- Mỗi màn một file trong `src/puzzles/`, export `PuzzleDef { id, name, answer, mount }`; `mount` trả về
  `revealHints(n)`, `hintSteps()`, `destroy()`. Logic "chòm nào đã lộ" tách thành **hàm thuần** export ra và có test.
- Thêm màn: file mới → `PUZZLES` (`src/puzzles/index.ts`) → chương (`src/ui/chapters.ts`) → vị trí sao `LEVEL_STARS`
  (`src/ui/hub.ts`, viewBox 1600×640) → test (`tests/levels.test.ts`, cập nhật số màn trong test registry) → tài liệu.
- Bẫy đã gặp:
  - Parallax đặt bằng CSS `transform` + `will-change` trên `.layer` (không `setAttribute('transform')`) — nếu không, rê chuột
    vẽ lại cả cảnh kèm filter và lag. Đừng cho sao nhấp nháy vào ảnh được dùng lại qua nhiều `<use>`. Cũng đừng đặt filter (blur/glow) trong ảnh dùng lại qua nhiều `<use>`: phóng to chạy lại filter cho từng bản (màn 7 từng lag vì thế) — dùng đĩa mờ làm quầng sáng.
  - CSS `opacity`/thuộc tính trong stylesheet **đè** thuộc tính SVG `opacity` đặt bằng `setAttribute` → bật/tắt bằng
    `style.display` hoặc class.
  - Class `.solved` từng va chạm → overlay dùng `.solved-overlay`.
  - Bấm nhanh làm mất bước xoay → lưu góc đích thay vì cộng dồn trong tween.
  - Hộp bao (bbox) của nhóm có `<use>` + clip sai → thêm `rect` trong suốt làm vùng bấm, `pointer-events: none` cho phần vẽ.
  - `uid()` cho id runtime; tránh id trùng giữa cảnh thật và bản sao.
  - Trong script Python sửa file, nếu một `assert` thất bại giữa chừng thì phần sau không được ghi — kiểm tra lại trước
    khi commit.

## Kiểm tra trước khi commit
1. `npx tsc --noEmit` và `npx vitest run` (hiện 366 test).
2. `npm run build`, chạy `node_modules/.bin/vite preview --port 4173` (chạy nền).
3. Chơi thử bằng Playwright (Chromium ở `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, thêm `--no-proxy-server`):
   ở **cả hai ngôn ngữ** (`locale` của context hoặc `lang` trong save; quét chữ, aria-label và ghi chú gợi ý ở tiếng Anh
   xem còn dấu tiếng Việt không), giải mọi màn, nhập đáp án, mở thẻ gợi ý từng màn, chụp ảnh và **tự xem ảnh** (trạng thái ban đầu không lộ đáp án,
   hoạt ảnh có chuyển động — đo vị trí vật theo thời gian). Script thử nằm trong scratchpad nên không còn ở phiên sau:
   viết lại khi cần. Đặt save qua `localStorage['star-keeper/save/v1']` rồi **reload**.
4. Thử điện thoại: viewport 390×844, 360×640 và ngang 844×390, giả lập cảm ứng (`hasTouch`, `isMobile`, CDP
   `Input.dispatchTouchEvent` — chụm hai ngón để thử phóng to, kéo vật khi đang phóng to).
5. Font (Fraunces, Noto Serif) đi kèm game qua `@fontsource` (chỉ bộ chữ Latin + tiếng Việt, import ở `src/main.ts`); không
   còn tải Google Fonts.

## Phát hành (artifact)
- Đóng gói một file: lấy `dist/index.html` của bản build, nhúng CSS và JS (`dist/assets/*.css|js`) vào HTML (thay
  `</script` trong JS bằng `<\/script`), nhúng font woff2 trong CSS thành `data:` URL (bỏ dòng woff dự phòng), giữ
  `<title>The Star Keeper</title>` và meta description.
- Cập nhật artifact bằng cùng một đường dẫn file hoặc truyền `url` của artifact ở trên để giữ link.

## Phát hành (CrazyGames)
- Yêu cầu, tiến độ và cách thử ở `docs/CRAZYGAMES.md`; cập nhật bảng tiến độ ở đó khi làm xong một bước.
- `npm run build:crazygames` → `dist-crazygames/` và `star-keeper-crazygames.zip` (nộp file zip). Mọi lệnh gọi SDK đi qua
  `src/core/platform.ts`; không gọi `window.CrazyGames` ở chỗ khác.
- Ảnh bìa vẽ bằng chính các hàm của game: `tools/covers/` (mở `/tools/covers/?w=1920&h=1080` bằng `npm run dev`, chụp ở
  1920×1080, 800×1200, 800×800). Ảnh và video đã làm nằm ở `marketing/crazygames/`. Ảnh bìa chỉ được có chữ tên game.
- Video giới thiệu (`tools/video/`): `showreel.mjs` chơi thật nhiều màn ở nhiều chương với nhiều kiểu thao tác (kéo, bấm,
  xoay, chạy máy), có chấm "ngón tay"; `assemble.mjs` ghép bằng chuyển cảnh mờ, khung đầu là ảnh bìa, không tiếng.
  Quay theo thời gian thực bằng DevTools screencast (**không dùng virtual time**: chụp ảnh/nhập chuột có lúc chờ mãi).
  Đoạn chỉ thao tác trong cảnh thì cắt sát cảnh (`zoom: true`). Chạy cần `npm run dev -- --port 5180` và Playwright
  cài ngoài dự án; thêm màn hay đổi giao diện thì quay lại.
- Giữ `gameplayStart` khi vào màn và `gameplayStop` khi thẻ "Đã giải" hiện hoặc rời màn. Màn hình chính phải vừa một
  khung 16:9 thấp (800×450) mà không cuộn; trang ngoài iframe không được cuộn theo phím hay bánh xe (`src/core/embed.ts`).
