from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from . import views
from . import views_health

# Import production views if not in debug mode
if not settings.DEBUG:
    from . import views_production as views

urlpatterns = [
    path('', views.fileList, name='fileList'),
    path('upload/', views.uploadFile, name='uploadFile'),
    path('display/<int:file_id>/', views.displayFile, name='displayFile'),
    path('parse-job/', views.job_description_parse, name='job_description_parse'),

    # API URLs - Note: CSRF exempt removed for production (handled by DRF)
    path('api/analysis/', views.AnalysisAPIView.as_view(), name='analysis'),
    path('api/resume-upload/', views.FileUploadAPIView.as_view(), name='resume-upload'),
    path('api/job-upload/', views.JobPostingAPIView.as_view(), name='job-upload'),
    path('api/profile/', views.ProfileAPIView.as_view(), name='profile'),
    
    # Health check endpoints for production deployment
    path('api/health/', views_health.health_check, name='health-check'),
    path('api/ready/', views_health.ready_check, name='ready-check'),
    path('api/version/', views_health.version_info, name='version-info'),
]