// services/apiService.ts
import Cookies from 'js-cookie';

const API_BASE_URL = '/api';

// Helper function to include auth token in requests
const getAuthHeaders = () => {
  const token = Cookies.get('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Job application analysis APIs
export const jobApplicationApi = {
  // Get all job analyses for the current user
  getJobAnalyses: async () => {
    const response = await fetch(`${API_BASE_URL}/job-analyses`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch job analyses');
    }
    
    return response.json();
  },
  
  // Submit a new job posting URL for analysis
  analyzeJobPosting: async (jobPostingUrl: string, resumeId: number) => {
    const response = await fetch(`${API_BASE_URL}/job-analyses/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ jobPostingUrl, resumeId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze job posting');
    }
    
    return response.json();
  },
  
  // Get detailed analysis results for a specific job
  getAnalysisDetails: async (analysisId: number) => {
    const response = await fetch(`${API_BASE_URL}/job-analyses/${analysisId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch analysis details');
    }
    
    return response.json();
  },
  
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard statistics');
    }
    
    return response.json();
  },
  
  // Delete a job analysis
  deleteAnalysis: async (analysisId: number) => {
    const response = await fetch(`${API_BASE_URL}/job-analyses/${analysisId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete analysis');
    }
    
    return response.json();
  }
};

// Resume management APIs
export const resumeApi = {
  // Upload a resume file (PDF or DOCX)
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeaders().Authorization,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload resume');
    }
    
    return response.json();
  },
  
  // Get the current user's resume data
  getCurrentResume: async () => {
    const response = await fetch(`${API_BASE_URL}/resumes/current`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resume data');
    }
    
    return response.json();
  },
  
  // Manually create or update resume profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateResumeProfile: async (profileData: any) => {
    const response = await fetch(`${API_BASE_URL}/resumes/profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update resume profile');
    }
    
    return response.json();
  }
};

// User profile APIs
export const userApi = {
  // Get the current user's profile
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  },
  
  // Update the current user's profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: async (profileData: any) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    
    return response.json();
  }
};