# The Star Keeper · Người giữ sao

Web game giải đố không lời. Mỗi màn là một cảnh nhỏ với **một mẹo nhìn duy nhất**: kéo mây, soi bóng nước,
dùng kính lọc đỏ, chiếu đèn lỗ kim, gấp bản đồ, chồng tấm kính, ghép mảnh trời. Làm đúng thì các **chòm sao ẩn**
hiện ra; nhập chuỗi chòm sao vào **bàn phím 3×3** (9 chòm sao) để thắp lại một vì sao trên bầu trời.

Cơ chế lấy cảm hứng từ thể loại của HER TREES (cảnh nhỏ → lộ ký hiệu ẩn → nhập mã), nhưng chủ đề, nhân vật,
mỹ thuật và bộ ký hiệu là riêng: bầu trời đêm, chú cú giữ sao, 9 chòm sao thay cho chữ cái.

Bản chơi online (riêng tư, chia sẻ qua nút Share): https://claude.ai/artifact/Nj2J2s1QVahb1yeYaB4sqX

## Nội dung: 7 màn, khó dần

| # | Màn | Mẹo |
|---|---|---|
| 1 | Mây đêm | Kéo mây khỏi cửa sổ, đọc trái → phải |
| 2 | Mặt hồ | Lá che trời; bóng dưới hồ phản chiếu đủ nhưng **lộn ngược** |
| 3 | Kính lọc đỏ | Chòm sao vẽ lẫn trong nét mực đỏ; dưới kính đỏ mới hiện |
| 4 | Đèn lồng lỗ kim | Thắp nến, xoay đèn; chấm sáng trên tường **không có nét nối và bị lật gương** |
| 5 | Gấp bản đồ sao | Sao rải ở 4 góc tờ giấy mỏng; gấp đôi hai lần thì chồng lên nhau |
| 6 | Hai tấm kính | Tấm sao + tấm đường kẻ rối (có cả chòm giả); chồng khít đúng chiều thì chỉ đường thật sáng |
| 7 | Bầu trời vỡ | Trượt 8 mảnh tranh trời về đúng chỗ |

- **Thứ tự đọc:** trái → phải, hoặc theo **pha trăng** (khuyết → nửa → gần tròn → tròn) khi cảnh có đánh dấu.
- **Bàn phím 3×3:** 9 chòm sao, mỗi chòm một nốt nhạc; sai thì bàn phím khoá lâu dần (1,5 s → 15 s).
- **Hướng dẫn từng màn** tự mở lần đầu, nút **?** để mở lại.
- **Đom đóm & gợi ý:** tối đa 3 gợi ý mỗi màn, mỗi gợi ý giúp một phần.
- Bản đồ màn chơi là bầu trời đêm: giải xong màn nào thì vì sao đó sáng.

## Chạy

Cần Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit test (vitest)
npm run build      # typecheck + build ra dist/
```

Mở thẳng một màn: `http://localhost:5173/#<id>`, ví dụ `#night-clouds`, `#lake-mirror`, `#red-filter`,
`#pinhole-lantern`, `#folded-map`, `#glass-plates`, `#broken-sky`.

## Cấu trúc

```
src/
  core/        scene (lớp + parallax + kéo thả), glyphs (9 chòm sao), owl (nhân vật),
               answer, save, sound (WebAudio), defs (texture, filter), svg (moonPhase…), tween
  puzzles/     mỗi màn một file; thứ tự trong puzzles/index.ts; sky.ts = hàm vẽ trời dùng chung
  ui/          hub (bản đồ bầu trời), puzzleScreen, keypad, guide, icons
tests/         logic thuần của từng màn, bàn phím, lưu tiến trình
```

## Thêm một màn

1. Tạo `src/puzzles/<ten>.ts` export một `PuzzleDef` (xem `src/puzzles/types.ts`): `id`, `name`,
   `answer` (chuỗi `GlyphId` theo thứ tự đọc), `guide`, vị trí đom đóm, và `mount({ scene, sound })`
   trả về `revealHints(n)`, `hintTargets()`, `destroy()`.
2. Tách phần logic (đã lộ chòm sao chưa…) thành hàm thuần và viết test trong `tests/`.
3. Thêm vào `PUZZLES` trong `src/puzzles/index.ts` và một vị trí sao trong `LEVEL_STARS` ở `src/ui/hub.ts`.

## Giới hạn đã biết

- Mới 7 màn; mỹ thuật là vector vẽ bằng code, cần thay bằng tranh vẽ tay.
- Chữ trong game là tiếng Việt; cần bản tiếng Anh trước khi đưa lên cổng game quốc tế.
