from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Connection, Contact


class ContactAndConnectionTests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', email='user1@example.com', password='matkhau123')
        self.user2 = User.objects.create_user(username='user2', email='user2@example.com', password='matkhau123')
        self.token1 = Token.objects.create(user=self.user1)
        self.token2 = Token.objects.create(user=self.user2)

    def _auth(self, token):
        return {'HTTP_AUTHORIZATION': f'Token {token.key}'}

    def test_search_user_by_email(self):
        resp = self.client.get('/api/contacts/search/by_email/?email=user2@example.com', **self._auth(self.token1))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['username'], 'user2')

        resp_self = self.client.get('/api/contacts/search/by_email/?email=user1@example.com', **self._auth(self.token1))
        self.assertEqual(resp_self.status_code, status.HTTP_400_BAD_REQUEST)

    def test_connection_request_and_accept_flow(self):
        # 1. User1 sends connection request to User2
        resp = self.client.post('/api/contacts/connections/', {'receiver': self.user2.id}, format='json', **self._auth(self.token1))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        conn_id = resp.data['id']

        # 2. User2 checks pending invitations
        resp_inv = self.client.get('/api/contacts/connections/invitations/', **self._auth(self.token2))
        self.assertEqual(resp_inv.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_inv.data), 1)

        # 3. User2 accepts invitation
        resp_acc = self.client.post(f'/api/contacts/connections/{conn_id}/accept/', **self._auth(self.token2))
        self.assertEqual(resp_acc.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_acc.data['status'], 'accepted')

        # 4. Check friends list for both users
        resp_f1 = self.client.get('/api/contacts/connections/friends/', **self._auth(self.token1))
        self.assertEqual(len(resp_f1.data), 1)

        resp_f2 = self.client.get('/api/contacts/connections/friends/', **self._auth(self.token2))
        self.assertEqual(len(resp_f2.data), 1)

    def test_connection_decline(self):
        resp = self.client.post('/api/contacts/connections/', {'receiver': self.user2.id}, format='json', **self._auth(self.token1))
        conn_id = resp.data['id']

        resp_dec = self.client.post(f'/api/contacts/connections/{conn_id}/decline/', **self._auth(self.token2))
        self.assertEqual(resp_dec.status_code, status.HTTP_200_OK)
        self.assertFalse(Connection.objects.filter(id=conn_id).exists())

    def test_contact_crud(self):
        resp = self.client.post('/api/contacts/', {
            'name': 'Nguyễn Văn A',
            'email': 'nva@example.com',
            'phone': '0901234567',
        }, format='json', **self._auth(self.token1))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        contact_id = resp.data['id']

        resp_list = self.client.get('/api/contacts/', **self._auth(self.token1))
        self.assertEqual(len(resp_list.data), 1)

        resp_del = self.client.delete(f'/api/contacts/{contact_id}/', **self._auth(self.token1))
        self.assertEqual(resp_del.status_code, status.HTTP_204_NO_CONTENT)
