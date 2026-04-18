from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from management.models import SupportRequest
from django.contrib import auth
from django.shortcuts import redirect
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from events.models import Notification


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
    Xử lý đăng xuất cho cả API (Token) và Web (Session)
    """
    def post(self, request):
        # 1. Xoá Token nếu có (Dành cho App/Mobile)
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        
        # 2. Đăng xuất Session (Dành cho Trình duyệt)
        auth.logout(request)
        
        # 3. Phản hồi dựa trên loại yêu cầu
        if request.accepted_renderer.format == 'html' or 'text/html' in request.META.get('HTTP_ACCEPT', ''):
            # Nếu là web, quay về trang login quản trị
            return redirect('/admin/login/')
            
        return Response({'status': 'logged out'}, status=status.HTTP_200_OK)

    def get(self, request):
        """ Hỗ trợ thêm GET logout để tránh lỗi 405 khi người dùng gõ URL trực tiếp """
        return self.post(request)


class MeView(APIView):
    """
    GET /api/accounts/me/  → thông tin user hiện tại
    Header: Authorization: Token <token>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ForgotPasswordView(APIView):
    """
    POST /api/accounts/forgot-password/
    Body: { email }
    Tiếp nhận yêu cầu khôi phục mật khẩu và tạo SupportRequest
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Vui lòng nhập Email'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            # Tạo yêu cầu hỗ trợ
            SupportRequest.objects.create(
                user=user,
                request_type='password_reset',
                subject='Yêu cầu khôi phục mật khẩu',
                message=f"Người dùng yêu cầu khôi phục mật khẩu cho email: {email}",
                status='pending'
            )
            # 4. Gửi thông báo bảo mật cho người dùng
            Notification.objects.create(
                user=user,
                ntype='security',
                content="Hệ thống vừa nhận được yêu cầu khôi phục mật khẩu cho tài khoản này. Nếu không phải bạn thực hiện, vui lòng liên hệ Admin ngay!"
            )
            return Response({'status': 'Đã gửi yêu cầu khôi phục mật khẩu. Admin sẽ liên hệ với bạn sớm nhất.'})
        except User.DoesNotExist:
            # Vì lý do bảo mật, chúng ta vẫn trả về thành công để tránh lộ thông tin email nào đã đăng ký
            return Response({'status': 'Nếu email tồn tại trong hệ thống, yêu cầu đã được gửi đi.'})
