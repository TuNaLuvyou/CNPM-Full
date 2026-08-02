<div align="center">

# 🗓️ Enterprise Calendar & Task Management

**Hệ Thống Quản Lý Lịch Cá Nhân & Nhóm — Chuẩn Kiến Trúc Doanh Nghiệp**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5+-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-REST_API-red?style=for-the-badge)](https://www.django-rest-framework.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[![Tests](https://img.shields.io/badge/Tests-47%20passing-brightgreen?style=for-the-badge&logo=checkmarx)](./calendar-backend)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions)](https://github.com/TuNaLuvyou/CNPM-Full/actions)
[![GitHub last commit](https://img.shields.io/github/last-commit/TuNaLuvyou/CNPM-Full?style=for-the-badge&color=indigo)](https://github.com/TuNaLuvyou/CNPM-Full/commits)

</div>

---

> **Đồ án môn học Công Nghệ Phần Mềm** — Xây dựng hệ thống quản lý lịch trình và công việc toàn diện theo kiến trúc **Decoupled (SPA + REST API)**, đạt chuẩn chất lượng Production-grade với bộ kiểm thử tự động 47 test cases, CI/CD pipeline và bảo mật nhiều lớp.

---

## ✨ Tính Năng Nổi Bật

### 📅 Quản Lý Lịch Trình (Calendar)
- **4 chế độ xem:** Ngày / Tuần / Tháng / Năm — chuyển đổi mượt mà.
- **Kéo & Thả (Drag & Drop):** Di chuyển sự kiện trực tiếp trên lưới thời gian.
- **Tạo nhanh:** Click vào ô trống → popup tạo sự kiện ngay lập tức.
- **Sự kiện lặp lại (Recurring Events):** Hàng ngày / Tuần / Tháng / Năm.

### 🤝 Cộng Tác & Chia Sẻ (Collaboration)
- Tìm kiếm người dùng qua email & gửi lời mời kết nối.
- Chia sẻ sự kiện với phân quyền: **Chỉ xem / Được chỉnh sửa**.
- Lịch được chấp nhận tự động đồng bộ vào lịch cá nhân người nhận.

### 🔔 Thông Báo & Nhắc Nhở (Notifications)
- Background Scheduler chạy ngầm, gửi email/in-app nhắc nhở trước `N` phút.
- Cập nhật thời gian thực khi có lời mời sự kiện, lời mời kết bạn mới.

### 🔍 Tìm Kiếm Thông Minh (Smart Search)
- Tìm kiếm toàn cục xuyên suốt Sự kiện, Công việc, Lịch hẹn, Ghi chú.
- **Jump-to Navigation:** Click kết quả → lịch tự xoay đến đúng ngày & mở popup chi tiết.

### 🛡️ Bảo Mật Nhiều Lớp (Security)
- **Email Verification:** Tài khoản mới phải xác thực qua email (Single-use UUID Token, hết hạn 5 phút).
- **Rate Limiting (DRF Throttling):** Bảo vệ tất cả Auth endpoints (`10 req/min`).
- **Password Recovery:** Link khôi phục mật khẩu bảo mật gửi qua email.
- Tài khoản không xác thực tự động bị xóa bởi APScheduler.

### 📝 Công Việc & Ghi Chú (Task & Note)
- To-do list với deadline, nhắc nhở, và bộ lọc trạng thái.
- Sticky Notes đa màu, hỗ trợ Ghim (Pin) ghi chú quan trọng.
- **Thùng rác thông minh (Soft Delete):** Khôi phục mọi nội dung đã xóa trong vòng 30 ngày.

---

## 🛠️ Tech Stack

| Layer | Công nghệ |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS v4, Vanilla CSS |
| **Backend** | Django 5+, Django REST Framework, APScheduler |
| **Database** | MySQL 8.0 (Docker), PyMySQL driver |
| **Auth** | DRF Token Authentication, UUID Email Verification |
| **Security** | ScopedRateThrottle, CORS, SSL SMTP, Single-use tokens |
| **Testing** | Django `unittest` — 47 test cases (accounts, events, tasks, notes, contacts) |
| **DevOps** | Docker Compose, GitHub Actions CI/CD |

---

## 📂 Cấu Trúc Dự Án

```text
.
├── .github/workflows/ci.yml   # CI: auto-run tests + Next.js build check
├── calendar-backend/           # Django REST API
│   ├── accounts/               # Auth: Register, Login, Email verify, Password reset
│   ├── events/                 # Events, Invitations, Notifications, Recurring
│   ├── contacts/               # Danh bạ & Kết nối bạn bè
│   ├── notes/                  # Ghi chú cá nhân
│   ├── tasks/                  # Công việc (To-do list)
│   ├── management/             # Admin Panel tùy chỉnh
│   └── core/                   # Settings, Scheduler, Pagination, Email backend
├── calendar-frontend/          # Next.js 16 Frontend
│   ├── app/                    # App Router pages
│   ├── components/             # UI Components (Calendar, Panels, Modals, Forms)
│   └── lib/                    # API Client, i18n, helpers
├── docker-compose.yml          # MySQL container (env-var based)
└── env.example                 # Mẫu cấu hình biến môi trường
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu cầu hệ thống
- **Python** ≥ 3.10 | **Node.js** ≥ 18 | **Docker & Docker Compose**

### 1. Cấu hình biến môi trường

Sao chép `env.example` → `.env` ở thư mục gốc:

```env
SECRET_KEY=your_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=cnpm_db
DB_USER=calendar
DB_PASSWORD=your_db_password
DB_HOST=127.0.0.1
DB_PORT=3306

FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000

EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_app_password
```

### 2. Khởi chạy Database (MySQL via Docker)

```bash
docker-compose up -d
```

### 3. Khởi chạy Backend (Django)

```bash
cd calendar-backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
> API: `http://localhost:8000/api/` | Admin: `http://localhost:8000/admin/`

### 4. Khởi chạy Frontend (Next.js)

```bash
cd calendar-frontend
npm install
npm run dev
```
> App: `http://localhost:3000/`

### 5. Chạy Kiểm Thử Tự Động

```bash
cd calendar-backend
python manage.py test --settings=core.test_settings
# Expected: Ran 47 tests ... OK
```

---

## 🔒 Bảo Mật & Lưu Ý
- File `.env` đã được cấu hình trong `.gitignore` — **không bao giờ commit lên GitHub**.
- Tất cả Auth endpoints được bảo vệ bởi Rate Limiter (`10 requests/phút`).
- Email SMTP sử dụng SSL đã được kích hoạt (`create_default_context`).

---

*Phát triển bởi **Nhóm 18 (BeeForce)** — Đồ án Công Nghệ Phần Mềm.*
