from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Q
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import bcrypt

from .models import (
    CustomUser, Project, Task, ProjectAssignment, TaskAssignment, 
    TaskComment, ActivityLog, Notification, PasswordResetCode
)
from .serializers import (
    EmailTokenObtainPairSerializer, UserSerializer, UserCreateSerializer,
    ProjectSerializer, ProjectCreateSerializer, TaskSerializer, 
    TaskCreateSerializer, TaskUpdateSerializer, NotificationSerializer,
    ActivityLogSerializer, AvailableUserSerializer
)

User = get_user_model()

# Authentication Views
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)

        if bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return Response({'message': 'Login successful', 'user_id': user.id, 'role': user.role})
        else:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)

# Dashboard Views
class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Base stats that will be customized by role
        stats = {}
        
        if user.role == 'ADMIN':
            stats = {
                'total_users': User.objects.count(),
                'active_projects': Project.objects.filter(status='ACTIVE').count(),
                'total_tasks': Task.objects.count(),
                'completed_tasks': Task.objects.filter(status='DONE').count(),
                'system_issues': ActivityLog.objects.filter(
                    action__icontains='error',
                    created_at__gte=timezone.now() - timedelta(days=7)
                ).count()
            }
        
        elif user.role == 'MANAGER':
            user_projects = Project.objects.filter(
                Q(created_by=user) | Q(assigned_users=user)
            ).distinct()
            
            stats = {
                'managed_projects': user_projects.count(),
                'active_projects': user_projects.filter(status='ACTIVE').count(),
                'team_tasks': Task.objects.filter(project__in=user_projects).count(),
                'completed_tasks': Task.objects.filter(
                    project__in=user_projects, 
                    status='DONE'
                ).count(),
                'overdue_tasks': Task.objects.filter(
                    project__in=user_projects,
                    due_date__lt=timezone.now(),
                    status__in=['TODO', 'IN_PROGRESS']
                ).count()
            }
        
        elif user.role == 'COLLABORATOR':
            user_tasks = Task.objects.filter(assigned_to=user)
            
            stats = {
                'my_tasks': user_tasks.count(),
                'completed_tasks': user_tasks.filter(status='DONE').count(),
                'in_progress': user_tasks.filter(status='IN_PROGRESS').count(),
                'pending_tasks': user_tasks.filter(status='TODO').count(),
                'overdue_tasks': user_tasks.filter(
                    due_date__lt=timezone.now(),
                    status__in=['TODO', 'IN_PROGRESS']
                ).count()
            }
        
        elif user.role == 'CLIENT':
            client_projects = Project.objects.filter(client=user)
            
            stats = {
                'my_projects': client_projects.count(),
                'active_projects': client_projects.filter(status='ACTIVE').count(),
                'completed_projects': client_projects.filter(status='COMPLETED').count(),
                'total_tasks': Task.objects.filter(project__in=client_projects).count(),
                'pending_review': Task.objects.filter(
                    project__in=client_projects,
                    status='IN_REVIEW'
                ).count()
            }
        
        return Response({'stats': stats})

class RecentTasksView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'ADMIN':
            tasks = Task.objects.all()[:10]
        elif user.role == 'MANAGER':
            user_projects = Project.objects.filter(
                Q(created_by=user) | Q(assigned_users=user)
            ).distinct()
            tasks = Task.objects.filter(project__in=user_projects)[:10]
        elif user.role == 'COLLABORATOR':
            tasks = Task.objects.filter(assigned_to=user)[:10]
        elif user.role == 'CLIENT':
            client_projects = Project.objects.filter(client=user)
            tasks = Task.objects.filter(project__in=client_projects)[:10]
        else:
            tasks = Task.objects.none()
        
        serializer = TaskSerializer(tasks, many=True)
        return Response({'tasks': serializer.data})

class ActiveProjectsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.role == 'ADMIN':
            projects = Project.objects.filter(status='ACTIVE')[:5]
        elif user.role == 'MANAGER':
            projects = Project.objects.filter(
                Q(created_by=user) | Q(assigned_users=user),
                status='ACTIVE'
            ).distinct()[:5]
        elif user.role == 'COLLABORATOR':
            projects = Project.objects.filter(
                assigned_users=user,
                status='ACTIVE'
            )[:5]
        elif user.role == 'CLIENT':
            projects = Project.objects.filter(
                client=user,
                status='ACTIVE'
            )[:5]
        else:
            projects = Project.objects.none()
        
        serializer = ProjectSerializer(projects, many=True)
        return Response({'projects': serializer.data})

# User Management Views (Admin only)
class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.all()

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.all()

# Project Management Views
class ProjectListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateSerializer
        return ProjectSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Project.objects.all()
        elif user.role == 'MANAGER':
            return Project.objects.filter(
                Q(created_by=user) | Q(assigned_users=user)
            ).distinct()
        elif user.role == 'COLLABORATOR':
            return Project.objects.filter(assigned_users=user)
        elif user.role == 'CLIENT':
            return Project.objects.filter(client=user)
        else:
            return Project.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Project.objects.all()
        elif user.role == 'MANAGER':
            return Project.objects.filter(
                Q(created_by=user) | Q(assigned_users=user)
            ).distinct()
        elif user.role in ['COLLABORATOR', 'CLIENT']:
            return Project.objects.filter(
                Q(assigned_users=user) | Q(client=user)
            ).distinct()
        else:
            return Project.objects.none()

