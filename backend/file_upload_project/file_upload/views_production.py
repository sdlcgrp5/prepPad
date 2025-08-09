"""
Production Views with Authentication Enabled
"""
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
from rest_framework.throttling import UserRateThrottle
from django.contrib.auth.decorators import login_required
import logging
import os
import json
from .serializers import AnalysisSerializer, FileUploadSerializer, JobPostingSerializer
from .models import UploadedFile
from .forms import fileUploadForm, jobPostingForm
from .utils import processResume, extractJobDescription, resumeJobDescAnalysis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnalysisAPIView(APIView):
    """
    Handles resume analysis against job postings - PRODUCTION VERSION
    
    Endpoints:
        POST /api/analysis/
    
    Authentication:
        Required - JWT Bearer token
    
    Returns:
        201: Analysis results
        400: Processing error
        401: Unauthorized
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = AnalysisSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, format=None):
        # Log the authenticated user
        logger.info(f"🔐 Analysis request from user: {request.user.id if hasattr(request.user, 'id') else 'unknown'}")
        
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            instance = UploadedFile.objects.create(
                file=request.FILES["file"],
                processed_content="",
                user=request.user if hasattr(request.user, 'id') else None  # Associate with user
            )
            job_url = request.data["job_posting_url"]
            
            # Check for user consent (optional parameter, defaults to True for privacy protection)
            anonymize_pii = request.data.get("anonymize_pii", "true").lower() == "true"
            logger.info(f"🔒 PII Anonymization: {'ENABLED' if anonymize_pii else 'DISABLED'} for user {request.user.id}")
            
            # Get job details first
            job_details = extractJobDescription(job_url)
            logger.info(f"Job details extracted for user {request.user.id}: {job_details}")
            
            # Perform analysis with privacy protection
            analysis = resumeJobDescAnalysis(instance.file_path(), job_url, anonymize_pii=anonymize_pii)

            return Response({
                "file": instance.file.url,
                "url": job_url,
                "analysis": analysis,
                "job_details": job_details,
                "privacy_protected": anonymize_pii,
                "user_id": request.user.id
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error in analysis for user {request.user.id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class FileUploadAPIView(APIView):
    """
    Handles resume file uploads and initial processing - PRODUCTION VERSION
    
    Endpoints:
        POST /api/resume-upload/
    
    Authentication:
        Required - JWT Bearer token
    
    Returns:
        201: Successfully processed resume
        400: Invalid file or processing error
        401: Unauthorized
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = FileUploadSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, format=None):
        # Log the authenticated user
        logger.info(f"🔐 File upload request from user: {request.user.id}")
        
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Upload and process the file
            instance = UploadedFile.objects.create(
                file=request.FILES["file"],
                processed_content="",
                user=request.user if hasattr(request.user, 'id') else None  # Associate with user
            )
            
            # Check for user consent (optional parameter, defaults to True for privacy protection)
            anonymize_pii = request.data.get("anonymize_pii", "true").lower() == "true"
            logger.info(f"🔒 Resume Processing - PII Anonymization: {'ENABLED' if anonymize_pii else 'DISABLED'} for user {request.user.id}")
            
            processed_content = processResume(instance.file_path(), anonymize_pii=anonymize_pii)
            # Convert the dictionary to JSON string for storage
            instance.processed_content = json.dumps(processed_content)
            instance.save()

            return Response({
                "success": True,
                "file": instance.file.url,
                "processed_content": processed_content,
                "privacy_protected": anonymize_pii,
                "user_id": request.user.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error in file upload for user {request.user.id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class JobPostingAPIView(APIView):
    """
    Handles job posting URL processing - PRODUCTION VERSION
    
    Endpoints:
        POST /api/job-upload/
    
    Authentication:
        Required - JWT Bearer token
    
    Returns:
        200: Job posting details
        400: Invalid URL or processing error
        401: Unauthorized
    """
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = JobPostingSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, format=None):
        # Log the authenticated user
        logger.info(f"🔐 Job posting analysis request from user: {request.user.id}")
        
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            job_url = request.data["job_posting_url"]
            job_details = extractJobDescription(job_url)
            logger.info(f"Job details extracted for user {request.user.id}, URL: {job_url}")

            return Response({
                "url": job_url,
                "job_details": job_details,
                "user_id": request.user.id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in job posting analysis for user {request.user.id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProfileAPIView(APIView):
    """
    Handles profile data retrieval - PRODUCTION VERSION
    
    Authentication:
        Required - JWT Bearer token
    
    Returns:
        200: User's profile data
        404: Profile not found
        401: Unauthorized
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Import here to avoid circular imports
            from .models import Profile, Experience, Education, Skills
            
            # Get the authenticated user's profile only
            profile = Profile.objects.get(user=request.user)
            
            # Get related data for this user only
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
                'skills': [skill.skills for skill in skills],
                'user_id': request.user.id
            }
            
            logger.info(f"Profile data retrieved for user: {request.user.id}")
            return Response(response_data)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error retrieving profile for user {request.user.id}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfileDetailAPIView(APIView):
    """
    Handles profile data retrieval by ID - PRODUCTION VERSION
    
    Authentication:
        Required - JWT Bearer token
    
    Returns:
        200: Profile data for specified ID (if user owns it)
        403: Forbidden (trying to access another user's profile)
        404: Profile not found
        401: Unauthorized
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, profile_id):
        try:
            # Import here to avoid circular imports
            from .models import Profile, Experience, Education, Skills
            
            # Get the profile by ID, but ensure user can only access their own profile
            profile = Profile.objects.get(id=profile_id, user=request.user)
            
            # Get related data for this user only
            experiences = Experience.objects.filter(profile=profile)
            education = Education.objects.filter(profile=profile)
            skills = Skills.objects.filter(profile=profile)

            # Format the response
            response_data = {
                'id': profile.id,
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
                'skills': [skill.skills for skill in skills],
                'user_id': request.user.id
            }
            
            logger.info(f"Profile {profile_id} data retrieved for user: {request.user.id}")
            return Response(response_data)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found or access denied'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error retrieving profile {profile_id} for user {request.user.id}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResumeDetailAPIView(APIView):
    """
    Handles resume data retrieval by ID - PRODUCTION VERSION
    
    Authentication:
        Required - JWT Bearer token
    
    Returns:
        200: Resume data for specified ID (if user owns it)
        403: Forbidden (trying to access another user's resume)
        404: Resume not found
        401: Unauthorized
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, resume_id):
        try:
            # Get the resume by ID, but ensure user can only access their own resume
            resume = UploadedFile.objects.get(id=resume_id, user=request.user)
            
            # Parse the processed content if it exists
            processed_content = {}
            if resume.processed_content:
                try:
                    processed_content = json.loads(resume.processed_content)
                except json.JSONDecodeError:
                    processed_content = {"raw_content": resume.processed_content}

            # Format the response
            response_data = {
                'id': resume.id,
                'filename': os.path.basename(resume.file.name),
                'file_url': resume.file.url,
                'uploaded_at': resume.uploaded_at,
                'processed_content': processed_content,
                'user_id': request.user.id
            }
            
            logger.info(f"Resume {resume_id} data retrieved for user: {request.user.id}")
            return Response(response_data)
        except UploadedFile.DoesNotExist:
            return Response({'error': 'Resume not found or access denied'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error retrieving resume {resume_id} for user {request.user.id}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Web views with authentication
@login_required
def uploadFile(request):
    """
    Web interface for file upload - PRODUCTION VERSION WITH AUTHENTICATION
    Handles both GET (show form) and POST (process upload) requests
    """
    if request.method == "POST":
        form = fileUploadForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                uploaded_file = form.save(commit=False)
                uploaded_file.user = request.user  # Associate with authenticated user
                uploaded_file.save()
                
                logger.info(f"File uploaded by user {request.user.id}: {uploaded_file.file.path}")
                
                # Process the resume
                processed_data = processResume(uploaded_file.file.path)
                uploaded_file.processed_content = json.dumps(processed_data)
                uploaded_file.save()
                
                logger.info(f"Processed resume data for user {request.user.id}")
                
                messages.success(request, "File uploaded and processed successfully!")
                return redirect('displayFile', file_id=uploaded_file.id)
                
            except Exception as e:
                logger.error(f"Error in uploadFile view for user {request.user.id}: {str(e)}")
                messages.error(request, f"Error processing file: {str(e)}")
                return render(request, "file_upload/upload.html", {"form": form})
    else:
        # GET request - show the upload form
        form = fileUploadForm()

    return render(request, "file_upload/upload.html", {"form": form})


@login_required
def displayFile(request, file_id):
    """View to display processed file contents - only user's own files"""
    try:
        # Ensure user can only access their own files
        file_obj = UploadedFile.objects.get(pk=file_id, user=request.user)
        return render(request, "file_upload/display.html", {
            "filename": os.path.basename(file_obj.file.path),
            "content": "The resume was processed successfully.",
            "processed_content": file_obj.processed_content
        })
    except UploadedFile.DoesNotExist:
        logger.warning(f"User {request.user.id} attempted to access file {file_id} - not found or not authorized")
        return HttpResponse("File not found or access denied", status=404)
    except Exception as e:
        logger.error(f"Error displaying file {file_id} for user {request.user.id}: {str(e)}")
        return HttpResponse(f"Error: {str(e)}")


@login_required
def fileList(request):
    """View to display list of uploaded files - only user's own files"""
    files = UploadedFile.objects.filter(user=request.user).order_by("-uploaded_at")
    paginator = Paginator(files, 10)
    page = request.GET.get('page')

    try:
        files = paginator.page(page)
    except PageNotAnInteger:
        files = paginator.page(1)
    except EmptyPage:
        files = paginator.page(paginator.num_pages)

    return render(request, "file_upload/list.html", {"files": files})


@login_required
def job_description_parse(request):
    """View to handle job description parsing through web interface - authenticated users only"""
    if request.method == "POST":
        form = jobPostingForm(request.POST)
        if form.is_valid():
            try:
                job_url = form.cleaned_data["job_posting_url"]
                job_details = extractJobDescription(job_url)
                logger.info(f"Job description parsed by user {request.user.id} for URL: {job_url}")
                return render(request, "file_upload/job_description_results.html", {
                    "job_details": job_details,
                    "form": form
                })
            except Exception as e:
                logger.error(f"Error parsing job description for user {request.user.id}: {str(e)}")
                messages.error(request, f"Error parsing job description: {str(e)}")
                return render(request, "file_upload/job_description_parse.html", {"form": form})
    else:
        form = jobPostingForm()

    return render(request, "file_upload/job_description_parse.html", {"form": form})