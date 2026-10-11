# Twelve Paper Shadows · Mười Hai Bóng Giấy

Web game giải đố point-and-click, không lời thoại. Người chơi xoay, kéo, sắp xếp các diorama bằng giấy
để ánh sáng, bóng đổ và bóng nước hiện ra hình **12 con giáp**, rồi chọn đúng chuỗi con giáp trên
vòng **đèn kéo quân** để trả lời.

Thiết kế đầy đủ: [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md).

## Trạng thái: Prototype (giai đoạn 0)

| Có | Mô tả |
|---|---|
| Màn hình chính | Đèn kéo quân: bóng các con giáp đã tìm được chạy vòng bên trong đèn |
| 7 màn, khó dần | 1. **Đèn ông sao** — 3 vòng giấy ăn khớp, đĩa 2 mặt (2 con) · 2. **Mâm trà ngày Tết** — kéo thả tự do 11 đồ vật, ghép thành chuột, gà, lợn, 1 món thừa · 3. **Bóng sân chiều** — sắp lại 4 tấm giấy cắt rồi kéo nến tới 3 chỗ · 4. **Ao rối nước** — 8 con rối (2 con thừa, vài con quay ngược) ghép thành 3 con giáp qua bóng nước · 5. **Gác xép Trung Thu** — 15 đồ vật, phải xoay đúng hướng (45°), 3 món thừa · 6. **Xưởng in tranh Đông Hồ** — chồng khít các tấm phim in từng màu (xoay 90°) cho ra tranh con giáp, 2 tấm thừa · 7. **Nền gạch bông** — 14 viên gạch, mỗi viên một phần tư hình; đổi chỗ + xoay để ghép 3 ô 2×2, 2 viên thừa |
| Vòng đáp án | 12 con giáp theo thứ tự Tý → Hợi, mỗi con một nốt nhạc; trả lời đúng thì phát thành giai điệu |
| Chống đoán mò | Mỗi câu cần 2–3 con giáp theo thứ tự. Thứ tự chỉ hiện ra (bằng dấu hình thoi ◆) khi giải xong phần đó, và cố ý khác thứ tự trái → phải hay thứ tự kéo nến. Mỗi lần sai, vòng đáp án nghỉ lâu dần (1,5s → 3s → 6s → 12s → 15s); số lần sai được lưu nên tải lại trang không xoá được |
| Hướng dẫn từng màn | Bảng hướng dẫn tự mở khi vào màn lần đầu (mục tiêu, thao tác, cách đọc thứ tự ◆, cách trả lời, mẹo); nút **?** để mở lại |
| Đom đóm & gợi ý | Đom đóm giấu trong cảnh; mỗi con đổi 1 gợi ý (tối đa 3/màn). **Mỗi gợi ý chỉ giúp một phần còn sai**, không lộ cả lời giải: màn 1 — vị trí đúng của 1 vòng giấy; màn 2, 5 — toàn bộ các món của 1 con vật, nối chỉ cùng màu (báo món nào cần xoay); màn 3 — chỗ đúng của 1 tấm giấy, rồi 1 chỗ đặt nến; màn 4 — 1 cặp con rối và con nào đứng bên trái. Sau 3 phút gợi ý đầu tự mở miễn phí |
| Khác | Parallax theo chuột, âm thanh tổng hợp bằng WebAudio (không có file âm thanh), lưu tiến trình bằng `localStorage`, điều khiển được bằng bàn phím, hỗ trợ cảm ứng |

## Chạy

Cần Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit test (vitest)
npm run build      # typecheck + build ra dist/
```

Mở thẳng một màn: `http://localhost:5173/#c1-star-lantern` (`c1-tea-tray`, `c1-candle-courtyard`, `c2-puppet-pond`, `c2-toy-attic`, `c3-print-shop`, `c3-tile-floor`)
Bản chơi online (riêng tư, chia sẻ qua nút Share): https://claude.ai/artifact/Nj2J2s1QVahb1yeYaB4sqX
(`c1-candle-courtyard`, `c2-puppet-pond`).

## Cấu trúc

```
src/
  core/        scene (các lớp + parallax + kéo thả), zodiac (12 hình bóng),
               answer, save, sound (WebAudio), defs (texture giấy, filter), tween
  puzzles/     mỗi câu đố một file; đăng ký thứ tự trong puzzles/index.ts
  ui/          hub (đèn kéo quân), puzzleScreen, answerRing, icons
tests/         unit test cho logic thuần (đáp án, lưu, cơ chế từng câu đố)
```

## Thêm một câu đố

1. Tạo `src/puzzles/<ten>.ts` export một `PuzzleDef` (xem `src/puzzles/types.ts`):
   `id`, `answer` (chuỗi `ZodiacId`), `guide` (nội dung bảng hướng dẫn), vị trí đom đóm, và `mount({ scene, sound })`
   vẽ vào `scene.layers.back | mid | front`, trả về `revealHints(n)` (mở thêm gợi ý cho từng phần),
   `hintTargets()`, `destroy()`.
2. Tách phần logic kiểm tra (đã khớp chưa) thành hàm thuần và viết test trong `tests/`.
3. Thêm vào mảng `PUZZLES` trong `src/puzzles/index.ts`.

Hai kiểu màn có sẵn để dùng lại:
- **Hình cắt mảnh**: `drawZodiac()` vẽ con giáp trong hộp 100×100; cắt thành mảnh bằng `clipPath`
  (vành khuyên, dải dọc, nửa trái/phải) rồi dịch/xoay từng mảnh (màn 1, 3, 4).
- **Ghép đồ vật**: khai báo đồ vật (`src/core/objects.ts`) và các nhóm cần ghép trong một `BoardConfig`,
  rồi gọi `mountAssemblyBoard()` (màn 2, 5). Luật ghép nằm ở `src/core/assembly.ts`.
  Mỗi đồ vật nên có hình dáng trùng với một bộ phận của con vật (thân, đầu, mõm, tai, sừng, đuôi, chân)
  và khai báo `depth` (0 = nằm sau như chân/đuôi, 1 = thân, 2 = nằm trước như đầu/mõm).
  Trang `npm run dev` → `/preview.html` vẽ sẵn mọi con đã ghép xong để chỉnh hình và vị trí.

## Giới hạn đã biết

- Trên điện thoại dọc, khung cảnh nhỏ; xoay ngang để chơi thoải mái hơn.
- Mới có 3 câu đố; hình con giáp là bản vector đơn giản, sẽ thay bằng mỹ thuật vẽ tay.
