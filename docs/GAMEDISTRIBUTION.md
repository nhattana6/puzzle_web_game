# Đưa The Star Keeper lên GameDistribution

Nghiên cứu ngày 2026-10-21 (nhánh `claude/gamedistribution-submission`). **Máy làm việc không mở được gamedistribution.com,
static.gamedistribution.com và faq.gamedistribution.com** (proxy chặn); mở được **github.com**, nên phần SDK lấy trực tiếp từ wiki
[GD-HTML5](https://github.com/GameDistribution/GD-HTML5) (đáng tin hơn cả). Phần quy định (hướng dẫn nhà phát triển, thiết kế, hợp
đồng) lấy từ kết quả tìm kiếm trích các trang chính thức và vài bài của bên thứ ba: mục nào chưa chắc thì ghi *chưa xác minh*.

## 1. GameDistribution là gì (khác Poki và CrazyGames)

GameDistribution (GD) là **mạng phân phối**: bạn tải game lên một lần, GD cung cấp cho rất nhiều trang web đối tác (publisher) và tự
chèn quảng cáo qua SDK; bạn nhận phần doanh thu. Không có "thử nghiệm với người chơi thật" như Poki; có **QA của GD**.

## 2. Quy trình nộp

1. Đăng ký tài khoản nhà phát triển, **tạo game trong Developer Admin** (lấy `gameId`, chuỗi 32 ký tự hex; ở tab Upload còn gọi là game key).
2. Làm bản build theo hướng dẫn của GD, **tích hợp SDK bắt buộc** (mục 4), tải **file zip HTML5** (có `index.html`) lên.
3. Điền danh sách kiểm tra của game (mô tả, danh mục, **ô "Mobile Ready"**, ảnh đại diện).
4. **Kiểm tra SDK**: mở game trong khung iframe ở trang quản trị và **xem trọn một quảng cáo preroll thử** (tắt chặn quảng cáo). Đây là
   điều kiện để kích hoạt.
5. Bấm **Request Activation** (nộp). QA của GD xét: lần đánh giá đầu thường tới ~1 tuần (hướng dẫn nhà phát triển), có nguồn nói FAQ ghi tới 3 tuần;
   kết quả là kích hoạt hoặc phản hồi để sửa. Bản cập nhật cũng được xét lại (bên thứ ba: tới 2 tuần).

## 3. Điều kiện (theo hướng dẫn nhà phát triển, bản tìm được)

- **Không trùng game đã có trong danh mục; không vi phạm bản quyền.** Nội dung phù hợp mọi lứa tuổi.
- **SDK của GD bắt buộc** và phải chạy đúng: bị từ chối nếu SDK hỏng, đặt quảng cáo sai chỗ, game lỗi, ảnh đại diện không đúng game,
  **tick "Mobile Ready" mà game không chạy tốt trên di động** (bên thứ ba liệt kê các lý do từ chối thường gặp).
- **Quảng cáo chỉ của GD**: cấm quảng cáo bên thứ ba, mua hàng trong game bên ngoài, phần mềm theo dõi (**không phân tích/analytics**), thu thập dữ
  liệu cá nhân, thông tin liên hệ, thương hiệu nặng. **Không liên kết ra ngoài** (game nộp từ 1/5/2021; GD có thể chặn liên kết qua SDK).
- Game do **GD lưu trữ**: tự chứa, đường dẫn tương đối, HTTPS; trang bên ngoài/iframe chỉ nhận với game nhiều người chơi thật.
  Chạy trên Chrome, Firefox, Safari; co giãn theo khung (responsive).
- **Ảnh đại diện bắt buộc 3 cỡ: 512×512, 512×384, 200×120**; tuỳ chọn ảnh quảng bá 1280×550 và 1280×720. Ảnh sắc nét, không viền trắng, **không nút
  hay giao diện** (publisher khó cắt); chữ/logo nếu có phải đọc được và không lấn; 200×120 nên **không logo game**.
- Không có giới hạn dung lượng hay thời gian tải được công bố (bên thứ ba). Chia doanh thu: bên thứ ba ghi nhà phát triển nhận **33% doanh thu ròng**
  từ quảng cáo và mua hàng trong game (*chưa xác minh với điều khoản*; đọc hợp đồng "developer game license agreement" trước khi nộp).
- Quảng cáo thưởng (rewarded) là tuỳ chọn; muốn dùng phải bật cờ *Rewarded Ads* của game trong trang quản trị.

## 4. SDK (từ wiki GD-HTML5, đáng tin)

```html
window.GD_OPTIONS = {
  gameId: "…32 hex…",
  advertisementSettings: { debug: false, autoplay: false, locale: "en" },
  onEvent: function (event) {
    switch (event.name) {
      case "SDK_GAME_PAUSE": /* tạm dừng VÀ tắt tiếng */ break;
      case "SDK_GAME_START": /* tiếp tục, bật tiếng */ break;
      case "SDK_REWARDED_WATCH_COMPLETE": /* chỉ lúc này mới thưởng */ break;
    }
  },
};
// nạp một lần: https://html5.api.gamedistribution.com/main.min.js (id "gamedistribution-jssdk")
```
- Gọi `gdsdk.showAd()` (bọc `typeof` vì script có thể bị chặn) **chỉ từ thao tác của người chơi** (mouseup/touchend), **ngoài lúc chơi**:
  preroll ở nút Chơi/Tiếp tục, midroll ở nút Chơi lại/Màn tiếp/Menu. Gọi bao nhiêu cũng được: **SDK tự giữ khoảng cách quảng cáo**.
