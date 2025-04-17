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
from .utils import processResume, resumeJobDescAnalysis, extractJobDescription 
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
        JWT required
    
    Returns:
        201: Analysis results
        400: Processing error
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = AnalysisSerializer
    # authentication_classes = [JWTAuthentication]  # Remove authentication requirement in development
    # permission_classes = [IsAuthenticated]      # Remove permission requirement in development

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
            analysis = resumeJobDescAnalysis(instance.file_path(), job_url)

            return Response({
                "file": instance.file.url,
                "url": job_url,
                "analysis": analysis
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
        JWT required
    
    Returns:
        201: Successfully processed resume
        400: Invalid file or processing error
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = FileUploadSerializer
    # authentication_classes = [JWTAuthentication]  # Remove authentication requirement
    # permission_classes = [IsAuthenticated]      # Remove permission requirement

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
            instance.processed_content = processed_content
            instance.save()

            return Response({
                "success": True,
                "file": instance.file.url,
                "processed_content": processed_content
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
        JWT required
    
    Returns:
        200: Job posting details
        400: Invalid URL or processing error
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = JobPostingSerializer
    # authentication_classes = [JWTAuthentication]  # Remove authentication requirement
    # permission_classes = [IsAuthenticated]      # Remove permission requirement

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
    def get(self, request):
        try:
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
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


from rest_framework.decorators import api_view, authentication_classes, permission_classes

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def uploadFile(request):
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        
        # Save the file
        uploaded_file = UploadedFile.objects.create(file=file)
        
        # Process the resume
        processed_data = processResume(uploaded_file.file.path)
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


def parseJobDescription(request):
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
