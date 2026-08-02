# Agent Context — CNPM-Full: Enterprise Calendar & Task Management

## 1. Tổng Quan Dự Án

**Tên dự án:** Enterprise Calendar & Task Management System  
**Tên nhóm:** Nhóm 18 — BeeForce  
**Loại:** Đồ án môn Công Nghệ Phần Mềm — kiến trúc Decoupled SPA + REST API  
**Repository:** `TuNaLuvyou/CNPM-Full`

Hệ thống quản lý lịch trình và công việc cá nhân/nhóm, bao gồm: quản lý sự kiện, công việc, ghi chú, danh bạ, thông báo, và chia sẻ lịch cộng tác.

---

## 2. Tech Stack

| Layer | Công nghệ |
|---|---|
| **Frontend** | Next.js 16.2.3 (App Router), React 19, TailwindCSS v4, Vanilla CSS, Lucide React |
| **Backend** | Django 6.0.5, Django REST Framework 3.17.1, APScheduler 3.11.2 |
| **Database** | PostgreSQL 16 (Docker local) hoặc Supabase Cloud |
| **DB Driver** | psycopg2-binary |
| **Auth** | DRF Token Authentication (`Authorization: Token <token>`) lưu trong `localStorage` |
| **Security** | ScopedRateThrottle (10 req/min auth), CORS headers, SSL SMTP, Single-use UUID tokens |
| **Testing** | Django `unittest` — 47 test cases, SQLite in-memory (`core.test_settings`) |
| **DevOps** | Docker Compose (PostgreSQL container), GitHub Actions CI/CD |
| **Email** | Gmail SMTP TLS, custom `UnverifiedSSLEmailBackend` |
| **i18n** | Hỗ trợ đa ngôn ngữ qua `lib/i18n.js` |

---

## 3. Cấu Trúc Thư Mục

