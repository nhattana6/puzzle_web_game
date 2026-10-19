# Đưa The Star Keeper lên CrazyGames

Tóm tắt yêu cầu của CrazyGames (đọc ngày 2026-10-19) và tiến độ của game. Trước khi nộp, đọc lại các trang gốc ở cuối
tài liệu: luật có thể đổi, và lúc soát, máy làm việc không mở được docs.crazygames.com nên một số mục chỉ có từ nguồn
thứ cấp (ghi *chưa xác minh*).

## 1. Các giai đoạn

1. **Nộp game** ở developer.crazygames.com, qua QA.
2. **Basic Launch** (7–21 ngày, xong khi đủ 7 ngày và 500 lượt chơi): ít người chơi, **tắt quảng cáo**, SDK không bắt
   buộc, nhưng đã tích hợp thì `gameplayStart` phải gọi đúng. Số liệu (thời gian chơi, tỉ lệ quay lại) quyết định có lên
   Full Launch không.
3. **Full Launch**: QA lần nữa; SDK đầy đủ (gameplay start/stop, Data module lưu tiến trình, User module nếu có tài
   khoản); có quảng cáo và chia doanh thu.

Danh sách Basic Launch trên dashboard (*chưa xác minh*, chép lại từ một dự án khác): tải đầu < 50MB · gameplay start lần
đầu đúng cách · đạt yêu cầu Gameplay · chạy trên mọi tên miền CrazyGames · kiểm tra trình duyệt · không quảng cáo ngoài ·
không đăng nhập ngoài · nhắc tới Điều khoản / Chính sách bảo mật trong game.

## 2. Tiến độ cho Basic Launch

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Đường dẫn tương đối (`base: './'` trong `vite.config.ts`) và bản build riêng `npm run build:crazygames` → `dist-crazygames/` + `star-keeper-crazygames.zip` | ✅ 2026-10-19 |
| 3 | SDK v3 tối thiểu (`src/core/platform.ts`): init, loading start/stop, gameplay start/stop, happytime, `muteAudio` | ✅ 2026-10-19 |
| 4 | Chạy trong iframe (`src/core/embed.ts`): phím/bánh xe không cuộn trang chủ, không menu chuột phải; màn hình chính vừa một khung 16:9 thấp (800×450) | ✅ 2026-10-19 (mới thử Chromium) |
| 2 | **Bản tiếng Anh** (bắt buộc), ngôn ngữ theo `SDK.user.systemInfo.locale`, thiếu thì tiếng Anh; nút đổi ngôn ngữ trên bản đồ | ✅ 2026-10-19 (chưa có người bản ngữ đọc lại) |
| 5 | Ảnh bìa 1920×1080, 800×1200, 800×800 (chỉ chữ tên game, không viền/nút) + video xem trước (không tiếng, khung đầu là ảnh bìa): `marketing/crazygames/`, vẽ bằng `tools/covers/` | ✅ 2026-10-19 (nên duyệt bằng mắt trước khi nộp) |
| 6 | Nhắc tới Điều khoản / Chính sách bảo mật: nút **Quyền riêng tư / Privacy** ở chân bản đồ mở thẻ nói game không thu thập dữ liệu cá nhân, và trên CrazyGames thì Điều khoản sử dụng + Chính sách bảo mật của CrazyGames được áp dụng | ✅ 2026-10-19 (xem lại trên dashboard xem có cần link không) |
| – | Thử Firefox, Safari, Edge, máy yếu (Chromebook 4GB) | ⏳ chỉ có Chromium trong môi trường làm việc |
| – | Tự chứa font (bỏ Google Fonts): `@fontsource/fraunces`, `@fontsource/noto-serif`, chỉ bộ Latin + tiếng Việt | ✅ 2026-10-19 |

Để sang Full Launch: quảng cáo xen giữa (khi rời thẻ "Đã giải") và quảng cáo thưởng (xem quảng cáo → 1 đom đóm, tuỳ
chọn); lưu tiến trình bằng `SDK.data` thay `localStorage` (save vài KB, giới hạn 1MB; bật **Progress Save** khi nộp).
Không cần User module (game không có tài khoản).

## 3. Yêu cầu chính (tóm tắt)

- **Kỹ thuật:** tải đầu ≤ 50MB (≤ 20MB để lên trang chủ di động; bản build ~0,5MB), tổng ≤ 250MB, ≤ 1500 file; chỉ đường
  dẫn tương đối; chạy trên Chrome và Edge (Safari chạy kém thì bị tắt trên Safari; Chromebook 4GB phải mượt); chuột,
  bàn phím, và chạm nếu hỗ trợ di động; desktop chơi ngang.
