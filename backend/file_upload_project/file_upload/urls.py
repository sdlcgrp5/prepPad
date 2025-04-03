from django.urls import path
from . import views

urlpatterns = [
    path('', views.file_list, name='file_list'),
    path('upload/', views.upload_file, name='upload_file'),
    path('display/<int:file_id>/', views.display_file, name='display_file'),
    path('parse-job/', views.job_description_parse, name='job_description_parse'),

    # API URLs
    path('api/resume-upload/', views.FileUploadAPIView.as_view(), name='resume-upload'),
    path('api/job-upload/', views.JobPostingAPIView.as_view(), name='job-upload'),
]