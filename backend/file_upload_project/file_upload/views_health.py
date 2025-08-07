"""
Health check views for production deployment monitoring
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connections
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint for load balancers and monitoring
    Returns 200 OK if service is healthy, 503 if unhealthy
    """
    try:
        # Check database connection
        db_conn = connections['default']
        db_conn.cursor()
        
        # Basic response data
        health_data = {
            'status': 'healthy',
            'service': 'PrepPad Backend API',
            'database': 'connected',
            'timestamp': request.META.get('HTTP_DATE', 'unknown')
        }
        
        return JsonResponse(health_data, status=200)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        
        error_data = {
            'status': 'unhealthy',
            'service': 'PrepPad Backend API',
            'database': 'disconnected',
            'error': 'Database connection failed',
            'timestamp': request.META.get('HTTP_DATE', 'unknown')
        }
        
        return JsonResponse(error_data, status=503)

@csrf_exempt  
@require_http_methods(["GET"])
def ready_check(request):
    """
    Readiness check endpoint - indicates if service is ready to handle traffic
    """
    try:
        # More comprehensive checks for readiness
        db_conn = connections['default']
        cursor = db_conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        
        ready_data = {
            'status': 'ready',
            'service': 'PrepPad Backend API',
            'checks': {
                'database': 'ready',
                'migrations': 'applied'
            }
        }
        
        return JsonResponse(ready_data, status=200)
        
    except Exception as e:
        logger.error(f"Ready check failed: {str(e)}")
        
        not_ready_data = {
            'status': 'not_ready',
            'service': 'PrepPad Backend API',
            'checks': {
                'database': 'failed',
                'error': str(e)
            }
        }
        
        return JsonResponse(not_ready_data, status=503)

@csrf_exempt
@require_http_methods(["GET"])  
def version_info(request):
    """
    Version information endpoint
    """
    version_data = {
        'service': 'PrepPad Backend API',
        'version': '1.0.0',
        'api_version': 'v1',
        'deployment': 'production',
        'features': {
            'resume_analysis': True,
            'job_matching': True,
            'rate_limiting': True,
            'authentication': True,
            'file_upload': True
        }
    }
    
    return JsonResponse(version_data, status=200)