- **Gameplay:** có tiếng Anh, bản dịch chuẩn; điều khiển nhất quán, dễ hiểu; CrazyGames tự có nút toàn màn hình (không
  làm nút riêng); Esc không được là cách duy nhất để thoát (*chưa xác minh*); không quảng cáo/đăng nhập ngoài, không nhãn
  cổng game khác.
- **Quảng cáo:** chỉ qua SDK; tắt tiếng và tạm dừng khi `adStarted`, khôi phục khi `adFinished`/`adError`; midgame chỉ ở
  điểm nghỉ tự nhiên (SDK tự giới hạn 1 lần / 3 phút, gọi sớm thì bị bỏ qua); quảng cáo thưởng là tuỳ chọn, phải thật sự
  thưởng, màn nào cũng giải được không cần nó.
- **Âm thanh:** `SDK.game.settings.muteAudio` được ưu tiên hơn nút trong game.

## 4. Cách tích hợp trong code

- `vite.config.ts`: chế độ `crazygames` chèn `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js">` vào `<head>`
  và build ra `dist-crazygames/`. Bản artifact (`npm run build`) không có SDK.
- `src/core/platform.ts`: lớp bọc duy nhất gọi SDK. Không có SDK, hoặc SDK báo `disabled` (tên miền khác) thì mọi lệnh
  không làm gì. `init()` chờ tối đa 4 giây; SDK đến muộn vẫn được báo trạng thái gameplay hiện tại. Lỗi của SDK không
  làm hỏng game. Có test ở `tests/platform.test.ts`.
- `src/main.ts`: `await platform.init()` → `loadingStart` → dựng game → `loadingStop` → hiện màn hình.
- `src/ui/puzzleScreen.ts`: vào màn → `gameplayStart`; giải xong (thẻ "Đã giải") hoặc rời màn → `gameplayStop`; giải
  lần đầu → `happytime`. Thẻ gợi ý và thẻ trợ giúp vẫn tính là đang chơi.
- `src/core/game.ts`: âm thanh tắt khi người chơi tắt **hoặc** CrazyGames yêu cầu (`muteAudio`), không ghi đè lựa chọn
  đã lưu.
- `src/core/embed.ts`: chặn phím cuộn (mũi tên, Space, PageUp/Down, Home/End) và bánh xe khi không còn gì trong game cuộn
  được nữa, để trang chủ không bị kéo theo; vùng cuộn thật (thẻ trợ giúp, bản đồ trên điện thoại) vẫn cuộn bình thường.
  Chặn menu chuột phải. `html, body { overscroll-behavior: none }`.

## 5. Thử

- Chạy `npm run build:crazygames`, rồi `node_modules/.bin/vite preview --port 4174 --outDir dist-crazygames`.
- Trên `localhost` SDK thật chạy ở chế độ `local` (quảng cáo mẫu). Trong môi trường làm việc không tải được SDK: dùng
  Playwright `page.route('https://sdk.crazygames.com/**')` trả về một SDK giả ghi lại các lệnh gọi.
- Thử iframe: trang chủ là một server khác cổng (ví dụ `127.0.0.1:4175`, trang cao 3000px chứa iframe 800×450 trỏ tới
  `localhost:4174`); bấm vào game, bấm phím cuộn và lăn chuột, đo `scrollY` của trang chủ (phải là 0). Chrome chặn iframe
  localhost trong trang có tên miền công khai, nên trang chủ cũng phải chạy trên máy.
- Trước khi nộp: thử trong Preview của cổng nhà phát triển.

## 6. Nguồn

- Yêu cầu: [Introduction](https://docs.crazygames.com/requirements/intro/) ·
  [Technical](https://docs.crazygames.com/requirements/technical/) ·
  [Gameplay](https://docs.crazygames.com/requirements/gameplay/) ·
  [Quality](https://docs.crazygames.com/requirements/quality/) ·
  [Advertisement](https://docs.crazygames.com/requirements/ads/) ·
  [Account integration](https://docs.crazygames.com/requirements/account-integration/) ·
  [Game covers](https://docs.crazygames.com/requirements/game-covers/) ·
  [Basic Launch Guide](https://docs.crazygames.com/resources/basic-launch-metrics/) ·
  [FAQ](https://docs.crazygames.com/faq/)
- SDK: [Intro](https://docs.crazygames.com/sdk/intro/) · [Game](https://docs.crazygames.com/sdk/game/) ·
  [Video ads](https://docs.crazygames.com/sdk/video-ads/) · [Data](https://docs.crazygames.com/sdk/data/)
