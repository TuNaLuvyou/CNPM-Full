import ssl
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend

class UnverifiedSSLEmailBackend(DjangoEmailBackend):
    def open(self):
        if self.connection:
            return False
        try:
            # Tạo SSL context không kiểm duyệt chứng chỉ để bỏ qua lỗi macOS local issuer certificate
            self.ssl_context = ssl._create_unverified_context()
        except AttributeError:
            pass
        return super().open()
