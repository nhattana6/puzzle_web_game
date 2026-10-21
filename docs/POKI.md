# Đưa The Star Keeper lên Poki

Nghiên cứu ngày 2026-10-21 cho https://developers.poki.com/ (Poki for Developers). **Máy làm việc không mở được
developers.poki.com và sdk.poki.com** (proxy chặn), nên mọi con số dưới đây lấy từ kết quả tìm kiếm trích các trang đó, kèm vài
bài của bên thứ ba. Mục nào chỉ có nguồn thứ ba hoặc hai nguồn mâu thuẫn thì ghi *chưa xác minh*. Trước khi làm, đọc lại các trang
gốc ở cuối tài liệu.

## 1. Quy trình: Poki không duyệt theo danh sách tick, mà theo số liệu người chơi

1. **Tải lên** (qua trang Poki for Developers hoặc CLI `@poki/cli`). Mỗi bản tải lên qua **kiểm duyệt nội dung** trước khi được thử.
2. **Player Fit Test**: Poki cho 500 người chơi thử (khoảng 5 giờ). Chỉ đo thời gian chơi, không ghi hình. Qua khi **trung bình
   > 3 phút** và **≥ 25% trong 500 lượt chơi > 3 phút** (bài thứ ba nói lại thành 125/500).
3. **Web Fit Test**: game hiện thật trên trang danh mục cho ~10.000 người, đo tỉ lệ bấm vào, thời gian trên trang và **conversion to
   play** so với trung bình danh mục. Khoảng **7 ngày** (bài thứ ba nói 3–5 ngày). Poki gợi ý đích: conversion ≥ 65%, thời gian chơi
   ≥ 5 phút (≥ 10 phút với game quản lý/mô phỏng); game trung bình trên Poki ~70% và 6+ phút.
4. **Final review**: nhóm Poki xem số liệu và tự chơi; xét chất lượng, **độc đáo và chăm chút**, khác biệt trong danh mục. 1–2 tuần.
   Poki nói dùng AI và công cụ để phát triển nhanh thì được; **game thấy rõ là làm vội hoặc phụ thuộc công cụ thì không**.
5. Phát hành dần (Soft Release rồi toàn cầu). Bản cập nhật cũng phải xin duyệt; Poki đăng bản đã duyệt.

## 2. Yêu cầu kỹ thuật và chất lượng (từ trang Requirements)

- **Thiết bị:** máy tính, di động và máy tính bảng. Tỉ lệ **16:9**: game phải co giãn phủ kín khung **640×360, 836×470 và 1031×580**.
  Trên di động phủ toàn màn hình.
- **Chế độ ẩn danh:** `localStorage` bị hạn chế, phải bọc `try/catch` và game vẫn chơi được.
- **Không gọi tài nguyên ngoài:** Poki chặn mọi request ra ngoài (CSP). Font, hình, thư viện phải đóng gói trong build. Chỉ máy chủ
  multiplayer, analytics (không phải sản phẩm Google), bảng xếp hạng được xin ngoại lệ (Settings → CSP, kèm chính sách riêng tư công khai
  và liên kết trong game).
- **Quảng cáo/thương hiệu:** không màn hình chào (splash), không liên kết ra ngoài, không quảng cáo riêng; logo studio được hiện ở màn
  tải. **Mọi quảng cáo đi qua SDK của Poki.** Game phải chơi được khi người chơi bật chặn quảng cáo.
- **Hiệu năng:** tối thiểu 30 FPS (đích 60) trên điện thoại tầm trung ra mắt trong 3 năm và máy tính có trình duyệt 12–18 tháng tuổi,
  mạng 3G trở lên; chạy không lỗi nghiêm trọng với ≥ 85% người dùng mỗi nền tảng (trang Deal Types).
- **Dung lượng:** tải đầu **< 8 MB** (chỉ bài thứ ba nói rõ; *chưa xác minh* với trang gốc). Poki nhắc người chơi bỏ đi nếu tải quá 10 giây.
- **Nội dung và an toàn:** không bạo lực đồ hoạ, cảnh rùng rợn kéo dài, nội dung người lớn, cờ bạc, rượu thuốc; **không chat** (gợi ý
  dùng emoji). Mỗi bản mới qua kiểm duyệt nội dung.
- **Điều khiển:** khuyến khích nhiều cách (chỉ cần chuột, kéo, phím tuỳ chọn).

## 3. SDK (PokiSDK, trang HTML5)

Từ tìm kiếm; tên hàm lấy theo các trang đó, *địa chỉ script chưa xác minh* (cần chép đúng từ trang HTML5 của Poki):
- Nạp script SDK vào trang, gọi `await PokiSDK.init()`; dù thành công hay lỗi (bị chặn quảng cáo) game vẫn tiếp tục tải.
- `PokiSDK.gameLoadingFinished()` khi tải xong (Poki dùng để tính conversion to play).
- `PokiSDK.gameplayStart()` khi người chơi bắt đầu tương tác (vào màn, bỏ tạm dừng); `gameplayStop()` khi dừng (game over, tạm dừng,
  hoàn thành màn, về menu).
