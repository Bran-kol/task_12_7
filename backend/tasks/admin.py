from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    CustomUser, Project, ProjectAssignment, Task, TaskAssignment, 
    TaskComment, ActivityLog, Notification, PasswordResetCode
)

@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'is_online')
    list_filter = ('role', 'is_active', 'is_online', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'profile_picture')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Status', {'fields': ('is_online', 'last_login_ip')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role'),
        }),
    )

class ProjectAssignmentInline(admin.TabularInline):
    model = ProjectAssignment
    extra = 1

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'priority', 'created_by', 'client', 'start_date', 'end_date')
    list_filter = ('status', 'priority', 'created_at')
    search_fields = ('name', 'description')
    date_hierarchy = 'created_at'
    inlines = [ProjectAssignmentInline]
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new project
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

class TaskAssignmentInline(admin.TabularInline):
    model = TaskAssignment
    extra = 1

class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 1

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'priority', 'created_by', 'due_date', 'is_overdue')
    list_filter = ('status', 'priority', 'project', 'created_at')
    search_fields = ('title', 'description')
    date_hierarchy = 'created_at'
    inlines = [TaskAssignmentInline, TaskCommentInline]
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new task
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'project', 'role_in_project', 'assigned_by', 'assigned_at')
    list_filter = ('role_in_project', 'assigned_at')
    search_fields = ('user__email', 'project__name')

@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'assigned_by', 'assigned_at')
    list_filter = ('assigned_at',)
    search_fields = ('user__email', 'task__title')

@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('task__title', 'user__email', 'content')

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'created_at', 'ip_address')
    list_filter = ('action', 'created_at')
    search_fields = ('user__email', 'action', 'description')
    date_hierarchy = 'created_at'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__email', 'title', 'message')
    date_hierarchy = 'created_at'

@admin.register(PasswordResetCode)
class PasswordResetCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'is_used')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'code')
    readonly_fields = ('code',)