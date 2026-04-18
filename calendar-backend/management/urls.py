from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.admin_login, name='admin_login'),
    path('', views.admin_dashboard, name='admin_dashboard'),
    path('users/', views.user_list, name='admin_users'),
    path('users/<int:user_id>/toggle/', views.toggle_user_status, name='toggle_user_status'),
    path('users/<int:user_id>/assign-groups/', views.assign_user_groups, name='assign_user_groups'),
    path('support/', views.support_list, name='admin_support'),
    path('support/<int:req_id>/resolve/', views.resolve_request, name='resolve_request'),
    path('support/<int:req_id>/delete/', views.delete_support_request, name='delete_support_request'),
    path('support/<int:req_id>/reset-password/', views.reset_user_password, name='reset_user_password'),
    path('roles/', views.role_list, name='admin_roles'),
    path('roles/add/', views.add_group, name='add_group'),
    path('roles/<int:group_id>/delete/', views.delete_group, name='delete_group'),
    path('broadcast/', views.send_broadcast, name='admin_broadcast'),
    # API endpoints
]
