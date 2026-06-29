# 🗓️ Enterprise Calendar & Task Management Web Application
### Hệ Thống Quản Lý Lịch Cá Nhân & Nhóm Toàn Diện (Decoupled Architecture)

![GitHub repo size](https://img.shields.io/github/repo-size/TuNaLuvyou/CNPM-Full?style=for-the-badge&color=blue)
![GitHub last commit](https://img.shields.io/github/last-commit/TuNaLuvyou/CNPM-Full?style=for-the-badge&color=indigo)
![Project Status](https://img.shields.io/badge/Status-Completed--Features-green?style=for-the-badge)

Hệ thống quản lý lịch trình và công việc cao cấp, được thiết kế theo kiến trúc tách biệt (**Decoupled**) hoàn toàn giữa Frontend (Next.js) và Backend (Django REST Framework). Ứng dụng mang lại trải nghiệm tối ưu hóa thời gian biểu, tương tác mượt mà thông qua kéo thả thời gian thực, quản lý danh bạ, và chia sẻ lịch nhóm tiện lợi.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

### **Frontend** (`calendar-frontend`)
*   **Core:** [Next.js 15+](https://nextjs.org/) (App Router & Dynamic Render Routing)
*   **UI Logic:** [React 19](https://react.dev/) với các kỹ thuật State Management tối tân
*   **Styling:** [TailwindCSS v4](https://tailwindcss.com/) & Vanilla CSS cho hiệu ứng Glassmorphism sang trọng
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Build Optimization:** Tránh bẫy Hydration SSR và tối ưu tải dữ liệu

### **Backend** (`calendar-backend`)
*   **Framework:** [Django 5+](https://www.djangoproject.com/) & [Django REST Framework (DRF)](https://www.django-rest-framework.org/)
*   **Database Setup:** SQLite (Development) / MySQL với pure-python driver `PyMySQL` (giải quyết lỗi biên dịch C-extension trên macOS)
*   **Mail Engine:** Thiết lập SMTP tự động gửi email xác thực qua hệ thống mail PTIT
*   **Security:** Xác thực Token & Session, phân quyền người dùng và kiểm tra tính hợp lệ của token dùng một lần
*   **CORS:** Django-cors-headers tùy biến cao

---

## 🌟 Tính Năng Cao Cấp Mới Nâng Cấp

### 1. 🔍 Bộ Máy Tìm Kiếm Thông Minh (Search Engine)
*   **Tìm kiếm thời gian thực**: Lọc nhanh tất cả các Sự kiện (Events), Lịch hẹn (Appointments), và Công việc (Tasks) từ thanh tiêu đề.
*   **Hành động kích hoạt**: Nhập từ khóa và nhấn **Enter** để hiển thị bảng kết quả phân loại đẹp mắt bằng icon riêng biệt.
*   **Điều hướng thông minh (Jump-to)**: Click vào bất kỳ kết quả tìm kiếm nào sẽ lập tức xoay lịch trình đến đúng ngày đó, chuyển sang chế độ xem **Ngày (`Day View`)**, và **tự động mở luôn popup** chi tiết để bạn chỉnh sửa hoặc xem ngay lập tức.

### 2. 📧 Đổi Mật Khẩu Tự Động & Xác Thực Email SMTP
*   **Quy trình khép kín**: Người dùng yêu cầu khôi phục mật khẩu sẽ nhận được email chứa liên kết an toàn gửi trực tiếp qua hệ thống SMTP Gmail (`@student.ptithcm.edu.vn`).
*   **Bảo mật tối cao**: 
    *   Liên kết reset có hiệu lực **độc bản (chỉ dùng được một lần duy nhất)** và tự động hết hạn sau **5 phút**.
    *   Trang `/reset-password` tự động xác thực token với Backend ngay khi load trang. Nếu link đã quá hạn hoặc đã được sử dụng trước đó, form nhập sẽ bị khóa hoàn toàn và hiển thị cảnh báo lỗi bảo mật màu đỏ tinh tế.
*   **Bypass SSL trên macOS**: Tích hợp lớp `UnverifiedSSLEmailBackend` giải quyết triệt để lỗi chứng chỉ SSL `CERTIFICATE_VERIFY_FAILED` phổ biến trên môi trường macOS.

### 3. 🛡️ Tường Bảo Mật Cho Người Dùng Chưa Đăng Nhập
*   Giao diện lịch chính vẫn hiển thị tinh tế phía sau nhưng được bảo vệ bởi lớp kính mờ **Glassmorphism Blocker**. 
*   Bất kỳ hành động tương tác nào (click vào grid, nút tạo mới...) sẽ lập tức mở hộp thoại Đăng nhập (`AuthModal`) cùng thông báo nhắc nhở thân thiện.

### 4. ⚡ Nâng Cấp Trải Nghiệm Grid (UX Grid Enhancements)
*   **Đóng & tạo siêu tốc**: Khi đang mở Modal tạo sự kiện, nếu bạn click sang một vị trí trống khác, Modal cũ sẽ tự động đóng lại và tạo ngay preview sự kiện tại vị trí mới (không cần tắt Modal thủ công).
*   **Xử lý mượt mà sự kiện kéo thả (Drag & Drop Refinement)**: Ngăn chặn hoàn toàn lỗi dính chuột (sticky drag) khi kéo sự kiện vượt ra ngoài giao diện lưới hoặc thả sai mục tiêu, đảm bảo mọi thao tác kéo thả luôn được xử lý và dọn dẹp sạch sẽ trạng thái.
*   **Chỉnh sửa đa kích thước chính xác**: Giữ nguyên thông số chiều cao sự kiện nháp (ghost event) khi người dùng click vào để tiếp tục chỉnh sửa, thay vì tự động thu nhỏ về 1 giờ, giúp thiết lập linh hoạt các sự kiện dài hạn.
*   **Làm sạch giao diện tự động (Ghost Cleanup)**: Khi tạo sự kiện thành công hoặc nhấn hủy, thẻ sự kiện nháp (previewEvent) và tọa độ vị trí click cũ sẽ lập tức biến mất khỏi lưới, tránh tình trạng lỗi giao diện (bị đè thẻ) hoặc popup hiển thị sai vị trí.
*   **Coordinate Fallbacks**: Khắc phục lỗi kéo thả khi click vào các ô trống trên lưới để không xảy ra hiện tượng Crash giao diện.
*   **Hydration Mismatch Fixed**: Khắc phục triệt để lỗi Hydration Next.js ở chế độ SSR.

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
├── .gitignore              # Bộ lọc Git chuẩn hóa dự án (Đã bổ sung đầy đủ)
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
EMAIL_HOST_USER=n23dccn009@student.ptithcm.edu.vn
EMAIL_HOST_PASSWORD=ysdxjwcgvixtrava
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
1. **Tuyệt đối không push file `.env` lên Github** (Đã được cấu hình chặn tự động trong `.gitignore` mới).
2. Khi phát triển trên macOS, hệ thống tự động bypass qua cơ chế SSL không tin cậy của SMTP để gửi mail thành công, không cần cấu hình thêm chứng chỉ hệ thống.

---
*Phát triển bởi Nhóm 18 (BeeForce) - Đồ án môn học Công Nghệ Phần Mềm.*
