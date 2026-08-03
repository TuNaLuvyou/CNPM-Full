from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, MeView, TokenRefreshCookieView,
    ForgotPasswordView, ResetPasswordView, ValidateResetTokenView, UserSettingsView, ProfileUpdateView,
    FavoriteCalendarsView, FavoriteCalendarDetailView,
    VerifyEmailView, ResendVerificationView,
)

urlpatterns = [
    path('register/',           RegisterView.as_view(),             name='register'),
    path('login/',              LoginView.as_view(),                name='login'),
    path('logout/',             LogoutView.as_view(),               name='logout'),
    path('token/refresh/',      TokenRefreshCookieView.as_view(),   name='token-refresh'),
    path('me/',                 MeView.as_view(),                   name='me'),
    path('forgot-password/',    ForgotPasswordView.as_view(),       name='forgot-password'),
    path('reset-password/',     ResetPasswordView.as_view(),        name='reset-password'),
    path('reset-password/validate/', ValidateResetTokenView.as_view(), name='reset-password-validate'),
    path('verify-email/',       VerifyEmailView.as_view(),          name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(),  name='resend-verification'),
    path('settings/',           UserSettingsView.as_view(),         name='settings'),
    path('profile/update/',     ProfileUpdateView.as_view(),        name='profile-update'),
    # Nhóm 6 — Lịch yêu thích
    path('favorite-calendars/', FavoriteCalendarsView.as_view(),    name='favorite-calendars'),
    path('favorite-calendars/<int:pk>/', FavoriteCalendarDetailView.as_view(), name='favorite-calendar-detail'),
]