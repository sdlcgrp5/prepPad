from django import forms
from .models import UploadedFile

# Form for uploading files
class fileUploadForm(forms.ModelForm):
    class Meta:
        model = UploadedFile
        fields = ["file"]

# Form for uploading job postings
class jobPostingForm(forms.Form):
    job_posting_url = forms.URLField(
        label="Job Posting URL",
        widget=forms.TextInput(
            attrs={"class": "form-control", "placeholder": "Enter the job posting URL"}
        ),
        max_length=500,
    )
