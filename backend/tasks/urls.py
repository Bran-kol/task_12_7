from django.urls import path
from .views import (
    CustomTokenObtainPairView, DashboardStatsView, RecentTasksView, ActiveProjectsView,
    UserListView, UserDetailView, ProjectListView, ProjectDetailView,
    TaskListView, TaskDetailView, KanbanBoardView, AvailableUsersView,
    NotificationListView, MarkNotificationReadView,
    ForgotPasswordView, VerifyResetCodeView, ChangePasswordView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('auth/verify-code/', VerifyResetCodeView.as_view(), name='verify_code'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Dashboard
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/recent-tasks/', RecentTasksView.as_view(), name='recent_tasks'),
    path('dashboard/active-projects/', ActiveProjectsView.as_view(), name='active_projects'),
    
    # User Management
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('users/available/', AvailableUsersView.as_view(), name='available_users'),
    
    # Project Management
    path('projects/', ProjectListView.as_view(), name='project_list'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project_detail'),
    path('projects/<int:project_id>/kanban/', KanbanBoardView.as_view(), name='kanban_board'),
    
    # Task Management
    path('tasks/', TaskListView.as_view(), name='task_list'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task_detail'),
    
    # Notifications
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:notification_id>/read/', MarkNotificationReadView.as_view(), name='mark_notification_read'),
]