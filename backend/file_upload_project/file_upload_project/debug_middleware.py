"""
Debug middleware to catch and log request processing errors
"""
import logging
import traceback
from django.db import connection

logger = logging.getLogger(__name__)

def test_database_connectivity():
    """Test database connectivity and schema inspection"""
    try:
        logger.info("🔍 [DB-DEBUG] Testing database connectivity...")
        
        # Test basic connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]
            logger.info(f"🔍 [DB-DEBUG] Database connected: {version}")
            
            # Check if users table exists (Supabase schema)
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name IN ('users', 'profiles', 'auth_user')
            """)
            tables = [row[0] for row in cursor.fetchall()]
            logger.info(f"🔍 [DB-DEBUG] Available user-related tables: {tables}")
            
            # Check users table structure if it exists
            if 'users' in tables:
                cursor.execute("""
                    SELECT column_name, data_type FROM information_schema.columns 
                    WHERE table_name = 'users' AND table_schema = 'public'
                """)
                columns = [(row[0], row[1]) for row in cursor.fetchall()]
                logger.info(f"🔍 [DB-DEBUG] Users table columns: {columns}")
                
                # Count users
                cursor.execute("SELECT COUNT(*) FROM users")
                user_count = cursor.fetchone()[0]
                logger.info(f"🔍 [DB-DEBUG] Total users in database: {user_count}")
                
                # Check if user ID 20 exists
                cursor.execute("SELECT id, email FROM users WHERE id = 20")
                user_20 = cursor.fetchone()
                if user_20:
                    logger.info(f"🔍 [DB-DEBUG] User ID 20 found: {user_20[1]}")
                else:
                    logger.info("🔍 [DB-DEBUG] User ID 20 NOT found")
            
    except Exception as e:
        logger.error(f"🚨 [DB-DEBUG] Database connectivity test failed: {str(e)}")
        logger.error(f"🚨 [DB-DEBUG] Full error: {traceback.format_exc()}")

class DebugMiddleware:
    """
    Middleware to debug request processing and catch silent errors
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        logger.info("🔧 DebugMiddleware initialized")
        
        # Test database connectivity on startup
        test_database_connectivity()

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