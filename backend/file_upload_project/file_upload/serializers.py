from rest_framework.serializers import Serializer, ModelSerializer, URLField, FileField
from .models import UploadedFile, Profile, Experience, Education, Skills, Resume
import json


class FileUploadSerializer(ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ["file"]


class ResumeSerializer(ModelSerializer):
    class Meta:
        model = Resume
        fields = ['name', 'contact_info', 'work_experience', 'education', 'skills']

    def create(self, validated_data):
        # Ensure the data is stored as JSON strings
        for field in ['contact_info', 'work_experience', 'education', 'skills']:
            if field in validated_data and not isinstance(validated_data[field], str):
                validated_data[field] = json.dumps(validated_data[field])
        return super().create(validated_data)


class JobPostingSerializer(Serializer):
    job_posting_url = URLField(max_length=500)


class AnalysisSerializer(Serializer):
    job_posting_url = URLField(max_length=500)
    file = FileField()
