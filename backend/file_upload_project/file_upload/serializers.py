from rest_framework.serializers import Serializer, ModelSerializer, URLField, FileField
from .models import UploadedFile


class FileUploadSerializer(ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ["file"]


class JobPostingSerializer(Serializer):
    job_posting_url = URLField(max_length=500)

class AnalysisSerializer(Serializer):
    job_posting_url = URLField(max_length=500)
    file = FileField()
