# Calendar Web Application (Hệ Thống Quản Lý Lịch Cá Nhân & Nhóm)

Dự án xây dựng một hệ thống quản lý lịch trình toàn diện, hỗ trợ người dùng tổ chức công việc, lên lịch hẹn, quản lý ghi chú, sổ liên lạc cá nhân, và chia sẻ nhóm lịch làm việc.

Hệ thống được phát triển theo kiến trúc **Decoupled (Tách biệt Frontend và Backend)**.

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

### **Frontend (`calendar-frontend`)**
- **Framework:** Next.js 16 (App Router)
- **UI/Thư viện:** React 19, TailwindCSS v4, Lucide React (Icons)
- **Ngôn ngữ:** JavaScript

### **Backend (`calendar-backend`)**
- **Framework:** Django (Python)
- **API:** Django REST Framework (DRF)
- **Cơ sở dữ liệu:** SQLite (Dành cho môi trường phát triển hiện tại) / MySQL (Dự kiến cho Production)
- **Xác thực:** Token-based Authentication & Session

---

## 🌟 Tính Năng Cốt Lõi

- **Tài khoản (Accounts):** Quản lý hồ sơ, giao diện sáng/tối (theme), cài đặt múi giờ, hiển thị lịch yêu thích.
- **Sự kiện & Lịch (Events):** Tạo sự kiện, tạo nhóm lịch, phân quyền chia sẻ lịch (View/Edit) cho người dùng khác, mời tham gia cuộc họp.
- **Danh bạ & Nhắn tin (Contacts):** Quản lý bạn bè (Connections), gửi tin nhắn trao đổi trong mạng lưới.
- **Công việc (Tasks):** Lên danh sách công việc cần làm (To-do list).
- **Ghi chú (Notes):** Ghi chép thông tin cá nhân.
- **Hệ thống thông báo:** Nhận thông báo lời mời sự kiện, tin nhắn mới, yêu cầu kết bạn.

---

## 📂 Cấu Trúc Thư Mục

```text
CongNghePhanMem/
├── calendar-backend/       # Mã nguồn Backend API (Django)
│   ├── core/               # Cấu hình chính của project
│   ├── accounts/           # App quản lý cấu hình user
│   ├── contacts/           # App quản lý danh bạ, tin nhắn
│   ├── events/             # App quản lý lịch, sự kiện, lời mời
│   ├── notes/              # App quản lý ghi chú
│   ├── tasks/              # App quản lý công việc
│   ├── management/         # App quản trị hệ thống
│   └── manage.py           # Script khởi chạy backend
│
├── calendar-frontend/      # Mã nguồn Frontend (Next.js)
│   ├── app/                # Cấu trúc trang (App Router)
│   ├── components/         # Reusable UI components
│   ├── lib/                # Cấu hình API, Utilities
│   └── package.json        # Dependencies frontend
```

---

## 🛠 Hướng Dẫn Cài Đặt Và Khởi Chạy

Bạn cần mở 2 terminal để chạy song song Frontend và Backend.

### 1. Khởi chạy Backend (Django)

Mở terminal, di chuyển vào thư mục `calendar-backend`:

```bash
cd calendar-backend

# (Tùy chọn) Kích hoạt môi trường ảo (Virtual Environment) nếu bạn đã cài đặt
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Cài đặt thư viện (nếu có requirements.txt, hoặc cài thủ công pip install django djangorestframework django-cors-headers)

# Chạy migrations để khởi tạo CSDL SQLite
python manage.py migrate

# Khởi chạy server API (Mặc định chạy ở cổng 8000)
python manage.py runserver
```
API sẽ chạy tại địa chỉ: `http://localhost:8000/`

### 2. Khởi chạy Frontend (Next.js)

Mở một terminal khác, di chuyển vào thư mục `calendar-frontend`:

```bash
cd calendar-frontend

# Cài đặt dependencies
npm install

# Khởi chạy môi trường phát triển (Development server)
npm run dev
```
Trang web sẽ hiển thị tại: `http://localhost:3000/`

### 3. Lưu ý về Cơ sở dữ liệu

Dự án hiện đang sử dụng **SQLite** làm mặc định để tiện cho quá trình phát triển và demo. Khi chốt chương trình để đưa lên môi trường chính thức (Production), hệ thống sẽ được chuyển đổi sang sử dụng **MySQL**. Các cấu hình chi tiết về MySQL sẽ được cập nhật sau.
