from django.shortcuts import render, get_object_or_404, redirect
import secrets
import string
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.cache import never_cache
from django.contrib.auth.models import User, Group
from django.contrib import messages
from .models import SupportRequest
from events.models import Notification
from django.db.models import Count, Q

def ensure_default_groups():
    """ Đảm bảo các nhóm cơ bản luôn tồn tại """
    Group.objects.get_or_create(name='Quản trị viên')
    Group.objects.get_or_create(name='Người dùng')

@never_cache
def admin_login(request):
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('admin_dashboard')
        
    error = None
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            if user.is_staff:
                auth_login(request, user)
                next_url = request.GET.get('next', 'admin_dashboard')
                return redirect(next_url)
            else:
                error = "Bạn không có quyền truy cập vào khu vực quản trị!"
        else:
            error = "Tài khoản hoặc mật khẩu không chính xác!"
            
    return render(request, 'management/login.html', {'error': error})

@never_cache
@staff_member_required(login_url='admin_login')
def admin_dashboard(request):
    ensure_default_groups()
    stats = {
        'total_users': User.objects.count(),
        'pending_requests': SupportRequest.objects.filter(status='pending').count(),
        'resolved_requests': SupportRequest.objects.filter(status='resolved').count(),
        'total_groups': Group.objects.count(),
    }
    recent_users = User.objects.all().order_by('-date_joined')[:5]
    recent_requests = SupportRequest.objects.all().order_by('-created_at')[:5]
    
    return render(request, 'management/dashboard.html', {
        'stats': stats,
        'recent_users': recent_users,
        'recent_requests': recent_requests
    })

@staff_member_required(login_url='admin_login')
def user_list(request):
    ensure_default_groups()
    query = request.GET.get('q', '')
    role_id = request.GET.get('role', '')
    
    users = User.objects.all().prefetch_related('groups')
    
    if query:
        users = users.filter(
            Q(username__icontains=query) | 
            Q(email__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )
    
    if role_id:
        users = users.filter(groups__id=role_id)
        
    users = users.order_by('id')
    
    all_groups = Group.objects.all()
    return render(request, 'management/users.html', {
        'users': users,
        'all_groups': all_groups,
        'current_query': query,
        'current_role': role_id
    })

@staff_member_required(login_url='admin_login')
def toggle_user_status(request, user_id):
    user = get_object_or_404(User, id=user_id)
    if user == request.user:
        messages.error(request, "Bạn không thể tự khoá tài khoản của chính mình!")
    else:
        user.is_active = not user.is_active
        user.save()
        status_str = "kích hoạt" if user.is_active else "khoá"
        messages.success(request, f"Đã {status_str} tài khoản {user.username}")
    return redirect('admin_users')

@staff_member_required(login_url='admin_login')
def assign_user_groups(request, user_id):
    if request.method == 'POST':
        user = get_object_or_404(User, id=user_id)
        if user == request.user and not user.is_superuser:
            messages.error(request, "Bạn không thể tự cấu hình nhóm của chính mình!")
        else:
            group_ids = request.POST.getlist('groups')
            selected_groups = Group.objects.filter(id__in=group_ids)
            user.groups.set(selected_groups)
            
            # Đồng bộ is_staff với nhóm "Quản trị viên"
            user.is_staff = selected_groups.filter(name='Quản trị viên').exists()
            user.save()
            
            role_name = selected_groups.first().name if selected_groups.exists() else "Người dùng"
            messages.success(request, f"Đã cập nhật vai trò của {user.username} thành {role_name}")
    return redirect('admin_users')

@staff_member_required(login_url='admin_login')
def support_list(request):
    requests = SupportRequest.objects.all().order_by('-created_at')
    return render(request, 'management/support.html', {'requests': requests})

@staff_member_required(login_url='admin_login')
def resolve_request(request, req_id):
    sr = get_object_or_404(SupportRequest, id=req_id)
    sr.status = 'resolved'
    sr.save()
    messages.success(request, f"Đã đánh dấu hoàn thành yêu cầu #{sr.id}")
    return redirect('admin_support')

@staff_member_required(login_url='admin_login')
def delete_support_request(request, req_id):
    sr = get_object_or_404(SupportRequest, id=req_id)
    sr.delete()
    messages.success(request, f"Đã xoá vĩnh viễn yêu cầu #{req_id}")
    return redirect('admin_support')

@staff_member_required(login_url='admin_login')
def reset_user_password(request, req_id):
    if request.method == 'POST':
        sr = get_object_or_404(SupportRequest, id=req_id)
        user = sr.user
        
        # 1. Tạo mật khẩu ngẫu nhiên (sử dụng secrets để an toàn hơn)
        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for i in range(10))
        
        # 2. Cập nhật cho User
        user.set_password(new_password)
        user.save()
        
        # 3. Cập nhật Support Request
        sr.status = 'resolved'
        sr.admin_note = f"Đã cấp lại mật khẩu mới: {new_password}"
        sr.save()
        
        # 4. Gửi thông báo bảo mật cho người dùng
        Notification.objects.create(
            user=user,
            ntype='security',
            content="Mật khẩu của bạn đã được Quản trị viên thay đổi theo yêu cầu. Vui lòng kiểm tra và đăng nhập bằng mật khẩu mới."
        )
        
        messages.success(request, f"Đã tạo mật khẩu mới cho {user.username}: {new_password}")
    return redirect('admin_support')

@staff_member_required(login_url='admin_login')
def role_list(request):
    groups = Group.objects.all().annotate(user_count=Count('user'))
    return render(request, 'management/roles.html', {'groups': groups})

@staff_member_required(login_url='admin_login')
def add_group(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        if name:
            if Group.objects.filter(name=name).exists():
                messages.error(request, f"Nhóm '{name}' đã tồn tại!")
            else:
                Group.objects.create(name=name)
                messages.success(request, f"Đã tạo nhóm '{name}' thành công.")
        else:
            messages.error(request, "Tên nhóm không được để trống!")
    return redirect('admin_roles')

@staff_member_required
def delete_group(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    if group.name in ['Quản trị viên', 'Người dùng']:
        messages.error(request, "Không thể xoá các nhóm mặc định của hệ thống!")
    else:
        name = group.name
        group.delete()
        messages.success(request, f"Đã xoá nhóm '{name}'.")
    return redirect('admin_roles')

@staff_member_required(login_url='admin_login')
def send_broadcast(request):
    if request.method == 'POST':
        content = request.POST.get('content')
        if content:
            users = User.objects.all()
            notifications = []
            for user in users:
                notifications.append(Notification(
                    user=user,
                    ntype='system',
                    content=content
                ))
            
            # Sử dụng bulk_create để tối ưu hiệu năng nếu số lượng user lớn
            Notification.objects.bulk_create(notifications)
            
            messages.success(request, f"Đã phát thông báo thành công tới {users.count()} người dùng.")
            return redirect('admin_broadcast')
        else:
            messages.error(request, "Nội dung thông báo không được để trống!")
            
    return render(request, 'management/broadcast.html')

# --- API cho người dùng gửi yêu cầu ---
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class SubmitSupportRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        rtype = request.data.get('type', 'other')
        subject = request.data.get('subject')
        message = request.data.get('message')

        if not subject or not message:
            return Response({'error': 'Thiếu tiêu đề hoặc nội dung'}, status=status.HTTP_400_BAD_REQUEST)

        sr = SupportRequest.objects.create(
            user=request.user,
            request_type=rtype,
            subject=subject,
            message=message
        )
        return Response({'id': sr.id, 'status': 'Yêu cầu của bạn đã được gửi thành công.'}, status=status.HTTP_201_CREATED)
