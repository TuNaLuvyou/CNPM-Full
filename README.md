# 🗓️ Calendar Web Application
### Hệ Thống Quản Lý Lịch Cá Nhân & Nhóm Toàn Diện

![GitHub repo size](https://img.shields.io/github/repo-size/TuNaLuvyou/CNPM-Full?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/TuNaLuvyou/CNPM-Full?style=for-the-badge)
![Project Status](https://img.shields.io/badge/Status-In--Development-yellow?style=for-the-badge)

Dự án xây dựng một hệ thống quản lý lịch trình hiện đại, hỗ trợ người dùng tối ưu hóa thời gian, tổ chức công việc và cộng tác nhóm hiệu quả. Hệ thống được thiết kế theo kiến trúc **Decoupled**, tách biệt hoàn toàn giữa Frontend và Backend nhằm đảm bảo tính linh hoạt và khả năng mở rộng.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

### **Frontend** (`calendar-frontend`)
- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **UI Logic:** [React 19](https://react.dev/)
- **Styling:** [TailwindCSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Hooks & Context API

### **Backend** (`calendar-backend`)
- **Framework:** [Django 5+](https://www.djangoproject.com/)
- **API:** [Django REST Framework (DRF)](https://www.django-rest-framework.org/)
- **Database:** SQLite (Development) / MySQL (Production)
- **Authentication:** Token-based & Session Authentication
- **CORS:** Django-cors-headers

---

## 🌟 Tính Năng Cốt Lõi

| Tính Năng | Mô Tả |
| :--- | :--- |
| **👤 Tài khoản (Accounts)** | Quản lý hồ sơ, tùy chỉnh giao diện (Dark/Light Mode), múi giờ. |
| **📅 Sự kiện & Lịch** | Tạo sự kiện, nhóm lịch, phân quyền View/Edit, mời tham gia họp. |
| **💬 Danh bạ & Kết nối** | Quản lý bạn bè, gửi tin nhắn trực tiếp trong hệ thống. |
| **✅ Công việc (Tasks)** | Danh sách To-do list cá nhân giúp theo dõi tiến độ công việc. |
| **📝 Ghi chú (Notes)** | Lưu trữ thông tin nhanh chóng, tiện lợi. |
| **🔔 Thông báo** | Hệ thống thông báo thời gian thực cho lời mời, tin nhắn và yêu cầu kết bạn. |

---

## 📂 Cấu Trúc Thư Mục

```text
.
├── calendar-backend/       # Django Backend API
│   ├── core/               # Cấu hình hệ thống (Settings, URLs)
│   ├── accounts/           # Quản lý người dùng & Profile
│   ├── events/             # Logic lịch, sự kiện & lời mời
│   ├── contacts/           # Danh bạ & Hệ thống tin nhắn
│   ├── notes/              # Quản lý ghi chú
│   ├── tasks/              # Quản lý công việc
│   └── manage.py           # CLI quản trị Django
│
├── calendar-frontend/      # Next.js Frontend
│   ├── app/                # App Router (Pages, Layouts)
│   ├── components/         # UI Components tái sử dụng
│   ├── lib/                # API client & Helper functions
│   └── public/             # Tài nguyên tĩnh (Images, Fonts)
│
└── docker-compose.yml      # Cấu hình triển khai Container (Đang phát triển)
```

---

## 🛠 Hướng Dẫn Cài Đặt

### 1. Backend (Django)
```bash
cd calendar-backend
# Tạo và kích hoạt môi trường ảo
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi tạo database
python manage.py migrate
python manage.py runserver
```
API sẽ khả dụng tại: `http://localhost:8000/`

### 2. Frontend (Next.js)
```bash
cd calendar-frontend
# Cài đặt dependencies
npm install

# Khởi chạy server phát triển
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000/`

### 3. Chạy với Docker (Khuyên dùng)

Hệ thống đã được cấu hình sẵn Docker để việc triển khai trở nên dễ dàng hơn:

**Chạy Database (MySQL):**
```bash
docker-compose up -d
```

**Chạy toàn bộ hệ thống (Full Stack):**
Nếu bạn muốn chạy cả Backend và Frontend trong container, bạn có thể sử dụng Dockerfile đã được tạo sẵn trong từng thư mục:
- **Backend**: `cd calendar-backend && docker build -t cnpm-backend .`
- **Frontend**: `cd calendar-frontend && docker build -t cnpm-frontend .`

*Lưu ý: Bạn có thể tự cấu hình thêm file `docker-compose` để liên kết các image này nếu cần thiết.*

---

## 🔒 Bảo Mật & Lưu Ý
- Không chia sẻ file `.env` lên repository.
- Luôn sử dụng môi trường ảo khi phát triển backend.
- Đảm bảo `CORS_ALLOWED_ORIGINS` trong Django được cấu hình đúng cho domain frontend.

---

## 🗺 Lộ Trình Phát Triển (Roadmap)
- [x] Xây dựng kiến trúc nền tảng.
- [x] Hoàn thiện các module cơ bản (Events, Tasks, Notes).
- [/] Tích hợp Real-time Notifications.
- [ ] Triển khai Docker hóa toàn bộ hệ thống.
- [ ] Chuyển đổi sang MySQL cho môi trường Production.

---
*Phát triển bởi Nhóm 18 (BeeForce) đồ án môn Công Nghệ Phần Mềm.*
