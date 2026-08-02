import ssl
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend

class UnverifiedSSLEmailBackend(DjangoEmailBackend):
    def open(self):
        if self.connection:
            return False
        try:
            # Dùng SSL context mặc định (xác thực chứng chỉ theo CA bundle của hệ thống)
            self.ssl_context = ssl.create_default_context()
        except AttributeError:
            pass
        return super().open()
