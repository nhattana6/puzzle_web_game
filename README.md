# The Star Keeper · Người giữ sao

Web game giải đố không lời. Mỗi màn là một cảnh nhỏ với **một mẹo nhìn duy nhất**: kéo mây, soi bóng nước,
dùng kính lọc đỏ, chiếu đèn lỗ kim, gấp bản đồ, chồng tấm kính, ghép mảnh trời, hạ mặt trời, chỉnh tiêu cự,
nạp sáng sao dạ quang, nhìn qua cốc nước, đổi điểm nhìn. Làm đúng thì các **chòm sao ẩn**
hiện ra; nhập chuỗi chòm sao vào **bàn phím 3×3** (9 chòm sao) để thắp lại một vì sao trên bầu trời.

Cơ chế lấy cảm hứng từ thể loại của HER TREES (cảnh nhỏ → lộ ký hiệu ẩn → nhập mã), nhưng chủ đề, nhân vật,
mỹ thuật và bộ ký hiệu là riêng: bầu trời đêm, chú cú giữ sao, 9 chòm sao thay cho chữ cái.

Bản chơi online (riêng tư, chia sẻ qua nút Share): https://claude.ai/artifact/Nj2J2s1QVahb1yeYaB4sqX

## Nội dung: 12 màn, khó dần

| # | Màn | Mẹo |
|---|---|---|
| 1 | Mây đêm | Kéo mây khỏi cửa sổ, đọc trái → phải |
| 2 | Mặt hồ | Lá che trời; bóng dưới hồ phản chiếu đủ nhưng **lộn ngược** |
| 3 | Kính lọc đỏ | Bản đồ phủ nét mực đỏ rối; chòm sao và trăng chỉ hiện dưới kính đỏ |
| 4 | Đèn lồng lỗ kim | Thắp nến, xoay đèn; chấm sáng trên tường **không có nét nối và bị lật gương** |
| 5 | Gấp bản đồ sao | Sao rải ở 4 góc tờ giấy mỏng; gấp đôi hai lần thì chồng lên nhau |
| 6 | Hai tấm kính | Tấm sao + tấm đường kẻ rối (có cả chòm giả); chồng khít đúng chiều thì chỉ đường thật sáng |
| 7 | Bầu trời vỡ | Trượt 8 mảnh tranh trời về đúng chỗ |
| 8 | Hoàng hôn | Kéo thanh thời gian (mặt trời): mỗi chòm chỉ sáng trong một khoảng rồi mờ, xen các cụm sao giả; **thứ tự là thứ tự sáng lên**; gần hết đêm, mọi sao đã hiện trước đó **hiện lại lẫn vào sao mờ**, không còn nhận ra chòm nào |
| 9 | Chỉnh tiêu cự | Mọi thứ nhoè; mỗi chòm nằm ở một độ xa, chỉ nét ở đúng một mức tiêu cự |
| 10 | Sao dạ quang | Nhãn dán trùng màu trần; rọi đèn bàn để nạp sáng rồi **tắt đèn**, sao sáng rồi mờ dần |
| 11 | Cốc nước | Hình trên dải giấy bị ép dẹt và vẽ ngược; rót nước vào cốc, cốc thành thấu kính kéo giãn và lật hình lại |
| 12 | Điểm nhìn | Hạt sao treo ở 3 hàng xa gần; chỉ đứng đúng chỗ thì các hạt mới khớp thành chòm (thị sai) và trăng hiện bên cạnh |

- **Thứ tự đọc:** trái → phải, theo **pha trăng** (khuyết → nửa → gần tròn → tròn), hoặc thứ tự xuất hiện (màn 8).
- **Bàn phím 3×3:** 9 chòm sao, mỗi chòm một nốt nhạc; sai thì bàn phím khoá lâu dần (1,5 s → 15 s).
- **Không có hướng dẫn riêng từng màn**: người chơi tự mò. Nút **?** chỉ mở một thẻ trợ giúp chung (kéo/bấm vật thể,
  đom đóm và gợi ý, chọn chòm sao trên bàn phím, nút nhạc, nút loa), không giải thích cách giải.
- **Đom đóm & gợi ý:** tối đa 3 gợi ý mỗi màn, mỗi gợi ý giúp một phần. Gợi ý mở thành **thẻ có hình minh hoạ**
  (ảnh thu nhỏ của cảnh: khoanh đỏ vật cần làm, mũi tên chỉ chỗ kéo tới, kèm một câu hướng dẫn); cảnh chơi không bị vẽ đè.
  Bấm lại nút Gợi ý để xem lại thẻ, không tốn thêm đom đóm.