# Task Management Views
class TaskListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskSerializer
    
    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get('project_id')
        
        if user.role == 'ADMIN':
            queryset = Task.objects.all()
        elif user.role == 'MANAGER':
            user_projects = Project.objects.filter(
                Q(created_by=user) | Q(assigned_users=user)
            ).distinct()
            queryset = Task.objects.filter(project__in=user_projects)
        elif user.role == 'COLLABORATOR':
            queryset = Task.objects.filter(assigned_to=user)
        elif user.role == 'CLIENT':
            client_projects = Project.objects.filter(client=user)
            queryset = Task.objects.filter(project__in=client_projects)
        else:
            queryset = Task.objects.none()
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Task.objects.all()
        elif user.role == 'MANAGER':
            user_projects = Project.objects.filter(
                Q(created_by=user) | Q(assigned_users=user)
            ).distinct()
            return Task.objects.filter(project__in=user_projects)
        elif user.role == 'COLLABORATOR':
            return Task.objects.filter(assigned_to=user)
        elif user.role == 'CLIENT':
            client_projects = Project.objects.filter(client=user)
            return Task.objects.filter(project__in=client_projects)
        else:
            return Task.objects.none()

# Kanban Board View
class KanbanBoardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        user = request.user
        
        # Check if user has access to this project
        try:
            if user.role == 'ADMIN':
                project = Project.objects.get(id=project_id)
            elif user.role == 'MANAGER':
                project = Project.objects.get(
                    Q(id=project_id) & 
                    (Q(created_by=user) | Q(assigned_users=user))
                )
            elif user.role in ['COLLABORATOR', 'CLIENT']:
                project = Project.objects.get(
                    Q(id=project_id) & 
                    (Q(assigned_users=user) | Q(client=user))
                )
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get tasks organized by status
        tasks = Task.objects.filter(project=project)
        
        kanban_data = {
            'project': ProjectSerializer(project).data,
            'columns': {
                'TODO': TaskSerializer(tasks.filter(status='TODO'), many=True).data,
                'IN_PROGRESS': TaskSerializer(tasks.filter(status='IN_PROGRESS'), many=True).data,
                'IN_REVIEW': TaskSerializer(tasks.filter(status='IN_REVIEW'), many=True).data,
                'DONE': TaskSerializer(tasks.filter(status='DONE'), many=True).data,
            }
        }
        
        return Response(kanban_data)

# Available Users for Assignment
class AvailableUsersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        project_id = request.query_params.get('project_id')
        
        if user.role not in ['ADMIN', 'MANAGER']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get users that can be assigned to projects
        available_users = User.objects.filter(
            role__in=['MANAGER', 'COLLABORATOR']
        )
        
        # Filter users who haven't exceeded their project limit
        filtered_users = []
        for u in available_users:
            if u.can_be_assigned_to_project():
                filtered_users.append(u)
        
        # If checking for task assignment, also check task limits
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                task_filtered_users = []
                for u in filtered_users:
                    if u.can_be_assigned_to_task_in_project(project):
                        task_filtered_users.append(u)
                filtered_users = task_filtered_users
            except Project.DoesNotExist:
                pass
        
        serializer = AvailableUserSerializer(filtered_users, many=True)
        return Response({'users': serializer.data})

# Notifications
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=request.user
            )
            notification.is_read = True
            notification.save()
            return Response({'message': 'Notification marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

# Password Reset Views (keep existing ones)
class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If an account with that email exists, a code has been sent.'})

        # Invalidate old codes
        PasswordResetCode.objects.filter(user=user).update(is_used=True)
        reset_code = PasswordResetCode.objects.create(user=user)
        
        # Send code via email
        subject = 'Password Reset Code'
        message = f"Hi,\n\nYour password reset code is: {reset_code.code}\n\nThis code will expire in 10 minutes."
        send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=False)
        
        return Response({'message': 'If an account with that email exists, a code has been sent.'})

class VerifyResetCodeView(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_code = PasswordResetCode.objects.filter(user=user, is_used=False).latest('created_at')
        except PasswordResetCode.DoesNotExist:
            return Response({'error': 'No valid code found'}, status=status.HTTP_400_BAD_REQUEST)

        # Check code validity (10 minutes expiration)
        if timezone.now() > reset_code.created_at + timedelta(minutes=10):
            return Response({'error': 'Code expired'}, status=status.HTTP_400_BAD_REQUEST)

        if reset_code.code != code:
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Code verified. You can now reset your password.'})

class ChangePasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        password = request.data.get('password')
        
        if not email or not code or not password:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_code = PasswordResetCode.objects.filter(user=user, is_used=False).latest('created_at')
        except PasswordResetCode.DoesNotExist:
            return Response({'error': 'No valid code found'}, status=status.HTTP_400_BAD_REQUEST)

        # Check code validity (10 minutes expiration)
        if timezone.now() > reset_code.created_at + timedelta(minutes=10):
            return Response({'error': 'Code expired'}, status=status.HTTP_400_BAD_REQUEST)

        if reset_code.code != code:
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        # Update password and mark code as used
        user.set_password(password)
        user.save()
        reset_code.is_used = True
        reset_code.save()

        return Response({'message': 'Password reset successful'})