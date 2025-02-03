# prepPad - Product Requirements Document (MVP Version)

## Background and Problem Statement

Students face significant challenges in securing internships and entry-level roles due to skill mismatches and ineffective resume tailoring. Traditional platforms like LinkedIn Learning or paid resume-review services are cost-prohibitive for students, who often lack the budget for subscriptions. Additionally, existing tools fail to provide actionable, personalized learning plans tied directly to job requirements.

**Scenario/persona story**: A computer science student applies to 20 internships but receives rejections because their resume lacks keywords/skills emphasized in job postings. They waste weeks manually comparing their resume to listings and struggle to find affordable resources to bridge gaps.

*prepPad addresses this by offering a student-centric, cost-free platform that automates resume-job matching and delivers curated learning steps to close gaps instantly.*

## Project

### Project Overview
prepPad is a streamlined job-matching platform focused on helping users (target audience: students) quickly compare their resumes to job postings and identify critical skill gaps. It prioritizes core functionality: resume parsing, job analysis, application organization, and actionable learning recommendations. The goal is to help the target audience validate their position for every job application and help them manage all their job application in one place.

### Product Differentiations

#### Student-First Pricing Model
It is entirely free for this MVP, with monetization planned only for premium features (e.g., paid resource recommendations). Competitors lock critical features behind paywalls.

#### Real-Time Skill Gap Analysis
Uses Deepseek R1 to generate precise, context-aware gap summaries (e.g., "Learn Python for Data Analysis within 2 weeks") instead of generic keyword matching.

#### Integrated Learning Pathways
Recommends free, student-accessible resources (YouTube, freeCodeCamp) rather than promoting paid courses.

#### Application Timeline Tracking
Unique visual timeline to track internship/job application stages, helping students manage deadlines and follow-ups.

### Project Use Cases

#### Use Case 1: User Registration and Profile Creation
**Description**: A new user creates an account and sets up their profile.
**Steps**:
- The user signs up using an email or social login.
- User uploads their resume or manually inputs their information (e.g., experience, education, skills) into text boxes.
- The system parses the resume or stores the manually entered data in a database.
- User profile is created and stored for future use.

#### Use Case 2: Resume Parsing and Data Storage
**Description**: The system extracts and stores key components of the user's resume.
**Steps**:
- User uploads a resume file (PDF, DOCX, etc.).
- The system uses a parsing tool to extract structured data (e.g., skills, education, experience).
- Extracted data is stored in the user's profile in the database.

#### Use Case 3: Job Posting Link Submission
**Description**: User submits a job posting link for analysis.
**Steps**:
- User copies and pastes the job posting URL into a search box on the platform.
- The system sends the URL to a web parsing API (e.g., BeautifulSoup, Scrapy) to scrape the job posting details.
- The parsed job posting data (e.g., job title, required skills, qualifications) is stored temporarily for analysis.

#### Use Case 4: Resume-Job Comparison and Match Rating
**Description**: The system compares the user's resume data with the job posting requirements and generates a match rating.
**Steps**:
- The system feeds the user's profile data and the job posting data into an LLM (e.g., Deepseek R1).
- The LLM analyzes the overlap between the user's skills/experience and the job requirements.
- The system generates a match rating (e.g., 85% match) and provides a summary of strengths and gaps.

#### Use Case 5: Learning Plan Generation
**Description**: The system generates a personalized learning plan for the user based on skill gaps identified in the job posting.
**Steps**:
- The LLM identifies skills or qualifications in the job posting that the user lacks.
- The system generates a list of recommended resources (e.g., online courses, books, tutorials) to help the user acquire the missing skills.
- The learning plan is displayed to the user, along with the match rating.

#### Use Case 6: User Dashboard and History
**Description**: The user can view their past job comparisons, match ratings, and learning plans.
**Steps**:
- User logs into their account and access their dashboard.
- The dashboard displays a history of analyzed job postings, match ratings, and learning plans.
- User can click on any past job to view detailed insights and recommendations.

#### Use Case 7: Edit and Update Profile
**Description**: The user can update their profile information to reflect new skills, experiences, or education.
**Steps**:
- User navigates to their profile page.
- User edits or adds new information (e.g., new skills, updated resume).
- The system updates the user's profile in the database.

#### Use Case 8: Export Learning Plan
**Description**: The user can export their learning plan for offline use.
**Steps**:
- User views their learning plan on the platform.
- User clicks an "Export" button to download the plan as a PDF or text file.

#### Use Case 9: Notifications and Reminders
**Description**: The system sends reminders to the user to complete their learning plan or apply for jobs.
**Steps**:
- The system tracks the user's progress on their learning plan.
- If the user is inactive for a set period, the system sends a reminder email or notification.
- The system may also suggest new job postings based on the user's profile.
- The system sends a reminder email for any upcoming deadlines for job postings.

