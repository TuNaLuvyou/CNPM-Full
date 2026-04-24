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
    """
    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        auth.logout(request)
        if request.accepted_renderer.format == 'html' or 'text/html' in request.META.get('HTTP_ACCEPT', ''):
            return redirect('/admin/login/')
        return Response({'status': 'logged out'}, status=status.HTTP_200_OK)

    def get(self, request):
        return self.post(request)


class MeView(APIView):
    """
    GET /api/accounts/me/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ForgotPasswordView(APIView):
    """
    POST /api/accounts/forgot-password/
    Body: { email }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Vui lòng nhập Email'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            SupportRequest.objects.create(
                user=user,
                request_type='password_reset',
                subject='Yêu cầu khôi phục mật khẩu',
                message=f"Người dùng yêu cầu khôi phục mật khẩu cho email: {email}",
                status='pending'
            )
            Notification.objects.create(
                user=user,
                ntype='security',
                content="Hệ thống vừa nhận được yêu cầu khôi phục mật khẩu cho tài khoản này. Nếu không phải bạn thực hiện, vui lòng liên hệ Admin ngay!"
            )
            return Response({'status': 'Đã gửi yêu cầu khôi phục mật khẩu. Admin sẽ liên hệ với bạn sớm nhất.'})
        except User.DoesNotExist:
            return Response({'status': 'Nếu email tồn tại trong hệ thống, yêu cầu đã được gửi đi.'})


from .models import UserSettings, UserFavoriteCalendar
from .serializers import UserSettingsSerializer, ProfileUpdateSerializer, UserFavoriteCalendarSerializer


class ProfileUpdateView(APIView):
    """
    POST /api/accounts/profile/update/
    Body: { email, full_name, phone_number, current_password, new_password? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProfileUpdateSerializer(
            instance=request.user,
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSettingsView(APIView):
    """
    GET  /api/accounts/settings/  → trả về flat settings object
    PATCH/PUT /api/accounts/settings/  → update một phần hoặc toàn bộ
    
    Frontend gửi camelCase, backend nhận snake_case.
    Mapping thực hiện ở frontend (api.js).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        return Response(UserSettingsSerializer(settings_obj).data)

    def patch(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.patch(request)


class FavoriteCalendarsView(APIView):
    """
    GET  /api/accounts/favorite-calendars/     → danh sách lịch yêu thích
    POST /api/accounts/favorite-calendars/     → thêm lịch yêu thích
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = UserFavoriteCalendar.objects.filter(user=request.user)
        return Response(UserFavoriteCalendarSerializer(qs, many=True).data)

    def post(self, request):
        # Check duplicate calendar_key nếu là preset
        cal_key = request.data.get('calendar_key', '')
        if cal_key:
            existing = UserFavoriteCalendar.objects.filter(
                user=request.user, calendar_key=cal_key
            ).first()
            if existing:
                # Toggle is_active thay vì tạo mới
                existing.is_active = not existing.is_active
                existing.save()
                return Response(UserFavoriteCalendarSerializer(existing).data)

        serializer = UserFavoriteCalendarSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FavoriteCalendarDetailView(APIView):
    """
    DELETE /api/accounts/favorite-calendars/<id>/  → xóa lịch yêu thích
    PATCH  /api/accounts/favorite-calendars/<id>/  → cập nhật (toggle is_active, đổi màu...)
    """
    permission_classes = [IsAuthenticated]

    def _get_object(self, request, pk):
        try:
            return UserFavoriteCalendar.objects.get(pk=pk, user=request.user)
        except UserFavoriteCalendar.DoesNotExist:
            return None

    def patch(self, request, pk):
        obj = self._get_object(request, pk)
        if not obj:
            return Response({'error': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserFavoriteCalendarSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = self._get_object(request, pk)
        if not obj:
            return Response({'error': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
