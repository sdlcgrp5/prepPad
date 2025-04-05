from django.shortcuts import render, redirect
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from .serializers import FileUploadSerializer, JobPostingSerializer

from .models import UploadedFile
from .forms import fileUploadForm, jobPostingForm
from .utils import process_resume, extract_job_description
import os


class FileUploadAPIView(APIView):
    parser_classes = (
        MultiPartParser,
        FormParser,
    )  # Add this for file uploads
    serializer_class = FileUploadSerializer

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            print("Serializer is valid!")
            # Save to model
            instance = UploadedFile.objects.create(
                file=request.FILES["file"],
                processed_content="",  # Temporary placeholder
            )

            processed_content = process_resume(f"{instance.file_path()}")
            instance.processed_content = processed_content
            instance.save()
            return Response(
                {
                    "file": instance.file.url,
                    "processed_content": instance.processed_content,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobPostingAPIView(APIView):
    parser_classes = (
        MultiPartParser,
        FormParser,
    )
    serializer_class = JobPostingSerializer

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            job_url = request.data["job_posting_url"]
            job_details = extract_job_description(job_url)
            print(job_details)

            return Response({
                    "url": job_url,
                    "job_details": job_details,
                }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def upload_file(request):
    if request.method == "POST":
        form = fileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_file = form.save(commit=False)
            uploaded_file.save()

            # Process the file after saving
            try:
                print("Begin.")
                processed_content = process_resume(f"{uploaded_file.file_path()}")
                print("Finished.")
                uploaded_file.processed_content = str(processed_content)
                uploaded_file.save()
            except Exception as e:
                # Handle processing errors
                print(f"Error processing file: {str(e)}")

            return redirect("display_file", file_id=uploaded_file.id)
    else:
        form = fileUploadForm()

    return render(request, "file_upload/upload.html", {"form": form})


def job_description_parse(request):
    """
    View to handle job description parsing
    """
    if request.method == "POST":
        form = jobPostingForm(request.POST)
        if form.is_valid():
            job_url = form.cleaned_data["job_posting_url"]

            try:
                # Extract job description
                job_details = extract_job_description(job_url)

                return render(
                    request,
                    "file_upload/job_description_results.html",
                    {"job_details": job_details, "form": form},
                )

            except Exception as e:
                return HttpResponse(f"Error parsing job description: {str(e)}")

    else:
        form = jobPostingForm()

    return render(request, "file_upload/job_description_parse.html", {"form": form})


def display_file(request, file_id):
    try:
        file_obj = UploadedFile.objects.get(pk=file_id)
        file_path = file_obj.file.path

        return render(
            request,
            "file_upload/display.html",
            {
                "filename": os.path.basename(file_path),
                "content": "The resume was processed successfully.",
                "processed_content": file_obj.processed_content,
            },
        )
    except Exception as e:
        return HttpResponse(f"Error: {str(e)}")


def file_list(request):
    files = UploadedFile.objects.all().order_by("-uploaded_at")
    return render(request, "file_upload/list.html", {"files": files})
