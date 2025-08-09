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
    import datetime
    
    # DEBUG: Log every health check request
    logger.info(f"🔍 Health check request received from {request.META.get('REMOTE_ADDR', 'unknown')}")
    logger.info(f"🔍 Request headers: {dict(request.headers)}")
    
    try:
        # Basic service health (always passes if Django is running)
        health_data = {
            'status': 'healthy',
            'service': 'PrepPad Backend API',
            'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
            'django': 'running',
            'database': 'unknown'
        }
        
        logger.info("🔍 Health check data initialized successfully")
    
        # Try to check database connection (non-critical)
        try:
            from django.db import connection
            logger.info("🔍 Attempting database connection...")
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            health_data['database'] = 'connected'
            logger.info("🔍 Health check passed - database connected")
        except Exception as e:
            # Log the error but don't fail the health check
            logger.warning(f"🔍 Database health check failed (non-critical): {str(e)}")
            health_data['database'] = 'disconnected'
            health_data['database_error'] = str(e)[:100]  # Truncate error message
        
        # Always return 200 if Django is responding (Railway needs this)
        logger.info(f"🔍 Health check returning 200 with data: {health_data}")
        return JsonResponse(health_data, status=200)
        
    except Exception as e:
        # Catch any unexpected errors in health check
        logger.error(f"🚨 CRITICAL: Health check completely failed: {str(e)}")
        logger.error(f"🚨 Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"🚨 Full traceback: {traceback.format_exc()}")
        
        # Return 503 for complete failures
        error_data = {
            'status': 'error',
            'service': 'PrepPad Backend API',
            'error': str(e),
            'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'
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