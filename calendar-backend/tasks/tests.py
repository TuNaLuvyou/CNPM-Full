from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Task


class TaskAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='taskuser', email='task@example.com', password='matkhau123')
        self.other_user = User.objects.create_user(username='otheruser', email='other@example.com', password='matkhau123')
        self.token = Token.objects.create(user=self.user)
        self.other_token = Token.objects.create(user=self.other_user)

        self.task = Task.objects.create(
            user=self.user,
            title='Làm báo cáo CNPM',
            category='Công việc',
            is_completed=False,
        )

    def _auth(self, token=None):
        t = token or self.token
        return {'HTTP_AUTHORIZATION': f'Token {t.key}'}

    def test_list_tasks(self):
        resp = self.client.get('/api/tasks/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['title'], 'Làm báo cáo CNPM')

    def test_other_user_cannot_access_task(self):
        resp = self.client.get(f'/api/tasks/{self.task.id}/', **self._auth(self.other_token))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_task(self):
        resp = self.client.post('/api/tasks/', {
            'title': 'Họp nhóm đồ án',
            'category': 'Công việc',
            'priority': 'high',
        }, format='json', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Task.objects.filter(title='Họp nhóm đồ án', user=self.user).exists())

    def test_toggle_task_done(self):
        resp = self.client.post(f'/api/tasks/{self.task.id}/toggle/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertTrue(self.task.is_completed)

        # Toggle back
        resp = self.client.post(f'/api/tasks/{self.task.id}/toggle/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertFalse(self.task.is_completed)

    def test_trash_restore_and_permanent_delete_task(self):
        # Soft delete
        resp = self.client.post(f'/api/tasks/{self.task.id}/trash/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertIsNotNone(self.task.deleted_at)

        # List trash
        resp = self.client.get('/api/tasks/trashed/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

        # Restore
        resp = self.client.post(f'/api/tasks/{self.task.id}/restore/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertIsNone(self.task.deleted_at)

        # Permanent delete
        resp = self.client.post(f'/api/tasks/{self.task.id}/permanent_delete/', **self._auth())
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=self.task.id).exists())

    def test_filter_tasks_by_done(self):
        Task.objects.create(user=self.user, title='Task xong', is_completed=True)
        
        resp_done = self.client.get('/api/tasks/?done=true', **self._auth())
        self.assertEqual(len(resp_done.data), 1)
        self.assertEqual(resp_done.data[0]['title'], 'Task xong')

        resp_undone = self.client.get('/api/tasks/?done=false', **self._auth())
        self.assertEqual(len(resp_undone.data), 1)
        self.assertEqual(resp_undone.data[0]['title'], 'Làm báo cáo CNPM')
