# PrepPad Backend

## Overview
PrepPad's backend is a Django-based REST API that processes resumes and job postings. It uses AI to analyze and compare resumes against job descriptions, providing detailed feedback and matching scores.

## Quick Start
```bash
# Clone the repository
git clone https://github.com/sdlcgrp5/prepPad.git
cd prepPad/backend

# Create and configure environment variables
cp .env.prePad .env
# Edit .env with your API keys

# Build and run with Docker
docker compose up --build
```

The application will be available at `localhost:8000`.

## Project Structure
```
backend/
├── Dockerfile                  # Docker configuration
├── compose.yaml                # Docker Compose configuration
├── requirements.txt            # Python dependencies
├── file_upload_project/        # Main Django project
│   ├── file_upload/            # Main application
│   │   ├── views.py            # API endpoints
│   │   ├── models.py           # Database models
│   │   ├── utils.py            # Helper functions
│   │   ├── urls.py             # URL routing
│   │   └── serializers.py      # Data serialization
│   └── file_upload_project/    # Project settings
│       ├── settings.py         # Django settings
│       └── urls.py         # Main URL routing
```

## API Endpoints

### Resume Upload
- **URL**: `/api/resume-upload/`
- **Method**: `POST`
- **Auth**: JWT Required
- **Request**:
  ```json
  {
      "file": "resume_file (PDF/DOCX)"
  }
  ```

### Job Analysis
- **URL**: `/api/analysis/`
- **Method**: `POST`
- **Auth**: JWT Required
- **Request**:
  ```json
  {
      "file": "resume_file",
      "job_posting_url": "url_string"
  }
  ```

## Environment Variables
Required environment variables in `.env`:
```plaintext
DEEPSEEK_API_KEY=your_api_key_here
SECRET_KEY=your_django_secret_key
DEBUG=True  # Set to False in production
```

## Development Setup

### Prerequisites
- Docker
- Docker Compose
- Python 3.11+

### Local Development
1. Clone the repository
2. Copy `.env.prePad` to `.env`
3. Add your API keys to `.env`
4. Run:
   ```bash
   docker compose up --build
   ```

## Testing
```bash
# Run tests
docker compose exec backend python manage.py test

# Run with coverage
docker compose exec backend coverage run manage.py test
docker compose exec backend coverage report
```

## Core Features
- PDF and DOCX resume parsing
- AI-powered analysis and recommendations
- Job description analysis
- Resume-job matching
- Structured data output
- JWT authentication
- Web scraping capabilities

## Technologies Used
- Django
- Django REST Framework
- Selenium
- spaCy
- DeepSeek-V3
- Docker
- JWT Authentication

## API Usage Examples

### Upload Resume
```python
import requests

files = {'file': open('resume.pdf', 'rb')}
headers = {'Authorization': f'Bearer {token}'}
response = requests.post(
    'http://localhost:8000/api/resume-upload/',
    files=files,
    headers=headers
)
```

### Analyze Job Match
```python
import requests

files = {'file': open('resume.pdf', 'rb')}
data = {'job_posting_url': 'https://example.com/job'}
headers = {'Authorization': f'Bearer {token}'}
response = requests.post(
    'http://localhost:8000/api/analysis/',
    files=files,
    data=data,
    headers=headers
)
```
