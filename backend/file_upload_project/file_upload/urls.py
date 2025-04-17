from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    path('', views.fileList, name='file_list'),
    path('upload/', views.uploadFile, name='upload_file'),
    path('display/<int:file_id>/', views.displayFile, name='display_file'),
    path('parse-job/', views.parseJobDescription, name='parse-job'),

    # API URLs
    path('api/analysis/', views.AnalysisAPIView.as_view(), name='analysis'),
    path('api/resume-upload/', views.FileUploadAPIView.as_view(), name='resume-upload'),
    path('api/job-upload/', views.JobPostingAPIView.as_view(), name='job-upload'),
    path('api/profile/', csrf_exempt(views.ProfileAPIView.as_view()), name='profile'),
]