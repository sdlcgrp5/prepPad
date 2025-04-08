// components/dashboard/JobAnalysisModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { resumeApi, jobApplicationApi } from '@/services/apiservices';
import { ResumeFile } from '@/types';

interface JobAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JobAnalysisModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: JobAnalysisModalProps) {
  const [jobUrl, setJobUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeFile[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen]);
  
  const fetchResumes = async () => {
    setIsLoadingResumes(true);
    try {
      // In a real app, this would call the API
      // For demonstration, simulate some resumes
      setTimeout(() => {
        setResumes([
          { id: 1, fileName: 'My Resume.pdf', fileType: 'application/pdf', uploadedAt: new Date().toISOString(), fileUrl: '' },
          { id: 2, fileName: 'Software Developer Resume.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadedAt: new Date().toISOString(), fileUrl: '' }
        ]);
        setSelectedResumeId('1'); // Select the first resume by default
        setIsLoadingResumes(false);
      }, 500);
      
      // Uncomment when API is ready
      // const response = await resumeApi.getCurrentResume();
      // setResumes(response.data || []);
      // if (response.data && response.data.length > 0) {
      //   setSelectedResumeId(response.data[0].id.toString());
      // }
      // setIsLoadingResumes(false);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      setIsLoadingResumes(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!jobUrl.trim()) {
      setError('Please enter a job posting URL');
      return;
    }
    
    if (!selectedResumeId) {
      setError('Please select a resume');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real app, this would call the API with the selected resume
      // For demonstration, simulate an API call
      setTimeout(() => {
        setIsLoading(false);
        onSuccess();
        onClose();
        setJobUrl('');
      }, 1500);
      
      // Uncomment when API is ready
      // await jobApplicationApi.analyzeJobPosting(jobUrl, parseInt(selectedResumeId));
      // setIsLoading(false);
      // onSuccess();
      // onClose();
      // setJobUrl('');
    } catch (err) {
      setIsLoading(false);
      setError('Failed to analyze job posting. Please try again.');
      console.error('Job analysis error:', err);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg">
        <div className="relative p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-full bg-gray-700/50 p-1"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          {/* Tabs */}
          <div className="flex justify-center mb-8 mt-2">
            <div className="bg-gray-700/50 text-white py-2 px-6 rounded-md">
              Job Analysis
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resume
              </label>
              <div className="relative">
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full p-3 pr-10 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  disabled={isLoading || isLoadingResumes}
                >
                  {isLoadingResumes ? (
                    <option>Loading resumes...</option>
                  ) : resumes.length === 0 ? (
                    <option value="">No resumes available</option>
                  ) : (
                    <>
                      <option value="">Select your preferred resume</option>
                      {resumes.map((resume) => (
                        <option key={resume.id} value={resume.id.toString()}>
                          {resume.fileName}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Job URL Input */}
            <div>
              <label htmlFor="job-url" className="block text-sm font-medium text-gray-300 mb-2">
                Job Posting link
              </label>
              <input
                id="job-url"
                type="url"
                placeholder="Enter the job posting link here"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="w-full p-3 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
                required
              />
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full ${
                isLoading 
                  ? 'bg-purple-700/50 cursor-not-allowed' 
                  : 'bg-purple-700 hover:bg-purple-600'
              } text-white py-3 px-6 rounded transition duration-300 flex justify-center items-center`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </div>
              ) : (
                'Analylze'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}