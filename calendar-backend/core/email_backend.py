import ssl
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend

class UnverifiedSSLEmailBackend(DjangoEmailBackend):
    def open(self):
        if self.connection:
            return False
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            self.ssl_context = context
        except Exception:
            pass
        return super().open()
