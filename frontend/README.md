#Frontend Application

This repository contains a Next.js frontend application. Follow the instructions below to set up and run the application locally.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 14.x or higher recommended)
- npm (comes with Node.js)


cd frontend <br>
cd prepad
```

### 2. Install Dependencies


```open terminal
npm install
npm install @prisma/client
```

### 3. Environment Variables Setup

This application requires environment variables to function properly. 

1. Create a `.env` &`.env.local` file in the root directory (required environment variables shared in discord)


### 4. Run the Development Server

Start the development server:

```terminal
npm run dev
```

available at http://localhost:3000



### 4. Environment Variables
The application requires environment variables for API communication and authentication. Create .env and .env.local files in the root directory with the following variables:

```terminal
NEXT_PUBLIC_API_BASE_URL: Base URL for the backend API.
NEXT_PUBLIC_JWT_SECRET: Secret key for JWT authentication.
```

### 5. Key Features
User Authentication: Login and OTP verification.
Resume Upload: Upload resumes in PDF/DOCX format for parsing.
Job Analysis: Submit job posting URLs for analysis.
Profile Management: Create and update user profiles.
Dashboard: View job analysis results and learning plans.


### 6. API Integration
The frontend interacts with the backend using REST APIs. All API calls are managed in the apiservices.ts file.

Example API Calls
1. POST Resume Upload
Uploads a resume file to the backend for parsing.

```terminal
const response = await fetch(`${API_BASE_URL}/profile`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

3. POST Job Analysis
Submits a job posting URL and resume for analysis.
```terminal
const response = await fetch(`${API_BASE_URL}/job-analyses/analyze`, {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify({ jobPostingUrl, resumeId }),
});
```
### 7. Components and Pages
Key Pages <be>

`Homepage (src/app/page.tsx):` <be>
Displays the landing page with a call-to-action for users to sign up or log in.<be>

`Resume Upload (src/app/resumeupload/page.tsx)` <be>
Allows users to upload resumes and view parsing results.<be>

`Dashboard (src/app/dashboard/page.tsx)` <be>
Displays job analysis results and provides access to the Job Analysis Modal.<be>

`OTP Authentication (src/app/otp/page.tsx)` <be>
Handles OTP verification for user authentication.<be>


Key Components
`Sidebar (src/components/layout/sidebar.tsx)`

Provides navigation links for the dashboard and other pages.
`JobAnalysisModal (src/components/dashboard/JobAnalysisModal.tsx)`

Modal for submitting job postings and viewing analysis results.
`Header (src/components/layout/header.tsx)`

Displays the page title and user actions.

### 8. Styling
The application uses Tailwind CSS for styling. Global styles are defined in <be>
`src/styles/globals.css`, and utility classes are used throughout the components for consistent design.