- Trong lúc có quảng cáo **cấm âm thanh nền**; chờ `SDK_READY` trước khi xin quảng cáo; chỉ nạp SDK một lần, không nạp khi bấm nút.
- Sự kiện khác: `SDK_ERROR`, `SDK_GDPR_TRACKING/TARGETING/THIRD_PARTY` (người chơi từ chối theo dõi; game không theo dõi gì nên bỏ qua).
- Gỡ lỗi: `gdsdk.openConsole()` trong console để hiện thanh quảng cáo giả.

## 5. Đã làm trong game (nhánh này)

- `GD_GAME_ID=<id> npm run build:gamedistribution` → `dist-gamedistribution/` + `star-keeper-gamedistribution.zip` (`index.html` ở gốc, đường
  dẫn tương đối). Đoạn script đặt `GD_OPTIONS` (gameId từ biến môi trường, `autoplay: false`, `locale: 'en'`) và nạp SDK được chèn vào `<head>`
  bởi `vite.config.ts`; không đặt `GD_GAME_ID` thì build vẫn chạy nhưng in cảnh báo và dùng id giữ chỗ (không có quảng cáo).
- `src/core/gamedistribution.ts` (`createGdPlatform`, chọn bằng `PORTAL` ở `platform.ts`): nghe sự kiện SDK qua cầu `window.__gd` (không mất sự kiện đến
  trước khi game nghe); `SDK_GAME_PAUSE` → tắt tiếng + chặn phím, `SDK_GAME_START`/`SDK_ERROR` → trả lại; **mỗi lần vào một màn gọi `gdsdk.showAd()`**
  (vào màn bằng chính cú bấm của người chơi, tức là điểm nghỉ tự nhiên: preroll khi bấm Chơi, midroll khi bấm Màn tiếp). SDK bị chặn hay lỗi thì không sao.
  6 test; thử bằng SDK giả (Playwright `route`) cả khi bị chặn.
- Thẻ quyền riêng tư nhắc điều khoản của GameDistribution; game không có analytics, không liên kết ngoài, không request nào ngoài script SDK.
- Ảnh đại diện: `marketing/gamedistribution/` (512×512, 512×384 có tên game; 200×120 **không chữ**; quảng bá 1280×720 và 1280×550).
  `tools/covers` thêm `?notitle=1` và sửa cho tên game không bị cắt ở khung 4:3.

**gameId của game này: `9cfc0aa502364441878589998c73bd4d`** (tạo ở Developer Admin của GD ngày 2026-10-21; id nằm lộ trong `index.html` nên không phải bí mật).
Build: `GD_GAME_ID=9cfc0aa502364441878589998c73bd4d npm run build:gamedistribution`.

## 6. Việc bạn cần làm

1. Tạo tài khoản và **tạo game** ở Developer Admin của GD, copy `gameId` (tab Upload).
2. `GD_GAME_ID=<gameId> npm run build:gamedistribution`, tải `star-keeper-gamedistribution.zip` lên.
3. Mở game trong iframe của trang quản trị, **xem trọn quảng cáo thử** (tắt chặn quảng cáo); xem lại tiếng tắt khi quảng cáo chạy và bật lại sau đó.
4. Điền mô tả/danh mục; **chỉ tick "Mobile Ready" sau khi chơi thử trên điện thoại thật**; tải 3 ảnh đại diện (+ 2 ảnh quảng bá).
5. Request Activation, chờ phản hồi.

## 7. Rủi ro và việc cần cân nhắc

- **Độc quyền:** GD phân phối game tới rất nhiều trang web. Nếu sau này Poki đưa hợp đồng **độc quyền web** thì không thể có cả hai. Đọc "developer game
  license agreement" của GD (điều khoản độc quyền/thời hạn/chấm dứt) *trước khi nộp*, và hỏi Poki về hợp đồng không độc quyền (`docs/POKI.md`).
  Cũng cân nhắc việc CrazyGames không nhận game đang phân phối ở nhiều cổng web (nguồn: FAQ CrazyGames, qua tìm kiếm).
- **Thu nhập:** quảng cáo của GD chạy trên game ở trang của người khác; không có thử nghiệm người chơi như Poki nên thu nhập khó đoán.
- **Chưa xác minh:** nguyên văn hướng dẫn nhà phát triển (giới hạn dung lượng, quy định di động và responsive, liên kết ngoài), điều khoản hợp đồng,
  tỉ lệ chia 33%, thời gian duyệt (1 tuần hay 3 tuần), và việc khung iframe của GD có kích thước cố định nào không. Đọc lại các trang gốc ở dưới.

## 8. Nguồn

[GD-HTML5 (GitHub)](https://github.com/GameDistribution/GD-HTML5) ·
[SDK Implementation (wiki)](https://github.com/GameDistribution/GD-HTML5/wiki/SDK-Implementation) ·
[Rewarded Ads (wiki)](https://github.com/GameDistribution/GD-HTML5/wiki/Rewarded-Ads) ·
[Developer guidelines](https://static.gamedistribution.com/developer/developers-guidelines.html) ·
[Design guidelines](https://static.gamedistribution.com/developer/design-guidelines.html) ·
[Submitting your game (FAQ)](https://faq.gamedistribution.com/hc/en-us/articles/360019771179-Submitting-your-game) ·
[Developer game license agreement](https://static.gamedistribution.com/terms/developer.html) ·
[Partnership](https://gamedistribution.com/developers/) ·
tóm tắt bên thứ ba: [portalready.world](https://portalready.world/portals/gamedistribution/)
