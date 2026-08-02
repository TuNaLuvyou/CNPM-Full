# 🗓️ Enterprise Calendar & Task Management Web Application
### Hệ Thống Quản Lý Lịch Cá Nhân & Nhóm Toàn Diện (Decoupled Architecture)

![GitHub repo size](https://img.shields.io/github/repo-size/TuNaLuvyou/CNPM-Full?style=for-the-badge&color=blue)
![GitHub last commit](https://img.shields.io/github/last-commit/TuNaLuvyou/CNPM-Full?style=for-the-badge&color=indigo)
![Project Status](https://img.shields.io/badge/Status-Completed--Features-green?style=for-the-badge)

Hệ thống quản lý lịch trình và công việc cao cấp, được thiết kế theo kiến trúc tách biệt (**Decoupled**) hoàn toàn giữa Frontend (Next.js) và Backend (Django REST Framework). Ứng dụng mang lại trải nghiệm tối ưu hóa thời gian biểu, tương tác mượt mà thông qua kéo thả thời gian thực, quản lý danh bạ, và chia sẻ lịch nhóm tiện lợi.

---

## 🌟 Tính Năng Nổi Bật

### 1. 📅 Quản Lý Lịch Trình Linh Hoạt (Calendar Management)
*   **Đa dạng chế độ xem:** Hỗ trợ xem lịch theo Ngày (Day), Tuần (Week), Tháng (Month), và Năm (Year).
*   **Thao tác Kéo - Thả (Drag & Drop):** Thay đổi thời gian sự kiện cực kỳ mượt mà chỉ bằng thao tác kéo thả trực quan trên lưới thời gian (TimeGrid).
*   **Tạo sự kiện siêu tốc:** Click trực tiếp vào ô thời gian trống trên lịch để tạo popup thêm mới sự kiện/lịch hẹn. Tự động dọn dẹp các sự kiện "nháp" (ghost events) khi hủy thao tác.
*   **Sự kiện lặp lại (Recurring Events):** Hỗ trợ thiết lập lịch lặp lại hàng ngày, hàng tuần, hàng tháng hoặc hàng năm.

### 2. 📝 Quản Lý Công Việc & Ghi Chú (Task & Note Management)
*   **To-do List:** Quản lý danh sách công việc theo trạng thái (Chờ xử lý, Đang làm, Đã hoàn thành). Thiết lập deadline và thời gian nhắc nhở cụ thể.
*   **Ghi chú (Sticky Notes):** Lưu trữ ý tưởng nhanh chóng dưới dạng các thẻ ghi chú đa sắc màu. Hỗ trợ "Ghim" (Pin) các ghi chú quan trọng lên đầu.
*   **Thùng rác an toàn (Soft Delete):** Xóa nhầm? Không sao! Mọi sự kiện, công việc, và ghi chú bị xóa đều được lưu tạm trong Thùng rác và có thể khôi phục dễ dàng trong vòng 30 ngày trước khi bị xóa vĩnh viễn.

### 3. 🤝 Cộng Tác & Kết Nối Mạng Lưới (Collaboration & Networking)
*   **Quản lý danh bạ:** Tìm kiếm người dùng trong hệ thống qua email và gửi lời mời kết bạn/kết nối.
*   **Chia sẻ sự kiện:** Gửi lời mời tham gia cuộc hẹn, sự kiện đến bạn bè trong danh bạ. Người nhận có quyền Chấp nhận (Accept) hoặc Từ chối (Decline).
*   **Đồng bộ lịch nhóm:** Sự kiện được chấp nhận sẽ tự động đồng bộ vào lịch cá nhân của người được mời. Hỗ trợ phân quyền (Chỉ xem / Được chỉnh sửa) cho từng khách mời.

### 4. 🔔 Hệ Thống Thông Báo & Nhắc Nhở Tự Động (Notifications)
*   **Nhắc nhở đa kênh:** Nhận thông báo nhắc việc sắp tới qua giao diện ứng dụng (In-app) hoặc qua Email.
*   **Background Scheduler:** Hệ thống chạy ngầm tự động quét và gửi thông báo nhắc nhở chính xác theo thời gian người dùng đã cài đặt (ví dụ: nhắc trước 15 phút, 30 phút).
*   **Thông báo thời gian thực:** Cập nhật ngay lập tức khi có lời mời kết bạn mới, lời mời sự kiện hoặc khi có thay đổi trạng thái tham gia.

### 5. 🔍 Bộ Máy Tìm Kiếm & Điều Hướng Thông Minh (Smart Search)
*   **Tìm kiếm toàn cục:** Lọc nhanh chóng tất cả Sự kiện, Công việc, Lịch hẹn và Liên hệ ngay từ thanh tìm kiếm trên Header.
*   **Jump-to Navigation:** Click vào kết quả tìm kiếm, hệ thống lập tức tự động "xoay" lịch đến đúng ngày diễn ra sự kiện đó và mở sẵn Popup chi tiết để bạn thao tác.

### 6. 🛡️ Bảo Mật & Xác Thực Nâng Cao (Advanced Security)
*   **Xác thực Email tự động (SMTP):** Người dùng mới bắt buộc phải kích hoạt tài khoản qua link gửi về email. Link có cấu trúc bảo mật mã hóa một lần (Single-use Token) và tự động hết hạn sau 5 phút. Tài khoản rác tự động bị xóa nếu không xác thực.
*   **Khôi phục mật khẩu an toàn:** Yêu cầu đổi mật khẩu tự động gửi link bảo mật qua email, ngăn chặn rủi ro bị đánh cắp tài khoản.
*   **Glassmorphism Blocker:** Bảo vệ giao diện chính bằng một lớp kính mờ khóa tương tác đối với những người dùng chưa đăng nhập, vừa đảm bảo an toàn vừa mang lại vẻ đẹp thẩm mỹ cao.

### 7. ⚙️ Cá Nhân Hóa Trải Nghiệm (Personalization)
*   **Tùy biến Giao diện:** Hỗ trợ chế độ Sáng (Light) / Tối (Dark) / Theo hệ thống.
*   **Cấu hình Khu vực:** Tùy chỉnh ngôn ngữ (Việt/Anh), định dạng ngày/giờ (12h/24h), ngày bắt đầu tuần (Thứ Hai/Chủ Nhật).
*   **Tùy chỉnh Múi giờ:** Hỗ trợ cấu hình múi giờ chính và phụ, tự động quy đổi thời gian sự kiện theo múi giờ địa phương của từng cá nhân.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

### **Frontend** (`calendar-frontend`)
*   **Core:** [Next.js 16](https://nextjs.org/) (App Router & Dynamic Render Routing)
*   **UI Logic:** [React 19](https://react.dev/) với các kỹ thuật State Management tối tân
*   **Styling:** [TailwindCSS v4](https://tailwindcss.com/) & Vanilla CSS cho hiệu ứng Glassmorphism sang trọng
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **API Client:** Fetch API tối ưu hóa tích hợp xác thực Token.

### **Backend** (`calendar-backend`)
*   **Framework:** [Django 5+](https://www.djangoproject.com/) & [Django REST Framework (DRF)](https://www.django-rest-framework.org/)
*   **Database Setup:** MySQL với pure-python driver `PyMySQL` (giải quyết lỗi biên dịch C-extension trên macOS)
*   **Mail Engine:** Thiết lập SMTP tự động gửi email xác thực qua hệ thống mail PTIT (`@student.ptithcm.edu.vn`)
*   **Background Jobs:** Sử dụng `apscheduler` để tự động lên lịch gửi email nhắc nhở.
*   **Security:** Xác thực Token-based, phân quyền người dùng và kiểm tra tính hợp lệ của token dùng một lần. Tích hợp `UnverifiedSSLEmailBackend` giải quyết lỗi chứng chỉ SSL trên macOS.

---

## 📂 Cấu Trúc Thư Mục

```text
.
├── calendar-backend/       # Django Backend API
│   ├── core/               # Cấu hình hệ thống (Settings, Custom Email Backend, URLs)
│   ├── accounts/           # Quản lý tài khoản, đổi mật khẩu tự động & Profile
│   ├── events/             # Logic lịch, sự kiện, phân quyền & lời mời
│   ├── contacts/           # Quản lý liên kết & Danh bạ
│   ├── notes/              # Quản lý ghi chú cá nhân
│   ├── tasks/              # Quản lý công việc (To-do list)
│   └── manage.py           # CLI quản trị Django
│
├── calendar-frontend/      # Next.js Frontend
│   ├── app/                # App Router (Trang chủ, Reset mật khẩu)
│   ├── components/         # UI Components (Lịch trình, Popup, Thanh tìm kiếm)
│   ├── lib/                # API Client & Helper Logic hiển thị lịch
│   └── public/             # Assets tĩnh
│
├── .gitignore              # Bộ lọc Git chuẩn hóa dự án
├── .env                    # Biến môi trường hệ thống
├── env.example             # File mẫu hướng dẫn cài đặt biến môi trường
└── docker-compose.yml      # Cấu hình Container Database (MySQL)
```

---

## 🛠 Hướng Dẫn Cài Đặt Nhanh

### 1. Cấu hình biến môi trường (`.env`)
Sao chép nội dung từ `env.example` vào file `.env` ở thư mục gốc và nhập các khóa cấu hình bảo mật:
```ini
# Database Config
DB_NAME=cnpm_db
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3306

# Email Config (SMTP)
EMAIL_HOST_USER=youremail
EMAIL_HOST_PASSWORD=yourpassword
```

### 2. Khởi chạy Backend (Django)
```bash
cd calendar-backend
# Kích hoạt môi trường ảo
source venv/bin/activate
# Cài đặt thư viện (Đã cập nhật PyMySQL tránh lỗi compile C-extensions)
pip install -r requirements.txt
# Chạy Migrations và khởi động server
python manage.py migrate
python manage.py runserver
```
API hoạt động tại: `http://localhost:8000/`

**Tạo tài khoản admin quản trị tối cao:**
```bash
python manage.py createsuperuser
```

### 3. Khởi chạy Frontend (Next.js)
```bash
cd calendar-frontend
npm install
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000/`

---

## 🔒 Quy Tắc Phát Triển & Bảo Mật
1. **Tuyệt đối không push file `.env` lên Github** (Đã được cấu hình chặn tự động trong `.gitignore`).
2. Khi phát triển trên macOS, hệ thống tự động bypass qua cơ chế SSL không tin cậy của SMTP để gửi mail thành công, không cần cấu hình thêm chứng chỉ hệ thống.

---
*Phát triển bởi Nhóm 18 (BeeForce) - Đồ án môn học Công Nghệ Phần Mềm.*
