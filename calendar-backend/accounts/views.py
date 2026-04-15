from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


class RegisterView(APIView):
    """
    POST /api/accounts/register/
    Body: { email, password, full_name? }
    """
    def post(self, request):
        # Nếu FE gửi email làm username
        data = request.data.copy()
        if 'email' in data and 'username' not in data:
            data['username'] = data['email'].split('@')[0]

        serializer = RegisterSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/accounts/login/
    Body: { email, password }
    """
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    POST /api/accounts/logout/
    Header: Authorization: Token <token>
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Xoá token → đăng xuất
        request.user.auth_token.delete()
        return Response({'status': 'logged out'})


class MeView(APIView):
    """
    GET /api/accounts/me/  → thông tin user hiện tại
    Header: Authorization: Token <token>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
