# Shadow Speak - Tiện ích hỗ trợ Shadowing trên YouTube 🎧

Shadow Speak là một tiện ích Chrome (Chrome Extension) mạnh mẽ được thiết kế dành riêng cho người học tiếng Anh theo phương pháp **Shadowing** (Kỹ thuật cái bóng). Nó biến phụ đề YouTube thông thường thành công cụ học tập tương tác, cho phép bạn tra từ, nghe phát âm và xem ví dụ ngay lập tức mà không cần dừng video.

## ✨ Tính Năng Nổi Bật

*   **⚡ Phụ đề Tương tác**: Biến mọi từ trong phụ đề YouTube thành các phần tử có thể click được.
*   **👆 Tra từ Một chạm**: Click vào bất kỳ từ nào để xem Nghĩa Tiếng Việt, Phiên âm (IPA) và Câu ví dụ.
*   **🔊 Phát âm Tức thì**: Âm thanh đọc mẫu giọng Anh-Mỹ chuẩn (Native US English) tự động phát ngay khi click.
*   **🛡️ Cơ chế Dịch Thông minh**: Sử dụng hệ thống kép (Google Translate + MyMemory Backup) đảm bảo luôn trả về kết quả dịch ngay cả khi một dịch vụ bị gián đoạn.
*   **🧠 Giao diện Thông minh**: Tooltip hiển thị khi bạn cần và tự động ẩn đi sau 1 giây khi bạn rời chuột, giữ cho màn hình luôn thoáng đãng.
*   **🕶️ Giao diện Tự nhiên**: Tích hợp trực tiếp vào dòng phụ đề gốc của YouTube, không tạo khung đen che chắn video.

## 🚀 Hướng Dẫn Cài Đặt

Vì đây là phiên bản đang phát triển (Developer Version), hãy làm theo các bước sau để cài đặt:

1.  Mở Chrome và truy cập đường dẫn: `chrome://extensions/`.
2.  Bật chế độ **Developer mode** (Công tắc ở góc trên bên phải).
3.  Bấm nút **Load unpacked** (Tải tiện ích đã giải nén) ở góc trên bên trái.
4.  Chọn thư mục chứa project này: `c:\Ngọc\ExtensionTranslation`.
5.  Tiện ích "Shadow Speak" sẽ xuất hiện trong danh sách của bạn!

## 📖 Cách Sử Dụng

1.  Mở bất kỳ video **YouTube** nào.
2.  **Bật Phụ đề (CC)**: Bấm nút **CC** trên trình phát video. *Lưu ý: Tiện ích chỉ hoạt động khi nút CC được bật.*
3.  **Di chuột & Tương tác**:
    *   Di chuột vào phụ đề: Bạn sẽ thấy từng từ sáng lên.
    *   **Click chuột trái**: Một bảng nhỏ (tooltip) sẽ hiện ra chứa nghĩa, phiên âm và ví dụ.
    *   **Nghe**: Từ vựng sẽ được tự động phát âm. Bạn cũng có thể bấm vào icon loa 🔊 trong bảng để nghe lại.
4.  **Luyện tập**: Hãy đọc to theo video, và chỉ click vào từ khi bạn thực sự cần tra cứu!

## 🔧 Khắc Phục Lỗi Thường Gặp

*   **Hiện thông báo "Vui lòng bật nút CC..." / Không click được?**
    *   Hãy chắc chắn bạn đã bấm nút **CC** trên thanh điều khiển của YouTube.
    *   Video phải có phụ đề dạng văn bản (Soft Subs). Các video có phụ đề "cứng" (in chết vào hình ảnh) sẽ không hoạt động.
*   **Báo "Lỗi dịch"?**
    *   Thường do Google tạm thời chặn IP nếu click quá nhanh.
    *   Đừng lo, hệ thống sẽ tự động chuyển sang server dự phòng (MyMemory) ngay lập tức. Hãy thử lại sau vài giây.
*   **Thay đổi code nhưng không thấy cập nhật?**
    *   Vào `chrome://extensions/`, bấm nút reload 🔄 ở thẻ Shadow Speak, sau đó **F5 (Tải lại)** trang YouTube.

## 🛠️ Công Nghệ Sử Dụng

*   **Manifest V3**: Tiêu chuẩn Extension mới nhất của Chrome.
*   **Vanilla JS**: Không dùng thư viện nặng, tối ưu hóa tốc độ xử lý DOM.
*   **APIs**:
    *   Google Translate (Endpoint Clients5 - Ổn định).
    *   MyMemory API (Dự phòng).
    *   Free Dictionary API (Lấy phiên âm/Ví dụ).

---
*Chúc bạn học tốt!* 🚀
