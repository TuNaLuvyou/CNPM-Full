from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, InvitationViewSet, NotificationViewSet, CalendarGroupViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'invitations', InvitationViewSet, basename='invitation')
router.register(r'calendars', CalendarGroupViewSet, basename='calendar')
router.register(r'', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
]