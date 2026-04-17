from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactViewSet, ConnectionViewSet, UserSearchViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'connections', ConnectionViewSet, basename='connection')
router.register(r'search', UserSearchViewSet, basename='user-search')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'', ContactViewSet, basename='contact')

urlpatterns = [
    path('', include(router.urls)),
]