from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Event, EventInvitation


def make_time(hour=9, day=1):
    return timezone.make_aware(timezone.datetime(2026, 8, day, hour, 0))


class EventPermissionTests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='matkhau123')
        self.editor = User.objects.create_user(username='editor', email='editor@example.com', password='matkhau123')
        self.viewer = User.objects.create_user(username='viewer', email='viewer@example.com', password='matkhau123')
        self.stranger = User.objects.create_user(username='stranger', email='stranger@example.com', password='matkhau123')

        self.event = Event.objects.create(
            user=self.owner,
            title='Họp nhóm',
            start_time=make_time(9),
            end_time=make_time(10),
        )
        self.editor_invite = EventInvitation.objects.create(
            event=self.event, invitee=self.editor, status='accepted', permission='edit'
        )
        self.viewer_invite = EventInvitation.objects.create(
            event=self.event, invitee=self.viewer, status='accepted', permission='view'
        )

        self.owner_token = Token.objects.create(user=self.owner)
        self.editor_token = Token.objects.create(user=self.editor)
        self.viewer_token = Token.objects.create(user=self.viewer)
        self.stranger_token = Token.objects.create(user=self.stranger)

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Token {token.key}'}

    def test_stranger_cannot_see_event(self):
        resp = self.client.get(f'/api/events/{self.event.id}/', **self._auth(self.stranger_token))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_stranger_cannot_list_others_events(self):
        resp = self.client.get('/api/events/', **self._auth(self.stranger_token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 0)

    def test_owner_can_update_event(self):
        resp = self.client.patch(
            f'/api/events/{self.event.id}/',
            {'title': 'Họp nhóm đổi lịch'},
            format='json',
            **self._auth(self.owner_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.title, 'Họp nhóm đổi lịch')

    def test_viewer_cannot_update_event(self):
        resp = self.client.patch(
            f'/api/events/{self.event.id}/',
            {'title': 'Không được phép'},
            format='json',
            **self._auth(self.viewer_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_editor_can_update_event(self):
        resp = self.client.patch(
            f'/api/events/{self.event.id}/',
            {'title': 'Sửa bởi editor'},
            format='json',
            **self._auth(self.editor_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertEqual(self.event.title, 'Sửa bởi editor')

    def test_only_owner_can_delete_event(self):
        resp = self.client.delete(f'/api/events/{self.event.id}/', **self._auth(self.editor_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Event.objects.filter(id=self.event.id).exists())

        resp = self.client.delete(f'/api/events/{self.event.id}/', **self._auth(self.owner_token))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Event.objects.filter(id=self.event.id).exists())

    def test_only_owner_can_trash_event(self):
        resp = self.client.post(f'/api/events/{self.event.id}/trash/', **self._auth(self.viewer_token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        resp = self.client.post(f'/api/events/{self.event.id}/trash/', **self._auth(self.owner_token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.event.refresh_from_db()
        self.assertIsNotNone(self.event.deleted_at)

    def test_create_event_assigns_owner(self):
        resp = self.client.post('/api/events/', {
            'title': 'Sự kiện mới',
            'start_time': make_time(14).isoformat(),
            'end_time': make_time(15).isoformat(),
        }, format='json', **self._auth(self.owner_token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        event = Event.objects.get(id=resp.data['id'])
        self.assertEqual(event.user, self.owner)

    def test_invitee_can_accept_invitation(self):
        resp = self.client.post(
            f'/api/events/invitations/{self.event.id}/accept/',
            **self._auth(self.viewer_token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.viewer_invite.refresh_from_db()
        self.assertEqual(self.viewer_invite.status, 'accepted')


class NotificationTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='notifuser', email='notif@example.com', password='matkhau123')
        self.token = Token.objects.create(user=self.user)
        self.event = Event.objects.create(
            user=self.user,
            title='Sự kiện thông báo',
            start_time=make_time(9, 2),
            end_time=make_time(10, 2),
        )

    def _auth(self):
        return {'HTTP_AUTHORIZATION': f'Token {self.token.key}'}

    def test_notification_create_blocked(self):
        resp = self.client.post('/api/events/notifications/', {'content': 'hack'}, format='json', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_mark_read_own_notification(self):
        from .models import Notification
        notif = Notification.objects.create(user=self.user, ntype='system', event=self.event, content='chào')
        resp = self.client.post(f'/api/events/notifications/{notif.id}/mark_read/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)
