from django.db import models


# Model for handling uploaded files
class UploadedFile(models.Model):
    """
    Stores uploaded resume files and processing results.
    
    Fields:
        file: FileField - Uploaded resume file
        uploaded_at: DateTimeField - Upload timestamp
        processed_content: TextField - JSON string of processed data
    """
    file = models.FileField(upload_to="uploads/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_content = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.file.name

    def file_path(self):
        return self.file.path


class Resume(models.Model):
    name = models.CharField(max_length=255)
    contact_info = models.TextField()
    work_experience = models.TextField()
    education = models.TextField()
    skills = models.TextField()
    certifications = models.TextField()
    awards = models.TextField()
    publications = models.TextField()
    projects = models.TextField()
    languages = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class JobPosting(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    qualifications = models.TextField()
    skills = models.TextField()
    responsibilities = models.TextField()
    salary_range = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    posted_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.title


class Profile(models.Model):
    """
    Stores user profile information extracted from resumes.
    
    Fields:
        firstName: CharField
        lastName: CharField
        email: EmailField
        phone: CharField
        zipCode: CharField
        created_at: DateTimeField
        updated_at: DateTimeField
    """
    firstName = models.CharField(max_length=255)
    lastName = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    zipCode = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.firstName} {self.lastName}"