#### Use Case 10: Application Timeline View
**Description**: The user can visualize their application journey for each internship or job application in a timeline.
**Steps**:
- The user selects a specific job posting from their dashboard.
- A timeline view is displayed showing key dates: dates applied, interview offers, stages of interviews, offer deadline, etc.
- User can update the timeline with actual event dates (e.g., interview completed, offer accepted/rejected, rejections etc.)
- The timeline will help to provide a clear visual representation of the applications milestones and progress.

## MVP Features

### 1. Basic User Registration & Profile Creation
**Use case**:
- Users sign up via email or Google OAuth (Auth0 integration).
- Manually input skills/experience or upload a resume (PDF/DOCX).
*Edge case*: Corrupted resume files trigger an error message and prompt manual entry.

### 2. Resume Parsing & Storage
**Use case**:
- Apache Tika extracts text from resumes, mapping data to structured fields (e.g., skills, job titles).
- Parsed data stored in PostgreSQL; resumes saved to AWS S3/Firebase/Supabase
*Edge case*: Unparseable text (e.g., scanned images) defaults to manual input.

### 3. Job Link Submission & Scraping
**Use case**:
- Users paste a job URL; backend uses Scrapy to scrape title, skills, and requirements.
- Temporary storage of scraped data (Redis, 24-hour TTL).
*Edge case*: Paywalled/JavaScript-heavy sites show "Unable to parse" with an option to input text manually.

### 4. Resume-Job Match Rating
**Use case**:
- Deepseek R1 LLM API compares user profile and job data, generating a match % and top 3 gaps.
- Results displayed in a simple UI (no history tracking).
*Edge case*: API downtime shows cached results (if available) or a retry button.

### 5. Basic Learning Plan Generation
**Use Case**:
- LLM suggests 3–5 free resources (e.g., YouTube, freeCodeCamp) for skill gaps.
- Displayed as clickable links; no progress tracking.
*Edge case*: No gaps identified → UI emphasizes "high match" and suggests resume tips.

## Tech Stack (Tentative)

| Tech Stack Component | Choice | Rationale |
|---------------------|--------|-----------|
| Frontend | Next.js (Typescript) & Tailwind CSS | Server-side rendering for fast load times; TypeScript ensures type safety. |
| Backend | Django REST Framework | Built-in security, ORM for PostgreSQL integration, and rapid API development. |
| Database | PostgreSQL | ACID compliance and reliability for user profiles and parsed data. |
| Resume Parser | Apache Tika | Proven open-source tool supporting PDF/DOCX; reduces licensing costs. |
| AI Analysis | Deepseek R1 API | Low-cost, high-accuracy LLM tailored for educational/employment use cases |
| Auth | Auth0 | Simplifies OAuth integration (critical for student-friendly social logins). |
| Storage | Azure Blob Storage | Cost-effective, scalable storage for resumes; integrates well with Django. |
| Caching | Redis | Efficient temporary storage for scraped job data (24-hour TTL). |

### Summary of Technology Stack:
- **Frontend**: Next.js (TypeScript) & Tailwind CSS for static pages + dynamic forms.
- **Backend**: Django REST Framework (Python) for APIs; PostgreSQL for user data.
- **Parsing**: Apache Tika (resumes), Scrapy (job URLs).
- **AI**: Deepseek R1 API (cost-effective, low latency).
- **Auth**: Auth0 (social login, email/password).
- **Storage**: Microsoft Azure Blob Storage (resumes), Redis (caching).
- **Deployment**: Docker

## User Flow

1. **Registration**
   - Sign Up -> Upload Resume/Input Skills -> Profile Created

2. **Job Analysis**
   - Submit Job URL -> Scrape Data -> LLM Analysis -> Match % + Learning Links.

3. **Analysis Result**
   - View Results -> Export Learning Plan (basic PDF)

## Team Responsibilities (4 Members)

### Product Manager
Owns PRD, prioritizes features, coordinates sprints, and conducts user testing.

### Frontend Developer/ UI/UX Designer
Implements Next.js UI (registration, dashboard), ensures mobile responsiveness, and handles basic QA.

### Backend Developer/ Database Designer
Develops Django APIs (resume parsing, job scraping), integrates Deepseek R1, and manages PostgreSQL/Redis.

### DevOps/QA Engineer
Configures Azure deployment, sets up Docker containers, and performs end-to-end testing.

## Communication & Project Management

### Methodology
Agile (1-week sprints) 2 30-minute standups (Zoom) for every sprint.
**Reason**: Provides immediate feedback and is time efficient. It is very flexible and iterative as the project can be broken down into smaller parts and adjusted to changing requirements. Less documentation is required.

### Tools:
- GitHub Issues for task tracking and sprint planning.
- Discord for real-time communication.
- GitHub for version control and code reviews.
- Google Doc for documentation.

### Stakeholder Updates (tentative)
Biweekly demos to share progress with Professor.
