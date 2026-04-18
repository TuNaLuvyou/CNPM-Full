from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from management import views as management_views

def api_root(request):
    return JsonResponse({
        "message": "Chào mừng bạn đến với API Lịch của chúng tôi!",
        "endpoints": {
            "admin": "/admin/",
            "events": "/api/events/",
            "tasks": "/api/tasks/",
            "notes": "/api/notes/",
            "contacts": "/api/contacts/",
            "accounts": "/api/accounts/",
        }
    })

urlpatterns = [
    path('', api_root),
    path('admin/', include('management.urls')),
    path('django-admin/', admin.site.urls),
    # Gom tất cả endpoint của các app vào prefix /api/
    path('api/events/', include('events.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/notes/', include('notes.urls')),
    path('api/contacts/', include('contacts.urls')),
    path('api/accounts/', include('accounts.urls')),
    # Support API
    path('api/support/submit/', management_views.SubmitSupportRequestView.as_view(), name='api_support_submit'),
]