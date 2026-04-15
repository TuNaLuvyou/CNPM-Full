from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet

router = DefaultRouter()
# Tạo endpoint /api/events/
router.register(r'', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
]