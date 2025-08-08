#!/usr/bin/env python3
"""
Simple HTTP health server for debugging Railway deployment issues
This runs independently of Django to test basic container networking

Usage:
    python simple_health_server.py [port]
"""

import http.server
import socketserver
import sys
import os
import json
from datetime import datetime

class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ['/health', '/api/health/', '/ping']:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'healthy',
                'service': 'Simple Health Server',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'container_info': {
                    'port': os.getenv('PORT', '8000'),
                    'pwd': os.getcwd(),
                    'python_version': sys.version,
                    'path': self.path
                },
                'environment': {
                    'DATABASE_URL': 'SET' if os.getenv('DATABASE_URL') else 'NOT SET',
                    'SECRET_KEY': 'SET' if os.getenv('SECRET_KEY') else 'NOT SET',
                    'ALLOWED_HOSTS': 'SET' if os.getenv('ALLOWED_HOSTS') else 'NOT SET',
                }
            }
            
            self.wfile.write(json.dumps(response, indent=2).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')

    def log_message(self, format, *args):
        print(f"[{datetime.now()}] {format % args}")

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.getenv('PORT', 8000))
    
    print(f"🚀 Starting Simple Health Server on port {port}")
    print(f"📍 Working directory: {os.getcwd()}")
    print(f"🐍 Python version: {sys.version}")
    print(f"🌐 Environment PORT: {os.getenv('PORT', 'not set')}")
    
    with socketserver.TCPServer(("0.0.0.0", port), HealthHandler) as httpd:
        print(f"✅ Server running at http://0.0.0.0:{port}")
        print("🏥 Health endpoints available at:")
        print(f"   - http://0.0.0.0:{port}/health")
        print(f"   - http://0.0.0.0:{port}/api/health/")
        print(f"   - http://0.0.0.0:{port}/ping")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    main()