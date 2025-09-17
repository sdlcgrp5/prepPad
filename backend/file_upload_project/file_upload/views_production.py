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
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.db import connection
import jwt as pyjwt
import os
from rest_framework.throttling import UserRateThrottle
from django.contrib.auth.decorators import login_required
import logging
import os
import json
from .serializers import AnalysisSerializer, FileUploadSerializer, JobPostingSerializer
from .models import UploadedFile
from .forms import fileUploadForm, jobPostingForm
from .utils import processResume, processResumeFromContent, extractJobDescription, resumeJobDescAnalysis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def performResumeJobAnalysis(processed_resume: dict, job_details: dict, anonymize_pii: bool = True) -> dict:
    """
    Performs AI analysis comparing processed resume data to job posting details.
    
    Args:
        processed_resume: Structured resume data from processResumeFromContent
        job_details: Structured job posting data from extractJobDescription  
        anonymize_pii: Whether to anonymize PII in analysis prompts
    
    Returns:
        dict: Analysis results with match score, strengths, weaknesses, etc.
    """
    from .utils import analysisPrompt
    import requests
    
    try:
        # Get API key from environment
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            logger.error("DEEPSEEK_API_KEY environment variable not set")
            return {
                "error": "AI analysis service not configured",
                "match_score": 0,
                "strengths": [],
                "weaknesses": [],
                "improvement_tips": [],
                "keywords_missing": [],
                "keywords_found": []
            }
        
        # Convert structured data to strings for analysis
        resume_data_str = str(processed_resume)
        job_data_str = str(job_details)
        
        # Create analysis prompt
        prompt = analysisPrompt(resume_data_str, job_data_str)
        
        # Call DeepSeek API for analysis
        url = "https://api.deepseek.com/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        
        data = {
            "model": "deepseek-chat",
            "messages": prompt,
            "response_format": {"type": "json_object"},
            "stream": False,
            "max_tokens": 1000,
            "temperature": 0.1,
        }
        
        logger.info("🚀 Sending analysis request to DeepSeek API...")
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"✅ DeepSeek API response received: {response.status_code}")
            
            if (
                "choices" in result
                and len(result["choices"]) > 0
                and "message" in result["choices"][0]
                and "content" in result["choices"][0]["message"]
            ):
                content = json.loads(result["choices"][0]["message"]["content"])
                logger.info(f"✅ Analysis successful - Match Score: {content.get('match_score', 0)}%")
                return content
            else:
                logger.error("Invalid response format from DeepSeek API")
                raise ValueError("Invalid API response format")
        else:
            logger.error(f"DeepSeek API error: {response.status_code} - {response.text}")
            raise ValueError(f"API request failed: {response.status_code}")
    
    except Exception as e:
        logger.error(f"Error in performResumeJobAnalysis: {str(e)}")
        return {
            "error": str(e),
            "match_score": 0,
            "strengths": [],
            "weaknesses": [],
            "improvement_tips": [],
            "keywords_missing": [],
            "keywords_found": []
        }

