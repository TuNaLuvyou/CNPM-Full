from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import EmailVerificationToken


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class RegisterTests(APITestCase):

    def test_register_creates_inactive_user_and_token(self):
        resp = self.client.post('/api/accounts/register/', {
            'email': 'user@example.com',
            'password': 'matkhau123',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='user@example.com')
        self.assertFalse(user.is_active)
        self.assertTrue(EmailVerificationToken.objects.filter(user=user).exists())
        self.assertTrue(user.groups.filter(name='Người dùng').exists())

        # Email xác nhận đã được gửi
        self.assertEqual(len(mail.outbox), 1)

    def test_register_duplicate_email_rejected(self):
        self.client.post('/api/accounts/register/', {
            'email': 'dup@example.com',
            'password': 'matkhau123',
        })
        resp = self.client.post('/api/accounts/register/', {
            'email': 'dup@example.com',
            'password': 'matkhau456',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password_rejected(self):
        resp = self.client.post('/api/accounts/register/', {
            'email': 'weak@example.com',
            'password': '123',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='weak@example.com').exists())

    def test_login_unverified_user_returns_403(self):
        self.client.post('/api/accounts/register/', {
            'email': 'unverified@example.com',
            'password': 'matkhau123',
        })
        resp = self.client.post('/api/accounts/login/', {
            'email': 'unverified@example.com',
            'password': 'matkhau123',
        })
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data['error'], 'email_not_verified')

    def test_verify_email_activates_account(self):
        self.client.post('/api/accounts/register/', {
            'email': 'verify@example.com',
            'password': 'matkhau123',
        })
        user = User.objects.get(email='verify@example.com')
        token = EmailVerificationToken.objects.get(user=user)

        resp = self.client.get(f'/api/accounts/verify-email/?token={token.token}')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['status'], 'verified')

        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertFalse(EmailVerificationToken.objects.filter(user=user).exists())

    def test_verify_email_expired_token_deletes_user(self):
        self.client.post('/api/accounts/register/', {
            'email': 'expired@example.com',
            'password': 'matkhau123',
        })
        user = User.objects.get(email='expired@example.com')
        token = EmailVerificationToken.objects.get(user=user)

        from datetime import timedelta
        from django.utils import timezone
        token.created_at = timezone.now() - timedelta(seconds=EmailVerificationToken.EXPIRE_SECONDS + 1)
        token.save()

        resp = self.client.get(f'/api/accounts/verify-email/?token={token.token}')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='expired@example.com').exists())

    def test_verify_email_invalid_token(self):
        resp = self.client.get('/api/accounts/verify-email/?token=invalid-uuid')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_full_flow_register_verify_login(self):
        self.client.post('/api/accounts/register/', {
            'email': 'full@example.com',
            'password': 'matkhau123',
        })
        user = User.objects.get(email='full@example.com')
        token = EmailVerificationToken.objects.get(user=user)

        self.client.get(f'/api/accounts/verify-email/?token={token.token}')

        resp = self.client.post('/api/accounts/login/', {
            'email': 'full@example.com',
            'password': 'matkhau123',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)
        self.assertEqual(resp.data['user']['email'], 'full@example.com')


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class PasswordResetTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='resetuser', email='reset@example.com', password='matkhaucu123'
        )
        self.user.is_active = True
        self.user.save()

    def test_forgot_password_sends_email_to_existing_user(self):
        resp = self.client.post('/api/accounts/forgot-password/', {'email': 'reset@example.com'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('reset-password', mail.outbox[0].body)

    def test_forgot_password_does_not_leak_existing_email(self):
        resp_ok = self.client.post('/api/accounts/forgot-password/', {'email': 'reset@example.com'})
        resp_missing = self.client.post('/api/accounts/forgot-password/', {'email': 'khongton tai@example.com'})
        self.assertEqual(resp_ok.data['status'], resp_missing.data['status'])

    def test_reset_password_changes_password_and_revokes_tokens(self):
        token, _ = Token.objects.get_or_create(user=self.user)

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        reset_token = default_token_generator.make_token(self.user)

        resp = self.client.post('/api/accounts/reset-password/', {
            'uid': uid,
            'token': reset_token,
            'new_password': 'matkhaumoi456',
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('matkhaumoi456'))
        # Token cũ đã bị thu hồi
        self.assertFalse(Token.objects.filter(key=token.key).exists())

    def test_reset_password_invalid_token_rejected(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        resp = self.client.post('/api/accounts/reset-password/', {
            'uid': uid,
            'token': 'fake-token',
            'new_password': 'matkhaumoi456',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_reset_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        reset_token = default_token_generator.make_token(self.user)

        resp = self.client.post('/api/accounts/reset-password/validate/', {
            'uid': uid,
            'token': reset_token,
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['valid'])


class AuthTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='authuser', email='auth@example.com', password='matkhau123'
        )
        self.token, _ = Token.objects.get_or_create(user=self.user)

    def test_me_requires_auth(self):
        resp = self.client.get('/api/accounts/me/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_profile(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        resp = self.client.get('/api/accounts/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['email'], 'auth@example.com')

    def test_logout_revokes_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        resp = self.client.post('/api/accounts/logout/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(key=self.token.key).exists())
