from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, InvitationViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'invitations', InvitationViewSet, basename='invitation')
router.register(r'', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
]