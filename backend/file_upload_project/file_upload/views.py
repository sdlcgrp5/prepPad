from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
import logging
import os
import json
from .serializers import AnalysisSerializer, FileUploadSerializer, JobPostingSerializer
from .models import UploadedFile
from .forms import fileUploadForm, jobPostingForm
from .utils import process_resume, extract_job_description, resume_job_desc_analysis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnalysisAPIView(APIView):
    """API view to handle resume analysis against job posting"""
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = AnalysisSerializer

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            instance = UploadedFile.objects.create(
                file=request.FILES["file"],
                processed_content=""
            )
            job_url = request.data["job_posting_url"]
            analysis = resume_job_desc_analysis(instance.file_path(), job_url)

            return Response({
                "file": instance.file.url,
                "url": job_url,
                "analysis": analysis
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error in analysis: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FileUploadAPIView(APIView):
    """API view to handle file uploads"""
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = FileUploadSerializer

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            instance = UploadedFile.objects.create(
                file=request.FILES["file"],
                processed_content=""
            )
            processed_content = process_resume(instance.file_path())
            instance.processed_content = processed_content
            instance.save()

            return Response({
                "file": instance.file.url,
                "processed_content": instance.processed_content
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error in file upload: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class JobPostingAPIView(APIView):
    """API view to handle job posting analysis"""
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = JobPostingSerializer

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            job_url = request.data["job_posting_url"]
            job_details = extract_job_description(job_url)
            logger.info(f"Job details extracted for URL: {job_url}")

            return Response({
                "url": job_url,
                "job_details": job_details
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in job posting analysis: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.decorators import api_view, authentication_classes, permission_classes

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def upload_file(request):
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        
        # Save the file
        uploaded_file = UploadedFile.objects.create(file=file)
        
        # Process the resume
        processed_data = process_resume(uploaded_file.file.path)
        print("Processed resume data:", json.dumps(processed_data, indent=2))
        
        # Delete the file after processing
        os.remove(uploaded_file.file.path)
        uploaded_file.delete()
        
        return Response({
            'success': True,
            'processed_data': processed_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in upload_file view: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def job_description_parse(request):
    """View to handle job description parsing through web interface"""
    if request.method == "POST":
        form = jobPostingForm(request.POST)
        if form.is_valid():
            try:
                job_url = form.cleaned_data["job_posting_url"]
                job_details = extract_job_description(job_url)
                return render(request, "file_upload/job_description_results.html", {
                    "job_details": job_details,
                    "form": form
                })
            except Exception as e:
                messages.error(request, f"Error parsing job description: {str(e)}")
                return render(request, "file_upload/job_description_parse.html", {"form": form})
    else:
        form = jobPostingForm()

    return render(request, "file_upload/job_description_parse.html", {"form": form})


def display_file(request, file_id):
    """View to display processed file contents"""
    try:
        file_obj = UploadedFile.objects.get(pk=file_id)
        return render(request, "file_upload/display.html", {
            "filename": os.path.basename(file_obj.file.path),
            "content": "The resume was processed successfully.",
            "processed_content": file_obj.processed_content
        })
    except Exception as e:
        logger.error(f"Error displaying file with ID {file_id}: {str(e)}")
        return HttpResponse(f"Error: {str(e)}")


def file_list(request):
    """View to display list of uploaded files"""
    files = UploadedFile.objects.all().order_by("-uploaded_at")
    paginator = Paginator(files, 10)
    page = request.GET.get('page')

    try:
        files = paginator.page(page)
    except PageNotAnInteger:
        files = paginator.page(1)
    except EmptyPage:
        files = paginator.page(paginator.num_pages)

    return render(request, "file_upload/list.html", {"files": files})
