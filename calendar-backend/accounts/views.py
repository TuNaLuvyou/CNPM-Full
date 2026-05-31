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
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
import threading
from .models import EmailVerificationToken



class RegisterView(APIView):
    """
    POST /api/accounts/register/
    Body: { email, password, full_name? }
    Tạo tài khoản ở trạng thái chờ xác thực (is_active=False),
    gửi email xác nhận và tự động xóa tài khoản sau 5 phút nếu chưa xác thực.
    """
    permission_classes = [AllowAny]

    def _send_verification_email(self, user, verify_token):
        """Gửi email HTML chứa link xác nhận."""
        verify_url = f"http://localhost:3000/verify-email?token={verify_token.token}"
        subject = "Xác nhận địa chỉ Email - Lịch Cá Nhân"
        html_message = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">Xác nhận địa chỉ Email</h2>
            <p>Xin chào <strong>{user.username}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản trên hệ thống <strong>Lịch Cá Nhân</strong>.</p>
            <p>Vui lòng click vào nút bên dưới để xác nhận địa chỉ email của bạn.
            <strong>Liên kết này chỉ có hiệu lực trong vòng 5 phút.</strong></p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px;
                   text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                   Xác nhận Email
                </a>
            </div>
            <p style="color: #64748b; font-size: 13px;">Nếu nút trên không hoạt động, bạn có thể copy link sau và dán trực tiếp vào thanh địa chỉ trình duyệt:</p>
            <p style="word-break: break-all; font-size: 13px; color: #2563eb;"><a href="{verify_url}">{verify_url}</a></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #64748b;">
                Nếu bạn không thực hiện yêu cầu này, tài khoản của bạn sẽ bị xóa tự động sau 5 phút.
            </p>
        </div>
        """
        send_mail(
            subject=subject,
            message=f"Xác nhận email của bạn bằng cách truy cập: {verify_url}",
            from_email=None,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    def _schedule_cleanup(self, user_id):
        """Lên lịch xóa tài khoản nếu chưa xác thực sau 5 phút."""
        def cleanup():
            try:
                u = User.objects.get(pk=user_id, is_active=False)
                # Kiểm tra lại lần nữa: chỉ xóa nếu vẫn chưa active và vẫn còn token
                if hasattr(u, 'email_verification_token') and u.email_verification_token.is_expired():
                    u.delete()
            except User.DoesNotExist:
                pass  # Đã được xác thực hoặc xóa thủ công

        timer = threading.Timer(EmailVerificationToken.EXPIRE_SECONDS + 5, cleanup)
        timer.daemon = True
        timer.start()

    def post(self, request):
        data = request.data.copy()
        if 'email' in data and 'username' not in data:
            data['username'] = data['email'].split('@')[0]

        serializer = RegisterSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        # Đăng ký xong: khóa tài khoản chờ xác thực
        user.is_active = False
        user.save()

        # Tạo token xác thực
        verify_token = EmailVerificationToken.objects.create(user=user)

        # Gửi email
        try:
            self._send_verification_email(user, verify_token)
        except Exception as e:
            # Nếu gửi thất bại, xóa user luôn tránh rác
            user.delete()
            return Response(
                {'error': f'Không thể gửi email xác nhận: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Lên lịch tự động xóa sau 5 phút
        self._schedule_cleanup(user.pk)

        return Response({
            'status': 'pending_verification',
            'email': user.email,
            'message': 'Đầng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản trong vòng 5 phút.'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    POST /api/accounts/login/
    Body: { email, password }
    Trả về 403 + error='email_not_verified' nếu tài khoản chưa xác thực email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        # Kiểm tra sớm: tài khoản tồn tại nhưng chưa xác thực?
        try:
            pending_user = User.objects.get(email=email, is_active=False)
            if hasattr(pending_user, 'email_verification_token'):
                return Response(
                    {'error': 'email_not_verified', 'email': email},
                    status=status.HTTP_403_FORBIDDEN
                )
        except User.DoesNotExist:
            pass

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
            
            # Tạo uid và token
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # Đường dẫn đổi mật khẩu ở Frontend
            reset_url = f"http://localhost:3000/reset-password?uid={uid}&token={token}"
            
            # Gửi Email
            subject = "Yêu cầu khôi phục mật khẩu - Lịch Cá Nhân"
            html_message = f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #2563eb; margin-bottom: 20px;">Khôi phục mật khẩu</h2>
                <p>Xin chào <strong>{user.username}</strong>,</p>
                <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn trên hệ thống Lịch Cá Nhân.</p>
                <p>Vui lòng click vào nút bên dưới để tiến hành đổi mật khẩu mới. <strong>Liên kết này chỉ có hiệu lực trong vòng 5 phút và chỉ sử dụng được 1 lần duy nhất:</strong></p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Đổi mật khẩu mới</a>
                </div>
                <p style="color: #64748b; font-size: 13px;">Nếu nút trên không hoạt động, bạn có thể copy link sau và dán trực tiếp vào thanh địa chỉ của trình duyệt:</p>
                <p style="word-break: break-all; font-size: 13px; color: #2563eb;"><a href="{reset_url}">{reset_url}</a></p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                <p style="font-size: 12px; color: #64748b;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn được an toàn.</p>
            </div>
            """
            
            send_mail(
                subject=subject,
                message=f"Vui lòng truy cập đường dẫn sau để khôi phục mật khẩu: {reset_url}",
                from_email=None,  # sử dụng DEFAULT_FROM_EMAIL
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )

            # Cảnh báo bảo mật trong app
            Notification.objects.create(
                user=user,
                ntype='security',
                content="Hệ thống đã gửi link khôi phục mật khẩu tới email đăng ký của bạn. Vui lòng kiểm tra hộp thư."
            )
            
            return Response({'status': 'Đã gửi link khôi phục mật khẩu vào Email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/spam).'})
        except User.DoesNotExist:
            # Vẫn trả về thành công giả để tránh lộ email tồn tại
            return Response({'status': 'Đã gửi link khôi phục mật khẩu vào Email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác/spam).'})
        except Exception as e:
            return Response({'error': f'Lỗi khi gửi email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordView(APIView):
    """
    POST /api/accounts/reset-password/
    Body: { uid, token, new_password }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response({'error': 'Thiếu tham số bắt buộc.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'Mật khẩu mới phải có tối thiểu 6 ký tự.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Đường dẫn khôi phục mật khẩu không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Đường dẫn đã hết hạn hoặc không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Thu hồi toàn bộ token cũ
        Token.objects.filter(user=user).delete()

        Notification.objects.create(
            user=user,
            ntype='security',
            content="Mật khẩu của bạn đã được thay đổi thành công qua link khôi phục email."
        )

        return Response({'status': 'Mật khẩu đã được thay đổi thành công!'})


class ValidateResetTokenView(APIView):
    """
    POST /api/accounts/reset-password/validate/
    Body: { uid, token }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')

        if not uidb64 or not token:
            return Response({'valid': False, 'error': 'Thiếu tham số bắt buộc.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'valid': False, 'error': 'Đường dẫn không hợp lệ.'})

        if not default_token_generator.check_token(user, token):
            return Response({'valid': False, 'error': 'Đường dẫn đã hết hạn hoặc không hợp lệ.'})

        return Response({'valid': True})


class VerifyEmailView(APIView):
    """
    GET /api/accounts/verify-email/?token=<uuid>
    Xác thực email từ link gửi về hộp thư.
    Kích hoạt tài khoản (is_active=True) và xóa token.
    Chỉ trả về JSON thông báo thành công — frontend tự redirect.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        token_str = request.query_params.get('token')
        if not token_str:
            return Response(
                {'error': 'Thiếu token xác thực.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            verify_obj = EmailVerificationToken.objects.select_related('user').get(token=token_str)
        except (EmailVerificationToken.DoesNotExist, ValueError):
            return Response(
                {'error': 'Link xác thực không hợp lệ hoặc tài khoản đã bị xóa do quá hạn.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verify_obj.is_expired():
            # Xóa user đã hết hạn
            verify_obj.user.delete()
            return Response(
                {'error': 'Link xác thực đã hết hạn (5 phút). Tài khoản đã bị xóa, vui lòng đăng ký lại.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = verify_obj.user
        user.is_active = True
        user.save()
        verify_obj.delete()

        return Response({
            'status': 'verified',
            'email': user.email,
            'username': user.username,
            'message': f'Email {user.email} đã được xác nhận thành công! Bạn có thể đăng nhập vào ứng dụng.',
        })


class ResendVerificationView(APIView):
    """
    POST /api/accounts/resend-verification/
    Body: { email }
    Gửi lại email xác nhận cho tài khoản chưa xác thực.
    Reset lại timer 5 phút.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Vui lòng cung cấp email.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            # Trả success giả để tránh lộ thông tin
            return Response({'status': 'Nếu email tồn tại và chưa xác thực, chúng tôi đã gửi lại email xác nhận.'})

        # Xóa token cũ (nếu có) và tạo token mới
        EmailVerificationToken.objects.filter(user=user).delete()
        verify_token = EmailVerificationToken.objects.create(user=user)

        # Gửi lại email
        verify_url = f"http://localhost:3000/verify-email?token={verify_token.token}"
        subject = "Xác nhận địa chỉ Email - Lịch Cá Nhân"
        html_message = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">Xác nhận địa chỉ Email (Gửi lại)</h2>
            <p>Xin chào <strong>{user.username}</strong>,</p>
            <p>Bạn đã yêu cầu gửi lại email xác nhận cho tài khoản <strong>Lịch Cá Nhân</strong>.</p>
            <p>Vui lòng click vào nút bên dưới để xác nhận. <strong>Liên kết có hiệu lực trong 5 phút.</strong></p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px;
                   text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                   Xác nhận Email
                </a>
            </div>
            <p style="word-break: break-all; font-size: 13px; color: #2563eb;"><a href="{verify_url}">{verify_url}</a></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #64748b;">
                Nếu bạn không thực hiện yêu cầu này, tài khoản sẽ bị xóa tự động sau 5 phút.
            </p>
        </div>
        """

        try:
            send_mail(
                subject=subject,
                message=f"Xác nhận email tại: {verify_url}",
                from_email=None,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {'error': f'Không thể gửi email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Reset timer cleanup
        def cleanup():
            try:
                u = User.objects.get(pk=user.pk, is_active=False)
                if hasattr(u, 'email_verification_token') and u.email_verification_token.is_expired():
                    u.delete()
            except User.DoesNotExist:
                pass

        timer = threading.Timer(EmailVerificationToken.EXPIRE_SECONDS + 5, cleanup)
        timer.daemon = True
        timer.start()

        return Response({'status': 'Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư (bao gồm cả Spam).'})



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