- **Chương:** màn hình chính có hai tab. Chương 1 ("Những chòm sao lạc") gồm cả 12 màn; Chương 2 đang khoá
  "Sắp ra mắt". Bản đồ mỗi chương là bầu trời đêm: giải xong màn nào thì vì sao đó sáng.
- **Nhạc nền** tự tổng hợp bằng WebAudio (hợp âm chậm + tiếng sao lấp lánh có vang), không cần file nhạc.
  Nút ♪ tắt/bật nhạc nền, nút loa tắt toàn bộ âm thanh; cả hai được lưu lại.

## Chạy

Cần Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit test (vitest)
npm run build      # typecheck + build ra dist/
```

Mở thẳng một màn: `http://localhost:5173/#<id>`, ví dụ `#night-clouds`, `#lake-mirror`, `#red-filter`,
`#pinhole-lantern`, `#folded-map`, `#glass-plates`, `#broken-sky`, `#dusk-sky`, `#star-focus`, `#glow-stars`,
`#water-glass`, `#vantage-point`.

## Cấu trúc

```
src/
  core/        scene (lớp + parallax + kéo thả), glyphs (9 chòm sao), owl (nhân vật),
               answer, save, sound (hiệu ứng WebAudio), music (nhạc nền tự tổng hợp),
               game (save + âm thanh dùng chung), defs (texture, filter), svg (moonPhase…), tween
  puzzles/     mỗi màn một file; thứ tự trong puzzles/index.ts; sky.ts = hàm vẽ trời dùng chung
  ui/          hub (bản đồ bầu trời, tab chương), chapters (danh sách chương), puzzleScreen, keypad, guide (thẻ trợ giúp chung),
               hintPicture (ảnh của thẻ gợi ý), audioControls (nút nhạc / tắt tiếng), icons
tests/         logic thuần của từng màn, bàn phím, lưu tiến trình, nhạc nền
docs/          GAME_DESIGN.md (thiết kế), CHANGELOG.md (nhật ký cập nhật)
```

## Thêm một màn

1. Tạo `src/puzzles/<ten>.ts` export một `PuzzleDef` (xem `src/puzzles/types.ts`): `id`, `name`,
   `answer` (chuỗi `GlyphId` theo thứ tự đọc), vị trí đom đóm, và `mount({ scene, sound })`
   trả về `revealHints(n)`, `hintTargets()`, `destroy()`.
2. Gợi ý: `hintTargets()` trả về các `HintTarget` (vị trí, bán kính vòng khoanh, thao tác, `to` = chỗ cần kéo tới
   để vẽ mũi tên, `note` = câu hướng dẫn). Dấu gợi ý vẽ trong cảnh (khung đích, vạch, nét nối…) dùng các class
   `ghost-mark`, `hint-tick`, `hint-line`… để chỉ hiện trên ảnh của thẻ gợi ý, không hiện trong cảnh đang chơi.
3. Tách phần logic (đã lộ chòm sao chưa…) thành hàm thuần và viết test trong `tests/`.
4. Thêm vào `PUZZLES` trong `src/puzzles/index.ts` (chương: `src/ui/chapters.ts`) và một vị trí sao trong `LEVEL_STARS` ở `src/ui/hub.ts`.
5. Cập nhật bảng màn ở README, `docs/GAME_DESIGN.md` (mục 4) và ghi vào `docs/CHANGELOG.md`.

## Giới hạn đã biết

- 12 màn; mỹ thuật là vector vẽ bằng code, cần thay bằng tranh vẽ tay.
- Chữ trong game là tiếng Việt; cần bản tiếng Anh trước khi đưa lên cổng game quốc tế.
- Ảnh trong thẻ gợi ý là cả cảnh thu nhỏ; trên điện thoại các chi tiết nhỏ (vạch trên thước màn 9, số trên mảnh
  màn 7) khá bé.
- Đã kiểm tra cảm ứng bằng giả lập (kéo vật, không cuộn trang khi chơi), chưa thử trên thiết bị thật.
- Nhạc nền mới được kiểm tra bằng máy (bật/tắt, lưu), chưa được nghe thử để chỉnh độ hay.

Lịch sử thay đổi: [docs/CHANGELOG.md](docs/CHANGELOG.md).
