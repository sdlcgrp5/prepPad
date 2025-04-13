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


class Profile(models.Model):
    firstName = models.CharField(max_length=255)
    lastName = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    zipCode = models.CharField(max_length=10, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.firstName} {self.lastName}"


class Experience(models.Model):
    profile = models.ForeignKey(Profile, related_name='experiences', on_delete=models.CASCADE)
    jobTitle = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    startDate = models.CharField(max_length=50)
    endDate = models.CharField(max_length=50)
    location = models.CharField(max_length=255, blank=True)
    jobDescription = models.TextField()

    def __str__(self):
        return f"{self.jobTitle} at {self.company}"


class Education(models.Model):
    profile = models.ForeignKey(Profile, related_name='education', on_delete=models.CASCADE)
    highestDegree = models.CharField(max_length=255)
    fieldOfStudy = models.CharField(max_length=255)
    institution = models.CharField(max_length=255)
    graduationYear = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.highestDegree} in {self.fieldOfStudy}"


class Skills(models.Model):
    profile = models.ForeignKey(Profile, related_name='skills', on_delete=models.CASCADE)
    skills = models.JSONField()

    def __str__(self):
        return f"Skills for {self.profile}"


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
