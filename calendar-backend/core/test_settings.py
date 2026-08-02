from .settings import *  # noqa: F401,F403

# Chạy test bằng SQLite để không cần khởi động MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Không gửi email thật khi test
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
