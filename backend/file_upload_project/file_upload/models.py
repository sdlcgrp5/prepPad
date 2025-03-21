from django.db import models

# Model for handling uploaded files
class UploadedFile(models.Model):
    file = models.FileField(upload_to="uploads/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_content = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.file.name
    
    def file_path(self):
        return self.file.path
