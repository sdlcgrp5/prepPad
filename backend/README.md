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
│       └── urls.py             # Main URL routing
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

# Backend Module Documentation

## Core Modules

### File Processing (`utils.py`)

#### `processResume(resume_file_path: str) -> JSON`
Processes uploaded resume files and extracts structured information.

**Arguments:**
- `resume_file_path`: String path to the uploaded resume file

**Returns:**
```json
{
    "name": "string",
    "contact_info": {
        "email": "string",
        "phone": "string",
        "zipCode": "string"
    },
    "work_experience": {
        "company": "string",
        "jobTitle": "string",
        "startDate": "string",
        "endDate": "string",
        "jobDescription": "string"
    },
    "education": {
        "institution": "string",
        "highestDegree": "string",
        "fieldOfStudy": "string",
        "graduationYear": "string"
    },
    "skills": ["string"]
}
```

**Supported File Types:**
- PDF (using pdfplumber)
- DOCX (using python-docx)

#### `extractJobDescription(url: str) -> JSON`
Scrapes and analyzes job postings from provided URLs.

**Arguments:**
- `url`: String URL of the job posting

**Returns:**
```json
{
    "title": "string",
    "description": "string",
    "qualifications": ["string"],
    "skills": ["string"],
    "responsibilities": ["string"],
    "salary_range": "string",
    "location": "string"
}
```

### Analysis (`utils.py`)

#### `resumeJobDescAnalysis(resume_file_path: str, job_posting_url: str) -> JSON`
Compares resume against job posting and provides analysis.

**Arguments:**
- `resume_file_path`: String path to resume file
- `job_posting_url`: String URL of job posting

**Returns:**
```json
{
    "strengths": ["string"],
    "weaknesses": ["string"],
    "improvement_tips": ["string"],
    "keywords_missing": ["string"],
    "keywords_found": ["string"],
    "match_score": "number"
}
```

### API Views (`views.py`)

#### `FileUploadAPIView`
Handles resume file uploads and processing.

**Endpoints:**
- POST `/api/resume-upload/`
- Requires JWT authentication
- Accepts multipart/form-data

#### `AnalysisAPIView`
Handles resume analysis against job postings.

**Endpoints:**
- POST `/api/analysis/`
- Requires JWT authentication
- Accepts multipart/form-data with job URL

### Models (`models.py`)

#### `UploadedFile`
Stores uploaded resume files and processed content.

**Fields:**
```python
file = FileField(upload_to='uploads/')
processed_content = TextField(blank=True)
uploaded_at = DateTimeField(auto_now_add=True)
```

#### `Profile`
Stores extracted profile information.

**Fields:**
```python
firstName = CharField(max_length=255)
lastName = CharField(max_length=255)
email = EmailField()
phone = CharField(max_length=20)
zipCode = CharField(max_length=10)
```

### Serializers (`serializers.py`)

#### `FileUploadSerializer`
Handles validation and serialization of file uploads.

**Fields:**
```python
file = FileField()
job_posting_url = URLField(required=False)
```

#### `AnalysisSerializer`
Handles validation and serialization of analysis requests.

**Fields:**
```python
file = FileField()
job_posting_url = URLField()
```

## Utility Functions

### Text Processing (`utils.py`)

#### `getRawText(text: str) -> str`
Cleans and normalizes text content.

**Operations:**
- Removes Unicode escape sequences
- Normalizes whitespace
- Removes special characters
- Handles line breaks

### Web Scraping (`utils.py`)

#### `setup_selenium_driver() -> webdriver.Chrome`
Configures Selenium WebDriver for job scraping.

**Configuration:**
- Headless mode
- Custom timeout settings
- Error handling
- Resource cleanup

## Error Handling

All modules implement comprehensive error handling:
- File format validation
- API request validation
- Network error handling
- Processing error handling

## Performance Considerations

- File processing is handled asynchronously
- Implements caching for job descriptions
- Implements rate limiting for external APIs

## Security Features

- JWT authentication required for all endpoints
- File type validation
- File size limits
- Input sanitization
- CORS configuration