- `PokiSDK.commercialBreak()` (quảng cáo video) ở **điểm nghỉ tự nhiên**, nên gọi **trước mỗi `gameplayStart()`** khi người chơi đã
  tỏ ý chơi tiếp; luồng chuẩn là stop → quảng cáo → start. Cần **tắt tiếng và khoá phím** trong lúc quảng cáo (hàm nhận callback).
  Một lần gọi không bảo đảm có quảng cáo; Poki tự quyết.
- `PokiSDK.rewardedBreak()`: quảng cáo do người chơi chọn để nhận thưởng; báo trước, chỉ thưởng khi trả về `true`. Tuỳ chọn.
- Hai trang của Poki mâu thuẫn về việc tạm dừng có kèm quảng cáo hay không: đọc lại trang gốc.

## 4. Trang game, ảnh và video

- **Ảnh vuông** ≥ 628×628, tràn khung, không viền; Poki tự bo góc. **Poki khuyên không chữ** (thử nghiệm của họ cho thấy người chơi
  thích ảnh không chữ).
- **Ảnh động** (bắt buộc trước khi phát hành toàn cầu): video **1:1, ≥ 1080×1080, ≥ 50 fps, 4–6 giây, không tiếng, `.mp4`, ≤ 100 MB**.
- Mô tả và danh mục: chọn tối đa 4 danh mục; viết vài câu về cơ chế chính và điểm nổi bật, Poki viết lại cho SEO.

## 5. Hợp đồng (trang Deal Types, *thay đổi theo từng game*)

- **Web exclusive** (mặc định, 5 năm): độc quyền trên web mở (không gồm Steam, kho ứng dụng di động, máy console). Theo trang sdk.poki.com:
  nhà phát triển nhận **100% doanh thu khi người chơi do mình mang tới, 50% khi do Poki mang tới**. Trang mới hơn ghi các con số
  này chỉ mang tính tham khảo, điều khoản thật nằm trong hợp đồng của từng game.