```text
CNPM-Full/
├── .github/workflows/ci.yml          # CI: chạy 47 tests + Next.js build check
├── docker-compose.yml                # PostgreSQL 16 container
├── .env                              # Biến môi trường root (gitignored)
├── env.example                       # Mẫu .env root (legacy, ưu tiên dùng calendar-backend/env.example)
│
├── calendar-backend/                 # Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile                    # python:3.11-slim + libpq-dev
│   ├── core/                         # Django project config
│   │   ├── settings.py               # Cấu hình chính (DB, CORS, DRF, Email, Logging)
│   │   ├── test_settings.py          # Override: SQLite in-memory, tắt throttle, tắt email
│   │   ├── scheduler.py              # APScheduler: dọn tài khoản chưa xác thực, nhắc sự kiện
│   │   ├── urls.py                   # Root URL: /api/events/, /api/tasks/, /api/notes/, /api/contacts/, /api/accounts/
│   │   ├── pagination.py             # OptionalPageNumberPagination
│   │   └── email_backend.py          # UnverifiedSSLEmailBackend (bỏ qua SSL verify)
│   ├── accounts/                     # Auth app
│   │   ├── models.py                 # UserSettings, UserFavoriteCalendar, EmailVerificationToken
│   │   ├── serializers.py            # LoginSerializer (by email), RegisterSerializer, ProfileUpdateSerializer, UserSettingsSerializer
│   │   ├── views.py                  # Register, Login, Logout, Me, ForgotPw, ResetPw, VerifyEmail, Settings, Profile, FavoriteCalendars
│   │   └── urls.py                   # 13 endpoints accounts
│   ├── events/                       # Sự kiện & lịch app
│   │   ├── models.py                 # CalendarGroup, CalendarShare, Event, EventInvitation, Notification, ReminderPreference
│   │   ├── serializers.py            # EventSerializer, InvitationSerializer, NotificationSerializer, ...
│   │   ├── views.py                  # EventViewSet, InvitationViewSet, NotificationViewSet, CalendarGroupViewSet, ReminderPreferenceViewSet
│   │   ├── scheduler.py              # send_event_reminders() job
│   │   └── email_service.py          # Gửi email nhắc nhở sự kiện
│   ├── tasks/                        # To-do list app
│   │   ├── models.py                 # Task model (với soft-delete, deadline, reminder)
│   │   ├── views.py                  # TaskViewSet: toggle, trash, restore, permanent_delete
│   │   └── urls.py
│   ├── notes/                        # Ghi chú (Google Keep-style) app
│   │   ├── models.py                 # Note model (pin, color, soft-delete)
│   │   ├── views.py                  # NoteViewSet: toggle_pin
│   │   └── urls.py
│   ├── contacts/                     # Danh bạ & kết nối bạn bè app
│   │   ├── models.py                 # Contact, Connection model
│   │   ├── views.py                  # ConnectionViewSet: friends, invitations, accept, decline, block, toggle_pin
│   │   └── urls.py
│   └── management/                   # Custom Admin Panel app
│       ├── models.py                 # SupportRequest model
│       ├── views.py                  # Admin dashboard, SubmitSupportRequestView
│       └── urls.py                   # /admin/ (custom), /api/support/submit/
│
└── calendar-frontend/                # Next.js 16 Frontend
    ├── app/
    │   ├── layout.js                 # Root layout + ThemeProvider
    │   ├── page.js                   # SPA chính — toàn bộ state & UI logic (~52KB, single-page)
    │   ├── verify-email/             # Trang xác thực email
    │   └── reset-password/           # Trang đặt lại mật khẩu
    ├── components/
    │   ├── ThemeProvider.jsx         # Context provider cho theme (light/dark/system)
    │   ├── calendar/
    │   │   ├── CalendarHeader.jsx    # Thanh điều hướng tháng/ngày + nút tạo sự kiện
    │   │   ├── EventBlock.jsx        # Block hiển thị sự kiện trên grid
    │   │   ├── TimeGrid.jsx          # Grid thời gian ngày/tuần (dùng cho DayView & WeekView)
    │   │   ├── time_grid/            # Sub-components của TimeGrid
    │   │   └── views/
    │   │       ├── DayView.jsx       # Chế độ xem ngày
    │   │       ├── WeekView.jsx      # Chế độ xem tuần
    │   │       ├── MonthView.jsx     # Chế độ xem tháng (có Drag & Drop)
    │   │       └── YearView.jsx      # Chế độ xem năm
    │   ├── modals/
    │   │   ├── AuthModal.jsx         # Modal Đăng nhập / Đăng ký / Quên mật khẩu
    │   │   ├── CreateEventModal.jsx  # Modal tạo nhanh sự kiện (click vào ô trống)
    │   │   ├── ProfileModal.jsx      # Modal xem & chỉnh sửa hồ sơ
    │   │   ├── SettingsModal.jsx     # Modal cài đặt người dùng (7 nhóm)
    │   │   ├── TrashModal.jsx        # Modal thùng rác (Events, Tasks, Notes)
    │   │   ├── create_event/         # Sub-forms của CreateEventModal
    │   │   └── setting/              # Sub-panels của SettingsModal
    │   ├── forms/
    │   │   ├── EventForm.jsx         # Form chi tiết sự kiện (full)
    │   │   ├── AppointmentForm.jsx   # Form lịch hẹn
    │   │   ├── TaskForm.jsx          # Form công việc
    │   │   └── FormHelpers.jsx       # Shared form utilities
    │   ├── panels/
    │   │   ├── TasksPanel.jsx        # Right sidebar: danh sách Tasks
    │   │   ├── KeepPanel.jsx         # Right sidebar: danh sách Notes (sticky notes)
    │   │   ├── ContactsPanel.jsx     # Right sidebar: danh bạ & kết nối
    │   │   └── MapsPanel.jsx         # Right sidebar: Google Maps embed
    │   ├── layout/
    │   │   ├── MainLayout.jsx        # Bố cục chính (header + content + sidebar)
    │   │   ├── Header/               # Thanh header (search, notifications, user menu)
    │   │   └── RightSidebar/        # Sidebar phải (mini-calendar + panel switcher)
    │   ├── ui/                       # Shared UI primitives (Button, Input, Badge, ...)
    │   └── widgets/                  # Các widget nhỏ (DatePicker, ColorPicker, ...)
    └── lib/
        ├── api.js                    # API client (fetch wrapper + tất cả API calls)
        ├── CalendarHelper.js         # Utility functions: tính ngày, tuần, tháng, recurrence
        ├── holidays.js               # Dữ liệu lễ/tết Việt Nam & quốc tế
        └── i18n.js                   # Đa ngôn ngữ (vi/en), date/time format helpers
```

