"""
Debug middleware to catch and log request processing errors
"""
import logging
import traceback

logger = logging.getLogger(__name__)

class DebugMiddleware:
    """
    Middleware to debug request processing and catch silent errors
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        logger.info("🔧 DebugMiddleware initialized")

    def __call__(self, request):
        # Log incoming request
        logger.info(f"🌐 Incoming request: {request.method} {request.path}")
        logger.info(f"🌐 Request from: {request.META.get('REMOTE_ADDR', 'unknown')}")
        logger.info(f"🌐 User-Agent: {request.META.get('HTTP_USER_AGENT', 'unknown')}")
        
        try:
            # Process the request
            response = self.get_response(request)
            logger.info(f"✅ Request processed successfully: {response.status_code}")
            return response
            
        except Exception as e:
            # Log any unhandled exceptions
            logger.error(f"🚨 MIDDLEWARE CAUGHT EXCEPTION: {str(e)}")
            logger.error(f"🚨 Exception type: {type(e).__name__}")
            logger.error(f"🚨 Request that failed: {request.method} {request.path}")
            logger.error(f"🚨 Full traceback: {traceback.format_exc()}")
            
            # Re-raise the exception to let Django handle it
            raise

    def process_exception(self, request, exception):
        """
        Handle exceptions that occur during view processing
        """
        logger.error(f"🚨 VIEW EXCEPTION: {str(exception)}")
        logger.error(f"🚨 Exception type: {type(exception).__name__}")
        logger.error(f"🚨 Request that caused exception: {request.method} {request.path}")
        logger.error(f"🚨 Exception traceback: {traceback.format_exc()}")
        
        # Return None to let Django's default exception handling continue
        return None