- **Non-exclusive:** Poki trả một khoản phí giấy phép một lần.
- **Có từ chối được độc quyền không?** Chưa có nguồn nói thẳng. Poki là bên **đưa ra** hợp đồng sau khi game qua thử nghiệm ("nếu game hợp
  với Poki, chúng tôi đề nghị một hợp đồng", có hai loại). Trang hướng dẫn nói loại **không độc quyền** dành cho game **đã chạy trên
  các cổng web khác** hoặc hợp ngách/ngắn hạn với khán giả Poki; trang Bonus Level gọi nó là lựa chọn cho nhà phát triển muốn giữ
  tự do, còn độc quyền là mặc định. Hai trang lệch nhau về thời hạn độc quyền (5 năm so với 7 năm). **Kết luận tạm: game đã ở
  CrazyGames đúng với hồ sơ "không độc quyền", nên nên đề nghị loại này, nhưng việc Poki có chấp nhận hay không là chuyện của hợp
  đồng và chưa xác nhận được.** Quyết định độc quyền chỉ cần đến khi Poki gửi hợp đồng (sau thử nghiệm), không phải lúc tải lên.
- **Cần cân nhắc:** độc quyền web 5 năm nghĩa là game không đăng ở CrazyGames và các cổng web khác. Hiện game đã nộp CrazyGames
  (Basic Launch). **Chọn một trong hai trước, hoặc hỏi Poki điều khoản không độc quyền.**

## 6. Đối chiếu với game hiện tại

| Yêu cầu | Tình trạng | Ghi chú |
|---|---|---|
| Không request ra ngoài | ✅ | Font đóng gói qua `@fontsource`, không `fetch`, không CDN. Chỉ bản CrazyGames chèn script SDK. Cần kiểm lại trong tab Network của bản Poki |
| Dung lượng < 8 MB | ✅ | Tải đầu ~0,2–0,5 MB |
| `localStorage` trong ẩn danh | ✅ | `loadSave`/`writeSave` bọc `try/catch`, mở game vẫn chơi |
| Không liên kết ra ngoài, không splash | ✅ | Game không có |
| Không chat, nội dung phù hợp | ✅ | Không chữ, không bạo lực |
| Ngôn ngữ mặc định | ✅ | Tiếng Anh nếu locale không phải `vi` |
| Cảm ứng, di động | ⚠️ | Đã tối ưu bằng giả lập (phóng to, vật nhỏ vẽ to, bản đồ dọc); **chưa thử máy thật** |
| Khung 836×470 và 1031×580 | ✅ | Đo: không cuộn ở màn chính và màn chơi, phím ≥ 71 px |
| **Khung 640×360** | ❌ | Đo: **màn chính cuộn (cao 740 so với 360)**; màn chơi vừa khít (360) sau khi sửa lỗi chồng nút phóng to; phím 55 px |
| Tích hợp PokiSDK | ❌ | Chưa có. `platform.ts` chỉ biết CrazyGames |
| `commercialBreak` + tắt tiếng/phím | ❌ | Chưa có (CrazyGames Basic Launch không quảng cáo nên chưa cần) |
| Thẻ quyền riêng tư | ⚠️ | Nội dung nhắc điều khoản của CrazyGames; bản Poki phải đổi |
| Ảnh vuông không chữ | ❌ | Ảnh bìa 800×800 hiện có tên game; cần bản **không chữ** |
| Ảnh động 1:1 ≥ 1080, ≥ 50 fps | ❌ | Video hiện có 16:9 và 9:16, quay 30 fps |
| Conversion to play | ⚠️ | Người chơi mới thấy bản đồ trước, phải bấm "Bắt đầu" mới vào chơi: thêm một lần bấm trước `gameplayStart` |
| Player Fit (TB > 3 phút, 25% > 3 phút) | ❓ | Không đo được. Một màn thường 1–3 phút, 60 màn, nên khả thi nhưng chưa biết |
| Độc đáo, chăm chút (final review) | ⚠️ | Mỗi màn một cơ chế riêng và 5 chương là điểm mạnh; cần ý thức rằng game phát triển có AI hỗ trợ nhiều, Poki nói rõ họ để ý tới dấu hiệu "làm vội" |

## 7. Việc cần làm (đề xuất, theo thứ tự)

1. **Quyết định thương mại:** độc quyền web 5 năm với Poki hay đa nền tảng (CrazyGames…). Đọc trang Deal Types và hợp đồng trước khi tải.
2. **Chế độ build `poki`** (như `crazygames`): `npm run build:poki` → `dist-poki/` với `index.html` ở gốc; chèn script PokiSDK vào
   `<head>`; không chèn SDK CrazyGames. Dùng `@poki/cli` (`init` tạo `poki.json`, `upload` đẩy bản mới) hoặc nén zip.
3. **Tổng quát hoá `platform.ts`** thành hai bộ chuyển (CrazyGames, Poki) sau một giao diện chung: `loadingStop` → `gameLoadingFinished`,
   `gameplayStart/Stop` giữ nguyên, thêm `commercialBreak(onStart, onEnd)` (tắt tiếng + khoá phím, gọi `gameplayStart` sau quảng
   cáo), `happytime` (nếu Poki có) và `storage()` = null (Poki không có Data module, dùng `localStorage`).
4. **Chỗ đặt quảng cáo:** chỉ ở điểm nghỉ tự nhiên: khi bấm "Màn tiếp" ở thẻ "Đã giải" hoặc khi vào màn từ bản đồ, **trước** `gameplayStart`.
   Không chen giữa chừng khi đang giải màn, không trong lúc đang mua gợi ý.
5. **Khung 640×360:** làm màn chính vừa không cuộn (thu gọn tiêu đề, tab chương và bản đồ cho khung thấp ≤ 380 px).
6. **Vào thẳng màn 1 cho người chơi mới** trong bản Poki (hoặc nút "Chơi" lớn ngay màn đầu), để giảm bước trước `gameplayStart`
   và tăng conversion to play.
7. **Tài liệu và tài sản:** ảnh vuông ≥ 628 **không chữ** (vẽ lại bằng `tools/covers/`), video 1:1 ≥ 1080×1080, ≥ 50 fps, 4–6 s
   (quay bằng `tools/video/`, ghép ở 60 fps), mô tả ngắn và ≤ 4 danh mục (Puzzle…). Đổi thẻ quyền riêng tư theo nền tảng.
8. **Thử:** bản Poki trong chế độ chặn quảng cáo (SDK lỗi/bị chặn game vẫn chạy), trong cửa sổ ẩn danh, ba kích thước khung của
   Poki, và trên điện thoại thật.

## 8. Chưa xác minh (cần đọc trang gốc)

Địa chỉ và tên hàm chính xác của PokiSDK; giới hạn dung lượng chính thức; số ngày Web Fit Test; cách xử lý tạm dừng với quảng cáo;
yêu cầu về ngôn ngữ/mô tả trên trang game; điều khoản hợp đồng; việc Poki có chấp nhận cùng lúc ở CrazyGames hay không.

## 9. Nguồn

[Requirements](https://developers.poki.com/guide/requirements-quality) ·
[SDK overview & events](https://developers.poki.com/guide/sdk-overview) ·
[PokiSDK: HTML5](https://developers.poki.com/guide/sdk-html5) ·
[How testing works](https://developers.poki.com/guide/how-testing-works) ·
[Player fit test](https://developers.poki.com/guide/player-fit-test) ·
[Web fit test](https://developers.poki.com/guide/web-fit-test) ·
[Final review](https://developers.poki.com/guide/final-review) ·
[Content & player safety](https://developers.poki.com/guide/content-player-safety) ·
[External resources policy](https://developers.poki.com/guide/external-resources-policy) ·
[Game thumbnail](https://developers.poki.com/guide/game-thumbnail) ·
[Your game page](https://developers.poki.com/guide/your-game-page) ·
[How we partner with you](https://developers.poki.com/guide/revenue-deal-types) ·
[Deal Types](https://sdk.poki.com/deals) ·
[@poki/cli](https://www.npmjs.com/package/@poki/cli)