---

## 4. Kiến Trúc & Luồng Dữ Liệu

### Authentication Flow
1. Frontend gửi `POST /api/accounts/register/` → Backend tạo user (`is_active=False`), gửi email verification.
2. User click link → `GET /api/accounts/verify-email/?token=<uuid>` → `is_active=True`.
3. Frontend gửi `POST /api/accounts/login/` với `{ email, password }` → nhận `{ token, user }`.
4. Token lưu vào `localStorage['token']`, gắn vào mọi request: `Authorization: Token <token>`.
5. Mọi API endpoint (trừ auth endpoints) đều yêu cầu token.

### State Management (Frontend)
- **Không dùng Redux/Zustand** — toàn bộ state quản lý bằng React `useState`/`useEffect` trong `app/page.js` (SPA chính).
- State chính: `user`, `events`, `tasks`, `notes`, `connections`, `notifications`, `settings`, `currentView`, `currentDate`.

### API Pattern (`lib/api.js`)
- Base URL: `process.env.NEXT_PUBLIC_API_URL` hoặc `http://localhost:8000/api`
- Helper `request(path, options)`: tự động gắn token, xử lý lỗi DRF format, trả về `null` cho `204 No Content`.
- **snake_case ↔ camelCase mapping:** `getSettings()` và `updateSettings()` tự map giữa backend snake_case và frontend camelCase.

### Background Jobs (APScheduler)
- Chạy ngầm khi Django khởi động (`core/scheduler.py` + `events/scheduler.py`).
- **Job 1:** Quét & xoá tài khoản chưa verify email mỗi 1 phút.
- **Job 2:** Gửi nhắc nhở sự kiện qua email/in-app trước `N` phút (theo `ReminderPreference` của user).

---

## 5. Database Schema Chính

### `accounts` app
| Model | Mô tả |
|---|---|
| `UserSettings` | 1-to-1 với `User`: theme, language, timezone, notification settings, custom_categories (JSONField) |
| `UserFavoriteCalendar` | 1-to-many: lịch yêu thích (preset holidays hoặc CalendarGroup) |
| `EmailVerificationToken` | UUID token, hết hạn 300s, single-use |

### `events` app
| Model | Mô tả |
|---|---|
| `CalendarGroup` | Lịch nhóm (owner, name, color) |
| `CalendarShare` | Chia sẻ lịch với quyền `view`/`edit` |
| `Event` | Sự kiện/Lịch hẹn: title, start_time, end_time, recurrence_rule, soft-delete (`deleted_at`) |
| `EventInvitation` | Lời mời sự kiện: status `pending/accepted/declined`, permission `view/edit` |
| `Notification` | In-app notifications: 11 loại (invite, reminder, friend_request, security, ...) |
| `ReminderPreference` | 1-to-1 với User: `off/app/email/both` |

---

## 6. API Endpoints Đầy Đủ

