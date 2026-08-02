from .settings import *  # noqa: F401,F403

TESTING = True

# Chạy test bằng SQLite để không cần khởi động MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Không gửi email thật khi test
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Tắt throttle khi test để không bị HTTP 429 khi chạy test suite
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []


