from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.contrib import auth
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from events.models import Notification
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.contrib.auth.models import Group
from django.conf import settings
from django.core.exceptions import ValidationError
from .models import EmailVerificationToken
from core.scheduler import schedule_cleanup


from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=7 * 24 * 60 * 60,
        path='/'
    )


import threading
import logging

logger = logging.getLogger(__name__)


def send_email_async(subject, message, recipient_list, html_message=None):
    """Gửi email bất đồng bộ (non-blocking) qua background thread."""
    def _send():
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Đã gửi email thành công tới {recipient_list}")
        except Exception as e:
            logger.error(f"Lỗi gửi email ngầm tới {recipient_list}: {str(e)}")

    threading.Thread(target=_send, daemon=True).start()


def build_verification_email(user, verify_url, resend=False):
    """Tạo nội dung HTML email xác nhận tài khoản cao cấp."""
    title = "Xác nhận địa chỉ Email (Gửi lại)" if resend else "Xác nhận địa chỉ Email"
    intro = (
        "Bạn vừa yêu cầu gửi lại liên kết xác nhận cho tài khoản <strong>Lịch Cá Nhân</strong>."
        if resend
        else "Cảm ơn bạn đã đăng ký tài khoản trên hệ thống <strong>Lịch Cá Nhân</strong>."
    )
    subject = f"{title} - Lịch Cá Nhân"
    display_name = user.first_name or user.username or "Bạn"

    html_message = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light only">
        <meta name="supported-color-schemes" content="light only">
        <style>
            :root {{
                color-scheme: light only;
                supported-color-schemes: light only;
            }}
            .force-white, .force-white * {{ color: #ffffff !important; }}
            .force-sub, .force-sub * {{ color: #dbeafe !important; }}
            [data-ogsc] .force-white {{ color: #ffffff !important; }}
            [data-ogsc] .force-sub {{ color: #dbeafe !important; }}
            u + #body .force-white {{ color: #ffffff !important; }}
        </style>
    </head>
    <body id="body" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border-collapse: separate; border-spacing: 0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #1e40af; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 36px 32px; text-align: center; border-top-left-radius: 19px; border-top-right-radius: 19px;">
                                <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); padding: 12px 14px; border-radius: 16px; margin-bottom: 12px;">
                                    <span style="font-size: 28px; line-height: 1; color: #ffffff !important;">📅</span>
                                </div>
                                <h1 class="force-white" style="color: #ffffff !important; margin: 0; font-size: 24px; font-weight: 800; font-family: inherit;">
                                    <span style="color: #ffffff !important;">Lịch Cá Nhân</span>
                                </h1>
                                <p class="force-sub" style="color: #dbeafe !important; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">
                                    <span style="color: #dbeafe !important;">Lịch thông minh &amp; Cuộc sống gọn gàng</span>
                                </p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 36px 32px; color: #334155;">
                                <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">{title}</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">Xin chào <strong>{display_name}</strong>,</p>
                                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">{intro}</p>
                                
                                <!-- Notice box -->
                                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 8px; margin-bottom: 28px;">
                                    <p style="margin: 0; font-size: 13.5px; color: #1e40af; line-height: 1.5; font-weight: 500;">
                                        ⏱️ Liên kết xác nhận này sẽ hết hạn trong <strong>5 phút</strong>. Vui lòng bấm vào nút bên dưới để kích hoạt tài khoản.
                                    </p>
                                </div>

                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="{verify_url}" class="force-white" style="background-color: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
                                        <span style="color: #ffffff !important;">Xác nhận Email ➔</span>
                                    </a>
                                </div>

                                <!-- Link fallback -->
                                <p style="font-size: 13px; color: #64748b; margin: 24px 0 8px 0; line-height: 1.4;">Nếu nút trên không hoạt động, hãy copy liên kết sau dán trực tiếp vào thanh địa chỉ của trình duyệt:</p>
                                <div style="background-color: #f1f5f9; padding: 12px 14px; border-radius: 8px; word-break: break-all; font-size: 12.5px; color: #2563eb; font-family: monospace;">
                                    <a href="{verify_url}" style="color: #2563eb; text-decoration: underline;">{verify_url}</a>
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center; border-bottom-left-radius: 19px; border-bottom-right-radius: 19px;">
                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                    Nếu bạn không thực hiện đăng ký tài khoản này, vui lòng bỏ qua email. Tài khoản chưa xác nhận sẽ tự động dọn dẹp sau 5 phút.
                                </p>
                                <p style="margin: 0; font-size: 12px; color: #cbd5e1; font-weight: 600;">
                                    © 2026 Lịch Cá Nhân. Tất cả các quyền được bảo lưu.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return subject, html_message


def build_reset_password_email(user, reset_url):
    """Tạo nội dung HTML email khôi phục mật khẩu cao cấp."""
    subject = "Yêu cầu khôi phục mật khẩu - Lịch Cá Nhân"
    display_name = user.first_name or user.username or "Bạn"

    html_message = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light only">
        <meta name="supported-color-schemes" content="light only">
        <style>
            :root {{
                color-scheme: light only;
                supported-color-schemes: light only;
            }}
            .force-white, .force-white * {{ color: #ffffff !important; }}
            .force-sub, .force-sub * {{ color: #e0e7ff !important; }}
            [data-ogsc] .force-white {{ color: #ffffff !important; }}
            [data-ogsc] .force-sub {{ color: #e0e7ff !important; }}
            u + #body .force-white {{ color: #ffffff !important; }}
        </style>
    </head>
    <body id="body" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border-collapse: separate; border-spacing: 0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #4f46e5; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 36px 32px; text-align: center; border-top-left-radius: 19px; border-top-right-radius: 19px;">
                                <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); padding: 12px 14px; border-radius: 16px; margin-bottom: 12px;">
                                    <span style="font-size: 28px; line-height: 1; color: #ffffff !important;">🔐</span>
                                </div>
                                <h1 class="force-white" style="color: #ffffff !important; margin: 0; font-size: 24px; font-weight: 800; font-family: inherit;">
                                    <span style="color: #ffffff !important;">Khôi Phục Mật Khẩu</span>
                                </h1>
                                <p class="force-sub" style="color: #e0e7ff !important; margin: 6px 0 0 0; font-size: 14px; font-weight: 500;">
                                    <span style="color: #e0e7ff !important;">Hệ thống Lịch Cá Nhân</span>
                                </p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 36px 32px; color: #334155;">
                                <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">Đặt lại mật khẩu tài khoản</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">Xin chào <strong>{display_name}</strong>,</p>
                                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản <strong>{user.email}</strong> của bạn.</p>
                                
                                <!-- Notice box -->
                                <div style="background-color: #f5f3ff; border-left: 4px solid #6366f1; padding: 14px 18px; border-radius: 8px; margin-bottom: 28px;">
                                    <p style="margin: 0; font-size: 13.5px; color: #4338ca; line-height: 1.5; font-weight: 500;">
                                        🔒 Liên kết này có hiệu lực trong <strong>5 phút</strong> và chỉ sử dụng được 1 lần duy nhất.
                                    </p>
                                </div>

                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="{reset_url}" class="force-white" style="background-color: #4f46e5; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);">
                                        <span style="color: #ffffff !important;">Đổi mật khẩu mới ➔</span>
                                    </a>
                                </div>

                                <!-- Link fallback -->
                                <p style="font-size: 13px; color: #64748b; margin: 24px 0 8px 0; line-height: 1.4;">Nếu nút trên không hoạt động, hãy copy liên kết sau dán trực tiếp vào thanh địa chỉ của trình duyệt:</p>
                                <div style="background-color: #f1f5f9; padding: 12px 14px; border-radius: 8px; word-break: break-all; font-size: 12.5px; color: #4f46e5; font-family: monospace;">
                                    <a href="{reset_url}" style="color: #4f46e5; text-decoration: underline;">{reset_url}</a>
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center; border-bottom-left-radius: 19px; border-bottom-right-radius: 19px;">
                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                    Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email. Mật khẩu hiện tại của bạn vẫn hoàn toàn được giữ an toàn.
                                </p>
                                <p style="margin: 0; font-size: 12px; color: #cbd5e1; font-weight: 600;">
                                    © 2026 Lịch Cá Nhân. Tất cả các quyền được bảo lưu.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return subject, html_message


from rest_framework.throttling import ScopedRateThrottle

AUTH_THROTTLE_CLASSES = [] if getattr(settings, 'TESTING', False) else [ScopedRateThrottle]


class RegisterView(APIView):
    """
    POST /api/accounts/register/
    Body: { email, password, full_name? }
    Tạo tài khoản ở trạng thái chờ xác thực (is_active=False),
    gửi email xác nhận và tự động xóa tài khoản sau 5 phút nếu chưa xác thực.
    """
    permission_classes = [AllowAny]
    throttle_classes = AUTH_THROTTLE_CLASSES
    throttle_scope = 'auth'

    def _send_verification_email(self, user, verify_token):
        """Gửi email HTML chứa link xác nhận bất đồng bộ."""
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token.token}"
        subject, html_message = build_verification_email(user, verify_url)
        send_email_async(
            subject=subject,
            message=f"Xác nhận email của bạn bằng cách truy cập: {verify_url}",
            recipient_list=[user.email],
            html_message=html_message,
        )

    def _unique_username(self, base):
        """Tạo username không trùng lặp (tránh 500 khi 2 email cùng local-part)."""
        username = base or 'user'
        n = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{n}"
            n += 1
        return username

    def post(self, request):
        data = request.data.copy()
        if 'email' in data and 'username' not in data:
            data['username'] = self._unique_username(data['email'].split('@')[0])

        serializer = RegisterSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        # Đăng ký xong: khóa tài khoản chờ xác thực
        user.is_active = False
        user.save()

        # Phân quyền mặc định là "Người dùng"
        try:
            group, _ = Group.objects.get_or_create(name='Người dùng')
            user.groups.add(group)
        except Exception:
            pass

        # Tạo token xác thực
        verify_token = EmailVerificationToken.objects.create(user=user)

        # Gửi email ngầm ở background thread
        self._send_verification_email(user, verify_token)

        # Lên lịch tự động xóa sau 5 phút
        schedule_cleanup(user.pk)

        return Response({
            'status': 'pending_verification',
            'email': user.email,
            'message': 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản trong vòng 5 phút.'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    POST /api/accounts/login/
    Body: { email, password }
    Trả về Access token dạng JWT trong JSON body và Refresh Token trong HTTP-Only cookie.
    """
    permission_classes = [AllowAny]
    throttle_classes = AUTH_THROTTLE_CLASSES
    throttle_scope = 'auth'

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
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response = Response({
                'access': access_token,
                'user': UserSerializer(user).data,
            })
            set_refresh_cookie(response, refresh)
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TokenRefreshCookieView(APIView):
    """
    POST /api/accounts/token/refresh/
    Đọc Refresh Token từ HTTP-Only cookie, phát hành Access Token mới và rotate Refresh Token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh_token')
        if not refresh_token:
            return Response({'error': 'No refresh token provided'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_token)
            user_id = refresh.payload.get('user_id')
            user = User.objects.get(id=user_id)

            new_refresh = RefreshToken.for_user(user)
            new_access_token = str(new_refresh.access_token)

            try:
                refresh.blacklist()
            except Exception:
                pass

            response = Response({'access': new_access_token, 'user': UserSerializer(user).data})
            set_refresh_cookie(response, new_refresh)
            return response
        except TokenError as e:
            response = Response({'error': f'Invalid or expired refresh token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)
            response.delete_cookie('refresh_token', path='/api/accounts/')
            return response
        except Exception as e:
            response = Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
            response.delete_cookie('refresh_token', path='/api/accounts/')
            return response


class LogoutView(APIView):
    """
    POST /api/accounts/logout/
    Blacklist Refresh Token và xóa HTTP-Only cookie.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        if hasattr(request.user, 'auth_token'):
            try:
                request.user.auth_token.delete()
            except Exception:
                pass

        auth.logout(request)
        response = Response({'status': 'logged out'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token', path='/api/accounts/')
        return response


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
    throttle_classes = AUTH_THROTTLE_CLASSES
    throttle_scope = 'auth'


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
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            
            # Gửi Email ngầm (non-blocking)
            subject, html_message = build_reset_password_email(user, reset_url)
            send_email_async(
                subject=subject,
                message=f"Vui lòng truy cập đường dẫn sau để khôi phục mật khẩu: {reset_url}",
                recipient_list=[email],
                html_message=html_message,
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
        except (EmailVerificationToken.DoesNotExist, ValueError, ValidationError):
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
    throttle_classes = AUTH_THROTTLE_CLASSES
    throttle_scope = 'auth'


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

        # Gửi lại email ngầm ở background thread
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token.token}"
        subject, html_message = build_verification_email(user, verify_url, resend=True)
        send_email_async(
            subject=subject,
            message=f"Xác nhận email tại: {verify_url}",
            recipient_list=[user.email],
            html_message=html_message,
        )

        return Response({'status': 'Nếu email tồn tại và chưa xác thực, chúng tôi đã gửi lại email xác nhận.'})

        # Reset timer cleanup
        schedule_cleanup(user.pk)

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