### Accounts — `/api/accounts/`
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/register/` | Đăng ký tài khoản mới |
| POST | `/login/` | Đăng nhập (email + password) |
| POST | `/logout/` | Đăng xuất (xoá token) |
| GET | `/me/` | Thông tin user hiện tại |
| POST | `/forgot-password/` | Gửi email khôi phục |
| POST | `/reset-password/` | Đặt mật khẩu mới |
| POST | `/reset-password/validate/` | Kiểm tra token hợp lệ |
| GET | `/verify-email/?token=<uuid>` | Xác thực email |
| POST | `/resend-verification/` | Gửi lại email xác thực |
| GET/PATCH | `/settings/` | Đọc/cập nhật user settings |
| POST | `/profile/update/` | Cập nhật hồ sơ cá nhân |
| GET/POST | `/favorite-calendars/` | Danh sách/thêm lịch yêu thích |
| PATCH/DELETE | `/favorite-calendars/<id>/` | Sửa/xoá lịch yêu thích |

### Events — `/api/events/`
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/` | Danh sách/tạo sự kiện. Query params: `start`, `end`, `trashed` |
| GET/PATCH/DELETE | `/<id>/` | Chi tiết/sửa/xoá sự kiện |
| POST | `/<id>/trash/` | Chuyển vào thùng rác (soft delete) |
| POST | `/<id>/restore/` | Khôi phục từ thùng rác |
| POST | `/<id>/permanent_delete/` | Xoá vĩnh viễn |
| POST | `/<id>/leave/` | Rời khỏi sự kiện được mời |
| GET | `/trashed/` | Danh sách sự kiện đã xoá |
| GET/POST | `/invitations/` | Lời mời sự kiện |
| POST | `/invitations/<id>/accept/` | Chấp nhận lời mời |
| POST | `/invitations/<id>/decline/` | Từ chối lời mời |
| GET | `/notifications/` | Danh sách thông báo |
| POST | `/notifications/<id>/mark_read/` | Đánh dấu đã đọc |
| POST | `/notifications/mark_all_as_read/` | Đánh dấu tất cả đã đọc |
| DELETE | `/notifications/delete_all/` | Xoá tất cả thông báo |
| GET/POST | `/calendars/` | Danh sách/tạo CalendarGroup |
| GET/PATCH | `/reminder-preference/` | Lấy/cập nhật preference nhắc nhở |

### Tasks — `/api/tasks/`
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/` | Danh sách/tạo task |
| PATCH/DELETE | `/<id>/` | Sửa/xoá task |
| POST | `/<id>/toggle/` | Đánh dấu hoàn thành/chưa |
| POST | `/<id>/trash/` | Chuyển vào thùng rác |
| POST | `/<id>/restore/` | Khôi phục |
| POST | `/<id>/permanent_delete/` | Xoá vĩnh viễn |
| GET | `/trashed/` | Danh sách task đã xoá |

### Notes — `/api/notes/`
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/` | Danh sách/tạo ghi chú |
| PATCH/DELETE | `/<id>/` | Sửa/xoá ghi chú |
| POST | `/<id>/toggle_pin/` | Ghim/bỏ ghim ghi chú |

### Contacts — `/api/contacts/`
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/search/by_email/?email=<email>` | Tìm user theo email |
| POST | `/connections/` | Gửi lời mời kết nối |
| GET | `/connections/friends/` | Danh sách bạn bè |
| GET | `/connections/invitations/` | Danh sách lời mời nhận được |
| POST | `/connections/<id>/accept/` | Chấp nhận kết nối |
| POST | `/connections/<id>/decline/` | Từ chối kết nối |
| POST | `/connections/<id>/block/` | Block người dùng |
| POST | `/connections/<id>/toggle_pin/` | Ghim/bỏ ghim bạn bè |

### Management — `/admin/` + `/api/support/`
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/` | Custom admin dashboard (is_staff required) |
| POST | `/api/support/submit/` | Gửi yêu cầu hỗ trợ |

---

## 7. Cấu Hình Môi Trường

