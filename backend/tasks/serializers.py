from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
from django.conf import settings

User = get_user_model()

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    remember = serializers.BooleanField(default=False, required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        remember = attrs.get('remember', False)

        user = authenticate(request=self.context.get('request'), username=email, password=password)

        if user is None:
            raise serializers.ValidationError({"detail": "No active account found with the given credentials"})

        data = self.get_token_response(user, remember)
        return data

    def get_token_response(self, user, remember):
        refresh = self.get_token(user)
        if remember:
            refresh.set_exp(lifetime=timedelta(days=7))
            refresh.access_token.set_exp(lifetime=timedelta(days=7))
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'role': user.role,
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
                'is_online': user.is_online,
            }
        }
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

# User Serializers
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    project_count = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'profile_picture', 'is_active', 'is_online',
            'date_joined', 'last_login', 'project_count'
        ]
        read_only_fields = ['date_joined', 'last_login']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role', 'phone']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class AvailableUserSerializer(serializers.ModelSerializer):
    """Serializer for users available for assignment"""
    full_name = serializers.ReadOnlyField()
    project_count = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'project_count']

# Simple serializers to avoid circular imports
class SimpleUserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role']

class SimpleProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = 'tasks.Project'
        fields = ['id', 'name', 'status', 'priority']

class SimpleTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = 'tasks.Task'
        fields = ['id', 'title', 'status', 'priority']

# Import models after defining simple serializers
from .models import (
    Project, ProjectAssignment, Task, TaskAssignment, 
    TaskComment, ActivityLog, Notification
)

# Project Serializers
class ProjectAssignmentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    assigned_by = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = ProjectAssignment
        fields = ['id', 'user', 'assigned_by', 'assigned_at', 'role_in_project']

class ProjectSerializer(serializers.ModelSerializer):
    created_by = SimpleUserSerializer(read_only=True)
    client = SimpleUserSerializer(read_only=True)
    assigned_users = SimpleUserSerializer(many=True, read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    task_stats = serializers.ReadOnlyField()
    assignments = ProjectAssignmentSerializer(source='projectassignment_set', many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'priority', 'budget',
            'start_date', 'end_date', 'created_at', 'updated_at',
            'created_by', 'client', 'assigned_users', 'assignments',
            'progress_percentage', 'task_stats'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

class ProjectCreateSerializer(serializers.ModelSerializer):
    assigned_users = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Project
        fields = [
            'name', 'description', 'status', 'priority', 'budget',
            'start_date', 'end_date', 'client', 'assigned_users'
        ]
    
    def create(self, validated_data):
        assigned_users = validated_data.pop('assigned_users', [])
        project = Project.objects.create(**validated_data)
        
        # Assign users to project
        for user_id in assigned_users:
            try:
                user = User.objects.get(id=user_id)
                if user.can_be_assigned_to_project():
                    ProjectAssignment.objects.create(
                        project=project,
                        user=user,
                        assigned_by=self.context['request'].user,
                        role_in_project=user.role
                    )
            except User.DoesNotExist:
                continue
        
        return project

# Task Serializers
class TaskAssignmentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    assigned_by = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = TaskAssignment
        fields = ['id', 'user', 'assigned_by', 'assigned_at']

class TaskCommentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'user', 'content', 'attachment', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    created_by = SimpleUserSerializer(read_only=True)
    assigned_to = SimpleUserSerializer(many=True, read_only=True)
    project = SimpleProjectSerializer(read_only=True)
    assignments = TaskAssignmentSerializer(source='taskassignment_set', many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority', 'position',
            'due_date', 'created_at', 'updated_at', 'completed_at',
            'estimated_hours', 'actual_hours', 'is_overdue', 'days_until_due',
            'created_by', 'assigned_to', 'project', 'assignments', 'comments'
        ]
        read_only_fields = ['created_at', 'updated_at', 'completed_at', 'created_by']

class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_to = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'priority', 'due_date', 
            'estimated_hours', 'project', 'assigned_to'
        ]
    
    def create(self, validated_data):
        assigned_to = validated_data.pop('assigned_to', [])
        task = Task.objects.create(**validated_data)
        
        # Assign users to task
        for user_id in assigned_to:
            try:
                user = User.objects.get(id=user_id)
                if user.can_be_assigned_to_task_in_project(task.project):
                    TaskAssignment.objects.create(
                        task=task,
                        user=user,
                        assigned_by=self.context['request'].user
                    )
            except User.DoesNotExist:
                continue
        
        return task

class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'status', 'priority', 'due_date', 'estimated_hours', 'actual_hours', 'position']

# Notification Serializers
class NotificationSerializer(serializers.ModelSerializer):
    project = SimpleProjectSerializer(read_only=True)
    task = SimpleTaskSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'is_read',
            'created_at', 'project', 'task'
        ]
        read_only_fields = ['created_at']

# Activity Log Serializers
class ActivityLogSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    project = SimpleProjectSerializer(read_only=True)
    task = SimpleTaskSerializer(read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'action', 'description', 'created_at',
            'project', 'task', 'ip_address'
        ]
        read_only_fields = ['created_at']