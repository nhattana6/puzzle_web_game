# Twelve Paper Shadows · Mười Hai Bóng Giấy

Web game giải đố point-and-click, không lời thoại. Người chơi xoay, kéo, sắp xếp các diorama bằng giấy
để ánh sáng, bóng đổ và bóng nước hiện ra hình **12 con giáp**, rồi chọn đúng chuỗi con giáp trên
vòng **đèn kéo quân** để trả lời.

Thiết kế đầy đủ: [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md).

## Trạng thái: Prototype (giai đoạn 0)

| Có | Mô tả |
|---|---|
| Màn hình chính | Đèn kéo quân: bóng các con giáp đã tìm được chạy vòng bên trong đèn |
| 3 câu đố | **Đèn ông sao** (xoay 3 vòng giấy để ghép bóng chiếu) · **Bóng sân chiều** (kéo nến, bóng 3 tấm giấy cắt dịch theo thị sai) · **Ao rối nước** (xếp con rối, đọc hình trong bóng nước) |
| Vòng đáp án | 12 con giáp theo thứ tự Tý → Hợi, mỗi con một nốt nhạc; trả lời đúng thì phát thành giai điệu |
| Đom đóm & gợi ý | Đom đóm giấu trong cảnh; mỗi con đổi 1 cấp gợi ý (khoanh vùng → cách thao tác → bóng mờ lời giải). Sau 3 phút cấp 1 tự mở miễn phí |
| Khác | Parallax theo chuột, âm thanh tổng hợp bằng WebAudio (không có file âm thanh), lưu tiến trình bằng `localStorage`, điều khiển được bằng bàn phím, hỗ trợ cảm ứng |

## Chạy

Cần Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit test (vitest)
npm run build      # typecheck + build ra dist/
```

Mở thẳng một câu đố: `http://localhost:5173/#/p/c1-star-lantern`
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
   `id`, `answer` (chuỗi `ZodiacId`), vị trí đom đóm, và `mount({ scene, sound })`
   vẽ vào `scene.layers.back | mid | front`, trả về `hintTargets()`, `showGhost()`, `destroy()`.
2. Tách phần logic kiểm tra (đã khớp chưa) thành hàm thuần và viết test trong `tests/`.
3. Thêm vào mảng `PUZZLES` trong `src/puzzles/index.ts`.

Mẹo dùng chung: `drawZodiac()` vẽ hình con giáp trong hộp 100×100; cắt thành mảnh bằng `clipPath`
(vành khuyên, dải dọc...) rồi dịch/xoay từng mảnh là cách cả 3 câu đố hiện tại tạo ra "hình ghép".

## Giới hạn đã biết

- Trên điện thoại dọc, khung cảnh nhỏ; xoay ngang để chơi thoải mái hơn.
- Mới có 3 câu đố; hình con giáp là bản vector đơn giản, sẽ thay bằng mỹ thuật vẽ tay.
