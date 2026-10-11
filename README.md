# Paper Shadows · Giải đố Giấy & Bóng

Web game tuyển tập câu đố không lời, phong cách giấy cắt, ánh sáng và bóng, chất liệu Việt Nam
(đèn ông sao, rối nước, tranh Đông Hồ, gạch bông, ruộng bậc thang…). Mỗi màn một ý tưởng;
các màn được gom thành chương theo kiểu cơ chế, độ khó tăng dần trong mỗi chương.

Thiết kế: [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md).
Bản chơi online (riêng tư, chia sẻ qua nút Share): https://claude.ai/artifact/Nj2J2s1QVahb1yeYaB4sqX

## Nội dung hiện có: 3 chương, 9 màn

| Chương | Màn |
|---|---|
| **Ánh sáng & Bóng** | Đèn ông sao (mật mã) · Gương đồng · Bóng sân chiều (mật mã) · Ao rối nước |
| **Ghép đồ vật** | Mâm trà ngày Tết · Gác xép Trung Thu |
| **Xoay, chồng & nối** | Mương nước ruộng bậc thang · Xưởng in tranh Đông Hồ · Nền gạch bông |

- **Hai kiểu kết thúc màn:** phần lớn màn **tự hoàn thành khi xếp đúng**. Một số màn "mật mã" cần đọc dấu ◆
  rồi chọn đúng chuỗi con giáp trên vòng đáp án (sai thì vòng khoá lâu dần).
- **Màn hình chính:** chuỗi đèn lồng (mỗi màn một đèn, giải xong thì sáng) và danh sách chương.
- **Hướng dẫn từng màn** tự mở lần đầu, nút **?** để mở lại.
- **Đom đóm & gợi ý:** tối đa 3 gợi ý mỗi màn, mỗi gợi ý giúp một phần còn sai; không trừ đom đóm nếu không còn gì để gợi ý.
- Parallax, âm thanh tổng hợp bằng WebAudio, lưu tiến trình bằng `localStorage`, bàn phím và cảm ứng.

## Chạy

Cần Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit test (vitest)
npm run build      # typecheck + build ra dist/
```

Mở thẳng một màn: `http://localhost:5173/#<id>`, ví dụ `#mirror-hall`, `#rice-terraces` (id nằm trong từng file ở `src/puzzles/`).
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
   `id`, `name`, `guide` (nội dung bảng hướng dẫn), vị trí đom đóm, và `mount({ scene, sound, solved })`.
   Màn tự hoàn thành gọi `solved()` khi xếp đúng; màn mật mã thì khai báo thêm `answer` (chuỗi `ZodiacId`)
   vẽ vào `scene.layers.back | mid | front`, trả về `revealHints(n)` (mở thêm gợi ý cho từng phần),
   `hintTargets()`, `destroy()`.
2. Tách phần logic kiểm tra (đã khớp chưa) thành hàm thuần và viết test trong `tests/`.
3. Thêm vào chương phù hợp trong `CHAPTERS` ở `src/puzzles/index.ts` (hoặc tạo chương mới).

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
