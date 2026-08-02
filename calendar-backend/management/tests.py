from django.contrib.auth.models import User, Group
from django.test import TestCase
from django.urls import reverse


class ManagementStateChangeTests(TestCase):

    def setUp(self):
        self.staff = User.objects.create_user(username='staff', password='matkhau123', is_staff=True)
        self.target = User.objects.create_user(username='target', password='matkhau123')
        Group.objects.get_or_create(name='Quản trị viên')

    def _login_staff(self):
        self.client.force_login(self.staff)

    def test_toggle_user_status_rejects_get(self):
        # CSRF-qua-GET: request GET không được thực hiện thao tác
        self._login_staff()
        resp = self.client.get(reverse('toggle_user_status', args=[self.target.id]))
        self.assertEqual(resp.status_code, 405)
        self.target.refresh_from_db()
        self.assertTrue(self.target.is_active)

    def test_toggle_user_status_works_via_post(self):
        self._login_staff()
        resp = self.client.post(reverse('toggle_user_status', args=[self.target.id]))
        self.assertEqual(resp.status_code, 302)
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)

    def test_resolve_request_rejects_get(self):
        from .models import SupportRequest
        self._login_staff()
        sr = SupportRequest.objects.create(user=self.target, subject='sub', message='msg')
        resp = self.client.get(reverse('resolve_request', args=[sr.id]))
        self.assertEqual(resp.status_code, 405)
        sr.refresh_from_db()
        self.assertEqual(sr.status, 'pending')

    def test_delete_group_rejects_get(self):
        self._login_staff()
        group = Group.objects.create(name='Tạm thời')
        resp = self.client.get(reverse('delete_group', args=[group.id]))
        self.assertEqual(resp.status_code, 405)
        self.assertTrue(Group.objects.filter(id=group.id).exists())

    def test_anonymous_get_toggle_returns_405(self):
        # Ngay cả khi chưa đăng nhập, GET vẫn bị chặn trước
        resp = self.client.get(reverse('toggle_user_status', args=[self.target.id]))
        self.assertEqual(resp.status_code, 405)