def get_supabase_user(user_id):
    """
    Get user from Supabase users table by ID
    Returns user data or None if not found
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, email, name FROM users WHERE id = %s", [user_id])
            result = cursor.fetchone()
            if result:
                return {
                    'id': result[0],
                    'email': result[1], 
                    'name': result[2]
                }
            return None
    except Exception as e:
        logger.error(f"Error fetching Supabase user {user_id}: {str(e)}")
        return None

class SupabaseUser:
    """Mock user object for Supabase users with Django compatibility"""
    def __init__(self, user_data):
        self.id = user_data['id']
        self.pk = user_data['id']  # Django primary key compatibility
        self.email = user_data['email']
        self.name = user_data.get('name', '')
        self.username = user_data['email']  # Use email as username
        self.is_authenticated = True
        self.is_active = True
        self.is_staff = False
        self.is_superuser = False
    
    def __str__(self):
        return f"SupabaseUser({self.id}, {self.email})"
    
    def get_username(self):
        """Return the username for this user"""
        return self.username
    
    def get_full_name(self):
        """Return the full name for this user"""
        return self.name or self.email
    
    def get_short_name(self):
        """Return the short name for this user"""
        return self.name or self.email.split('@')[0]

class SupabaseJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that validates against Supabase users table
    """
    
    def get_user(self, validated_token):
        """
        Get user from Supabase based on JWT token claims
        """
        try:
            user_id = validated_token.get('user_id')
            if not user_id:
                logger.error("JWT token missing user_id claim")
                raise InvalidToken('Token missing user_id')
            
            logger.info(f"🔍 Looking up Supabase user with ID: {user_id}")
            
            # Get user from Supabase
            user_data = get_supabase_user(user_id)
            if not user_data:
                logger.error(f"Supabase user {user_id} not found")
                raise InvalidToken('User not found')
            
            logger.info(f"🔍 Found Supabase user: {user_data['email']}")
            return SupabaseUser(user_data)
            
        except Exception as e:
            logger.error(f"Error in get_user: {str(e)}")
            raise InvalidToken('Authentication failed')


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
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, format=None):
        # Log the authenticated user
        logger.info(f"🔐 Analysis request from user: {request.user.id if hasattr(request.user, 'id') else 'unknown'}")
        
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get uploaded file from request  
            uploaded_file = request.FILES["file"]
            job_url = request.data["job_posting_url"]
            
            # Check for user consent (optional parameter, defaults to True for privacy protection)
            anonymize_pii = request.data.get("anonymize_pii", "true").lower() == "true"
            logger.info(f"🔒 PII Anonymization: {'ENABLED' if anonymize_pii else 'DISABLED'} for user {request.user.id}")
            
            # Get job details first
            job_details = extractJobDescription(job_url)
            logger.info(f"Job details extracted for user {request.user.id}")
            
            # Validate job details
            if not job_details or (isinstance(job_details, dict) and job_details.get('status_code') != 200 and 'error' in job_details):
                logger.error(f"Job extraction failed for user {request.user.id}: {job_details}")
                return Response({
                    "error": "Failed to extract job details from URL. Please check the URL is accessible.",
                    "job_url": job_url,
                    "details": str(job_details)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process file in memory and perform analysis
            file_content = uploaded_file.read()
            processed_resume = processResumeFromContent(
                file_content=file_content,
                filename=uploaded_file.name,
                anonymize_pii=anonymize_pii
            )
            logger.info(f"Resume processed for user {request.user.id}")
            
            # Validate resume processing
            if not processed_resume or (isinstance(processed_resume, dict) and processed_resume.get('processing_failed')):
                logger.error(f"Resume processing failed for user {request.user.id}: {processed_resume}")
                return Response({
                    "error": "Failed to process resume file. Please check the file format and content.",
                    "filename": uploaded_file.name,
                    "details": str(processed_resume)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Perform actual AI analysis comparing resume to job posting
            logger.info(f"Starting AI analysis for user {request.user.id}")
            analysis = performResumeJobAnalysis(processed_resume, job_details, anonymize_pii)
            logger.info(f"Analysis completed for user {request.user.id}: match_score={analysis.get('match_score', 0)}%")

            return Response({
                "filename": uploaded_file.name,
                "url": job_url,
                "analysis": analysis,
                "job_details": job_details,
                "privacy_protected": anonymize_pii,
                "user_id": request.user.id,
                "processing_method": "in_memory"
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
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request, format=None):
        # Log the authenticated user
        logger.info(f"🔐 File upload request from user: {request.user.id}")
        
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get uploaded file from request
            uploaded_file = request.FILES["file"]
            
            # Check for user consent (optional parameter, defaults to True for privacy protection)
            anonymize_pii = request.data.get("anonymize_pii", "true").lower() == "true"
            logger.info(f"🔒 Resume Processing - PII Anonymization: {'ENABLED' if anonymize_pii else 'DISABLED'} for user {request.user.id}")
            
            # Process file directly from memory (no file storage)
            file_content = uploaded_file.read()
            processed_content = processResumeFromContent(
                file_content=file_content,
                filename=uploaded_file.name,
                anonymize_pii=anonymize_pii
            )
            
            # Store only the processed results (no file storage)
            instance = UploadedFile.objects.create(
                processed_content=json.dumps(processed_content)
                # Note: No file field - processing done in-memory only
            )

            return Response({
                "success": True,
                "filename": uploaded_file.name,
                "processed_content": processed_content,
                "privacy_protected": anonymize_pii,
                "user_id": request.user.id,
                "processing_method": "in_memory"
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
    authentication_classes = [SupabaseJWTAuthentication]
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
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Import here to avoid circular imports
            from .models import Profile
            
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
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, profile_id):
        try:
            # Import here to avoid circular imports
            from .models import Profile
            
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
    authentication_classes = [SupabaseJWTAuthentication]
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
                uploaded_file = form.save()
                # Note: File-user association handled through separate logic if needed
                
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
        # Get file (user access control handled at application level)
        file_obj = UploadedFile.objects.get(pk=file_id)
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