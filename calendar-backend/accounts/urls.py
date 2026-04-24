from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, MeView,
    ForgotPasswordView, UserSettingsView, ProfileUpdateView,
    FavoriteCalendarsView, FavoriteCalendarDetailView,
)

urlpatterns = [
    path('register/',           RegisterView.as_view(),             name='register'),
    path('login/',              LoginView.as_view(),                name='login'),
    path('logout/',             LogoutView.as_view(),               name='logout'),
    path('me/',                 MeView.as_view(),                   name='me'),
    path('forgot-password/',    ForgotPasswordView.as_view(),       name='forgot-password'),
    path('settings/',           UserSettingsView.as_view(),         name='settings'),
    path('profile/update/',     ProfileUpdateView.as_view(),        name='profile-update'),
    # Nhóm 6 — Lịch yêu thích
    path('favorite-calendars/', FavoriteCalendarsView.as_view(),    name='favorite-calendars'),
    path('favorite-calendars/<int:pk>/', FavoriteCalendarDetailView.as_view(), name='favorite-calendar-detail'),
]