from django.contrib import admin
from django.urls import path, include
from tasks.auth_views import EmailTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf.urls.static import static
from django.conf import settings
from corsheaders.defaults import default_headers


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('tasks.urls')),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)