### Backend (`calendar-backend/.env`)
```env
SECRET_KEY=your-django-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# --- Option 1: Local Docker PostgreSQL ---
DB_NAME=cnpm_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=5432

# --- Option 2: Supabase Cloud ---
# DB_NAME=postgres
# DB_USER=postgres.[project-ref]
# DB_PASSWORD=your-password
# DB_HOST=aws-1-ap-northeast-2.pooler.supabase.com
# DB_PORT=5432

FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CORS_ALLOW_ALL=false

EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
```

### Frontend (`calendar-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 8. Lệnh Khởi Chạy Thường Dùng

```bash
# ─── DATABASE (local Docker) ───────────────────────────────────
docker-compose up -d                         # Khởi PostgreSQL container
docker-compose down                          # Dừng container

# ─── BACKEND ───────────────────────────────────────────────────
cd calendar-backend
python -m venv venv
venv\Scripts\activate                        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver                   # http://localhost:8000

# ─── TẠO SUPERUSER ────────────────────────────────────────────
python manage.py createsuperuser
# Hoặc tạo nhanh qua shell:
python manage.py shell -c "
from django.contrib.auth.models import User
User.objects.create_superuser('admin', 'admin@gmail.com', 'password123')
"

# ─── KIỂM THỬ ──────────────────────────────────────────────────
python manage.py test --settings=core.test_settings
# Kết quả mong đợi: Ran 47 tests in X.XXXs ... OK

# ─── FRONTEND ──────────────────────────────────────────────────
cd calendar-frontend
npm install
npm run dev                                  # http://localhost:3000
npm run build                                # Build production
```

---

## 9. Quy Tắc Quan Trọng Khi Phát Triển

### Backend
- **Login bằng email, không phải username.** `LoginSerializer` tìm `User` theo `email` → xác thực bằng `username` nội bộ.
- **Xoá mềm (Soft Delete):** Events, Tasks, Notes đều dùng `deleted_at` field, không xoá thật. Dùng custom actions `trash/`, `restore/`, `permanent_delete/`.
- **APScheduler:** Không chạy khi `TESTING=True`. Kiểm tra `getattr(settings, 'TESTING', False)` trước khi lên lịch job.
- **test_settings.py:** Dùng `SQLite :memory:`, tắt throttle, tắt email. Luôn chạy test với `--settings=core.test_settings`.
- **camelCase ↔ snake_case:** Backend dùng snake_case, frontend dùng camelCase. Mapping được xử lý ở `lib/api.js` trong `getSettings()` và `updateSettings()`.
- **File đính kèm:** Events hỗ trợ upload file (`attachment`). API `createEvent`/`updateEvent` tự động detect `FormData` khi có `data.file`.

### Frontend
- **Single-page App:** Toàn bộ routing và state ở `app/page.js`. Không có nhiều pages (ngoại trừ `verify-email` và `reset-password`).
- **Token Auth:** Token lấy từ `localStorage['token']` và gắn vào mọi request qua `lib/api.js`.
- **i18n:** Sử dụng `lib/i18n.js` cho text, date/time format. Không hardcode string tiếng Anh/Việt trong component.
- **Holidays:** Dữ liệu ngày lễ lấy từ `lib/holidays.js` (không gọi API ngoài).

### Git / CI
- `.env` đã được gitignore. **Không commit secret lên GitHub.**
- CI chạy tự động khi push lên `main`, `master`, `dev`.
- CI pipeline: Backend tests (47 cases) + Frontend build check.
- **Để pass CI:** Backend tests phải xanh và `npm run build` phải thành công.

---

## 10. Tài Khoản Admin Mặc Định (Development)

| Field | Giá trị |
|---|---|
| Email | `ad@gmail.com` |
| Password | `123` |
| Django Admin | `http://localhost:8000/django-admin/` |
| Custom Admin | `http://localhost:8000/admin/` |
