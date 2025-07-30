from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
# Removed JWT authentication imports
# from rest_framework_simplejwt.authentication import JWTAuthentication
# from rest_framework.permissions import IsAuthenticated
import logging
import os
import json
from .serializers import AnalysisSerializer, FileUploadSerializer, JobPostingSerializer
from .models import UploadedFile
from .forms import fileUploadForm, jobPostingForm
from .utils import processResume, extractJobDescription, resumeJobDescAnalysis
from rest_framework.throttling import UserRateThrottle

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnalysisAPIView(APIView):
    """
    Handles resume analysis against job postings.
    
    Endpoints:
        POST /api/analysis/
    
    Authentication:
        REMOVED - No authentication required for testing
    
    Returns:
        201: Analysis results
        400: Processing error
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = AnalysisSerializer
    # REMOVED: authentication_classes = [JWTAuthentication]
    # REMOVED: permission_classes = [IsAuthenticated]

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
            
            # Get job details first
            job_details = extractJobDescription(job_url)
            logger.info(f"Job details extracted: {job_details}")
            
            # Perform analysis
            analysis = resumeJobDescAnalysis(instance.file_path(), job_url)

            return Response({
                "file": instance.file.url,
                "url": job_url,
                "analysis": analysis,
                "job_details": job_details
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error in analysis: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FileUploadAPIView(APIView):
    """
    Handles resume file uploads and initial processing.
    
    Endpoints:
        POST /api/resume-upload/
    
    Authentication:
        REMOVED - No authentication required for testing
    
    Returns:
        201: Successfully processed resume
        400: Invalid file or processing error
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = FileUploadSerializer
    # REMOVED: authentication_classes = [JWTAuthentication]
    # REMOVED: permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Upload and process the file
            instance = UploadedFile.objects.create(
                file=request.FILES["file"],
                processed_content=""
            )
            processed_content = processResume(instance.file_path())
            # Convert the dictionary to JSON string for storage
            instance.processed_content = json.dumps(processed_content)
            instance.save()

            return Response({
                "success": True,
                "file": instance.file.url,
                "processed_content": processed_content  # Return the dict directly, not the JSON string
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error in file upload: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class JobPostingAPIView(APIView):
    """
    Handles job posting URL processing.
    
    Endpoints:
        POST /api/job-upload/
    
    Authentication:
        REMOVED - No authentication required for testing
    
    Returns:
        200: Job posting details
        400: Invalid URL or processing error
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = JobPostingSerializer
    # REMOVED: authentication_classes = [JWTAuthentication]
    # REMOVED: permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            job_url = request.data["job_posting_url"]
            job_details = extractJobDescription(job_url)
            logger.info(f"Job details extracted for URL: {job_url}")

            return Response({
                "url": job_url,
                "job_details": job_details
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in job posting analysis: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



class ProfileAPIView(APIView):
    """
    Handles profile data retrieval.
    
    Authentication:
        REMOVED - No authentication required for testing
    """
    # REMOVED: authentication_classes = [JWTAuthentication]
    # REMOVED: permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Import here to avoid circular imports
            from .models import Profile, Experience, Education, Skills
            
            # Get the most recent profile
            profile = Profile.objects.latest('id')
            
            # Get related data
            experiences = Experience.objects.filter(profile=profile)
            education = Education.objects.filter(profile=profile)
            skills = Skills.objects.filter(profile=profile)

            # Format the response
            response_data = {
                'firstName': profile.firstName,
                'lastName': profile.lastName,
                'email': profile.email,
                'phone': profile.phone,
                'zipCode': profile.zipCode,
                'experience': [{
                    'jobTitle': exp.jobTitle,
                    'company': exp.company,
                    'startDate': exp.startDate,
                    'endDate': exp.endDate,
                    'location': exp.location,
                    'jobDescription': exp.jobDescription
                } for exp in experiences],
                'education': [{
                    'highestDegree': edu.highestDegree,
                    'fieldOfStudy': edu.fieldOfStudy,
                    'institution': edu.institution,
                    'graduationYear': edu.graduationYear
                } for edu in education],
                'skills': [skill.skills for skill in skills]
            }
            
            return Response(response_data)
        except Exception as e:  # Changed from Profile.DoesNotExist to catch all exceptions
            return Response({'error': str(e)}, status=500)


# FIXED: Regular Django view function (NOT DRF APIView)
def uploadFile(request):
    """
    Web interface for file upload - AUTHENTICATION REMOVED FOR TESTING
    Handles both GET (show form) and POST (process upload) requests
    """
    if request.method == "POST":
        form = fileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                uploaded_file = form.save()
                print(f"File uploaded: {uploaded_file.file.path}")
                
                # Process the resume
                processed_data = processResume(uploaded_file.file.path)
                uploaded_file.processed_content = json.dumps(processed_data)
                uploaded_file.save()
                
                print(f"Processed resume data: {json.dumps(processed_data, indent=2)}")
                
                messages.success(request, "File uploaded and processed successfully!")
                return redirect('displayFile', file_id=uploaded_file.id)
                
            except Exception as e:
                print(f"Error in uploadFile view: {str(e)}")
                messages.error(request, f"Error processing file: {str(e)}")
                return render(request, "file_upload/upload.html", {"form": form})
    else:
        # GET request - show the upload form
        form = fileUploadForm()

    return render(request, "file_upload/upload.html", {"form": form})


def displayFile(request, file_id):
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


def fileList(request):
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


def job_description_parse(request):
    """View to handle job description parsing through web interface"""
    if request.method == "POST":
        form = jobPostingForm(request.POST)
        if form.is_valid():
            try:
                job_url = form.cleaned_data["job_posting_url"]
                job_details = extractJobDescription(job_url)
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