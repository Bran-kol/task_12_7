from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import random

class CustomUserManager(BaseUserManager):
    """Custom user model manager where email is unique for authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'ADMIN')
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    username = None  # remove username
    email = models.EmailField(_('email address'), unique=True)

    # Keep existing fields and add new ones
    first_name = models.CharField(_('first name'), max_length=50, blank=True)
    last_name = models.CharField(_('last name'), max_length=50, blank=True)
    role = models.CharField(max_length=20, choices=[
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('COLLABORATOR', 'Collaborator'),
        ('CLIENT', 'Client'),
    ], default='CLIENT')
    
    # New fields for enhanced functionality
    phone = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    is_online = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})" if self.first_name else self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    @property
    def project_count(self):
        """Count of projects user is assigned to"""
        return self.assigned_projects.count()

    def can_be_assigned_to_project(self):
        """Check if user can be assigned to another project (limit: 3)"""
        return self.project_count < 3

    def get_task_count_for_project(self, project):
        """Count of tasks in a specific project"""
        return self.assigned_tasks.filter(project=project).count()

    def can_be_assigned_to_task_in_project(self, project):
        """Check if user can be assigned to another task in a project (limit: 3 per project)"""
        return self.get_task_count_for_project(project) < 3

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_projects')
    # Fix: Specify through_fields to resolve ambiguity
    assigned_users = models.ManyToManyField(
        CustomUser, 
        through='ProjectAssignment', 
        through_fields=('project', 'user'),
        related_name='assigned_projects'
    )
    client = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='client_projects', 
        limit_choices_to={'role': 'CLIENT'}
    )
    
    # Project status
    STATUS_CHOICES = [
        ('PLANNING', 'Planning'),
        ('ACTIVE', 'Active'),
        ('ON_HOLD', 'On Hold'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNING')
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Project settings
    priority = models.CharField(max_length=20, choices=[
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ], default='MEDIUM')
    
    budget = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def progress_percentage(self):
        """Calculate project progress based on completed tasks"""
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = self.tasks.filter(status='DONE').count()
        return (completed_tasks / total_tasks) * 100

    @property
    def task_stats(self):
        """Get task statistics for this project"""
        tasks = self.tasks.all()
        return {
            'total': tasks.count(),
            'todo': tasks.filter(status='TODO').count(),
            'in_progress': tasks.filter(status='IN_PROGRESS').count(),
            'in_review': tasks.filter(status='IN_REVIEW').count(),
            'done': tasks.filter(status='DONE').count(),
        }

class ProjectAssignment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='project_assignments_made'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    # Role in project
    ROLE_CHOICES = [
        ('MANAGER', 'Project Manager'),
        ('COLLABORATOR', 'Collaborator'),
        ('CLIENT', 'Client'),
    ]
    role_in_project = models.CharField(max_length=20, choices=ROLE_CHOICES)

    class Meta:
        unique_together = ['project', 'user']

    def __str__(self):
        return f"{self.user.full_name} - {self.project.name} ({self.role_in_project})"

class Task(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_tasks')
    # Fix: Specify through_fields to resolve ambiguity
    assigned_to = models.ManyToManyField(
        CustomUser, 
        through='TaskAssignment', 
        through_fields=('task', 'user'),
        related_name='assigned_tasks'
    )
    
    # Task status for Kanban board
    STATUS_CHOICES = [
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('IN_REVIEW', 'In Review'),
        ('DONE', 'Done'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    
    # Task priority
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    # Dates
    due_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Task details
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    actual_hours = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    
    # Kanban position
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['position', '-created_at']

    def __str__(self):
        return f"{self.title} - {self.project.name}"

    def save(self, *args, **kwargs):
        # Set completed_at when task is marked as done
        if self.status == 'DONE' and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != 'DONE' and self.completed_at:
            self.completed_at = None
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.status == 'DONE':
            return False
        return timezone.now() > self.due_date

    @property
    def days_until_due(self):
        """Calculate days until due date"""
        if self.status == 'DONE':
            return None
        delta = self.due_date.date() - timezone.now().date()
        return delta.days

class TaskAssignment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='task_assignments_made'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['task', 'user']

    def __str__(self):
        return f"{self.user.full_name} - {self.task.title}"

class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # For file attachments
    attachment = models.FileField(upload_to='task_attachments/', blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user.full_name} on {self.task.title}"

class ActivityLog(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional references to objects
    project = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, blank=True, null=True)
    
    # IP address for admin logs
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} - {self.action}"

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Notification types
    TYPE_CHOICES = [
        ('TASK_ASSIGNED', 'Task Assigned'),
        ('TASK_COMPLETED', 'Task Completed'),
        ('TASK_OVERDUE', 'Task Overdue'),
        ('PROJECT_ASSIGNED', 'Project Assigned'),
        ('PROJECT_COMPLETED', 'Project Completed'),
        ('COMMENT_ADDED', 'Comment Added'),
        ('SYSTEM', 'System Notification'),
    ]
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Status
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional references
    project = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.full_name}"

class PasswordResetCode(models.Model):
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = '{:06d}'.format(random.randint(0, 999999))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Reset code for {self.user.email}"