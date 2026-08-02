from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Note


class NoteAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='noteuser', email='note@example.com', password='matkhau123')
        self.other_user = User.objects.create_user(username='othernote', email='othernote@example.com', password='matkhau123')
        self.token = Token.objects.create(user=self.user)
        self.other_token = Token.objects.create(user=self.other_user)

        self.note = Note.objects.create(
            user=self.user,
            title='Ý tưởng dự án',
            content='Viết web ứng dụng lịch cá nhân',
            color='yellow',
            is_pinned=False,
        )

    def _auth(self, token=None):
        t = token or self.token
        return {'HTTP_AUTHORIZATION': f'Token {t.key}'}

    def test_list_notes(self):
        resp = self.client.get('/api/notes/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['title'], 'Ý tưởng dự án')

    def test_create_note(self):
        resp = self.client.post('/api/notes/', {
            'title': 'Ghi chú mới',
            'content': 'Nội dung ghi chú',
            'color': 'blue',
        }, format='json', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Note.objects.filter(title='Ghi chú mới', user=self.user).exists())

    def test_toggle_pin_note(self):
        resp = self.client.post(f'/api/notes/{self.note.id}/toggle_pin/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.note.refresh_from_db()
        self.assertTrue(self.note.is_pinned)

    def test_trash_restore_and_permanent_delete_note(self):
        resp = self.client.post(f'/api/notes/{self.note.id}/trash/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.note.refresh_from_db()
        self.assertIsNotNone(self.note.deleted_at)

        resp_trash = self.client.get('/api/notes/trashed/', **self._auth())
        self.assertEqual(resp_trash.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_trash.data), 1)

        resp_restore = self.client.post(f'/api/notes/{self.note.id}/restore/', **self._auth())
        self.assertEqual(resp_restore.status_code, status.HTTP_200_OK)
        self.note.refresh_from_db()
        self.assertIsNone(self.note.deleted_at)

        resp_perm = self.client.post(f'/api/notes/{self.note.id}/permanent_delete/', **self._auth())
        self.assertEqual(resp_perm.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(id=self.note.id).exists())

    def test_other_user_cannot_access_note(self):
        resp = self.client.get(f'/api/notes/{self.note.id}/', **self._auth(self.other_token))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
