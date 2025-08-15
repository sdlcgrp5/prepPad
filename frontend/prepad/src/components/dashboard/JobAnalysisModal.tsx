'use client';

import { useState } from 'react';
import AnalysisResults from './AnalysisResults';
import ConsentModal from '@/components/privacy/ConsentModal';
import Image from 'next/image';
import { AnalysisResult } from '@/types';
import { useAuth } from '@/context/AuthContext';

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
  const { token, user, hasDataProcessingConsent, setDataProcessingConsent } = useAuth();
  const [jobUrl, setJobUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('idle'); // idle, pending, processing, completed, failed
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && file.type !== 'application/msword' && 
          file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setError('Please upload a PDF or Word document');
        return;
      }
      setResumeFile(file);
      setError(null);
    }
  };

  const handleAnalysisClose = () => {
    setAnalysisResults(null);
    setResumeFile(null);
    setJobUrl('');
    setJobId(null);
    setAnalysisStatus('idle');
    setProgress(0);
    setCurrentStep('');
    onSuccess();
    onClose();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!resumeFile) {
      setError('Please upload your resume');
      return;
    }
    
    if (!jobUrl.trim()) {
      setError('Please enter a job posting URL');
      return;
    }
    
    // Check if user has given consent for data processing
    if (!hasDataProcessingConsent) {
      setPendingSubmission(true);
      setIsConsentModalOpen(true);
      return;
    }
    
    await performAnalysis();
  };

  const performAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAnalysisStatus('pending');
      setProgress(0);
      setCurrentStep('Creating analysis job...');
      
      const formData = new FormData();
      formData.append('resume', resumeFile!);
      formData.append('jobUrl', jobUrl);
      formData.append('anonymizePii', hasDataProcessingConsent ? 'true' : 'false');
      
      // For nextauth token users, include user data in the form
      if (token === 'nextauth' && user) {
        formData.append('userId', user.id.toString());
        formData.append('userEmail', user.email);
      }
      
      // Step 1: Create job record in our database
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      // Also send user data in header as backup for nextauth users
      if (token === 'nextauth' && user) {
        headers['X-User-Data'] = JSON.stringify({ id: user.id, email: user.email });
      }
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to create analysis job');
      }
      
      console.log('📝 Job created:', data.jobId);
      setJobId(data.jobId);
      setProgress(10);
      setCurrentStep('Job created, starting analysis...');
      
      // Step 2: Call Django API directly (bypasses Vercel timeout)
      await callDjangoDirectly(data.jobId, data.fileData, data.jobUrl, data.anonymizePii);
      
    } catch (err) {
      setIsLoading(false);
      setAnalysisStatus('failed');
      setError('Failed to start job analysis. Please try again.');
      console.error('Job analysis error:', err);
    }
  };

  const callDjangoDirectly = async (jobId: string, fileData: any, jobUrl: string, anonymizePii: boolean) => {
    try {
      setProgress(20);
      setCurrentStep('Generating authentication token...');
      
      // Generate JWT token for Django backend
      const now = Math.floor(Date.now() / 1000);
      
      let backendJwtToken = null;
      try {
        // Get JWT secret from environment (need to call an endpoint for this)
        const tokenResponse = await fetch('/api/auth/nextauth-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          backendJwtToken = tokenData.token;
        }
      } catch (tokenError) {
        console.warn('Failed to generate backend JWT token:', tokenError);
      }

      setProgress(30);
      setCurrentStep('Calling Django backend directly...');
      
      // Create form data for Django API
      const djangoFormData = new FormData();
      djangoFormData.append('file', resumeFile!);
      djangoFormData.append('job_posting_url', jobUrl);
      djangoFormData.append('anonymize_pii', anonymizePii.toString());
      
      // Call Django backend directly (bypasses Vercel entirely)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://api.preppad.xyz';
      const headers: Record<string, string> = {};
      
      if (backendJwtToken) {
        headers['Authorization'] = `Bearer ${backendJwtToken}`;
      }

      setProgress(40);
      setCurrentStep('Processing with Django backend...');
      
      const djangoResponse = await fetch(`${backendUrl}/api/analysis/`, {
        method: 'POST',
        headers,
        body: djangoFormData,
      });

      const djangoResult = await djangoResponse.json();
      
      if (!djangoResponse.ok) {
        throw new Error(djangoResult.error || djangoResult.detail || `Django backend error: ${djangoResponse.status}`);
      }

      setProgress(80);
      setCurrentStep('Saving results...');
      
      // Save results back to our database via Next.js API
      await saveAnalysisResults(jobId, djangoResult);
      
      setProgress(100);
      setCurrentStep('Analysis completed!');
      setAnalysisResults(djangoResult.analysis);
      setIsLoading(false);
      
      
    } catch (error) {
      console.error('❌ Django direct call failed:', error);
      setIsLoading(false);
      setAnalysisStatus('failed');
      setError(error instanceof Error ? error.message : 'Failed to process analysis');
    }
  };

  const saveAnalysisResults = async (jobId: string, results: any) => {
    try {
      // Update job status and save analysis via Next.js API
      const saveResponse = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: jobId,
          results: results,
          action: 'complete'
        })
      });

      if (!saveResponse.ok) {
        const saveError = await saveResponse.json();
        console.warn('Failed to save analysis results:', saveError);
        // Don't fail the whole process if save fails
      }
    } catch (error) {
      console.warn('Error saving analysis results:', error);
      // Don't fail the whole process if save fails
    }
  };

  const handleConsentResponse = (granted: boolean) => {
    setDataProcessingConsent(granted);
    setIsConsentModalOpen(false);
    
    if (granted && pendingSubmission) {
      // User granted consent, proceed with analysis
      performAnalysis();
    } else if (!granted) {
      alert('Job analysis requires consent for AI processing. You can change this preference in your profile settings later.');
    }
    
    setPendingSubmission(false);
  };

  const handleConsentModalClose = () => {
    setIsConsentModalOpen(false);
    setPendingSubmission(false);
  };
  
  if (!isOpen) return null;
  
  if (analysisResults) {
    return <AnalysisResults results={analysisResults} onClose={handleAnalysisClose} />;
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 rounded-md w-full max-w-lg border border-gray-500/50">
        <div className="relative p-12">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-full bg-gray-500/60 p-1"
            disabled={isLoading}
          >
             <Image
                     className="fill-purple-400 text-gray-400"
                     src="/X.svg"
                     alt="close"
                     width={24}
                     height={24}
                     priority
                  />
          </button>
          
          {/* Title */}
          <div className="flex justify-center mb-8 mt-2">
            <div className="bg-gray-700/50 text-white py-2 px-6 rounded-md border border-gray-500/50">
              Job Analysis
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Resume
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-gray-500/70 border-dashed rounded-md hover:border-purple-500 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <Image
                     className="fill-purple-400 mx-auto h-12 w-12 text-gray-400"
                     src="/filePlus2.svg"
                     alt="profile"
                     width={24}
                     height={24}
                     priority
                  />
                  <div className="flex text-sm text-gray-400">
                    <label
                      htmlFor="resume-upload"
                      className="relative cursor-pointer rounded-md font-medium text-purple-500 hover:text-purple-400 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="resume-upload"
                        name="resume-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={isLoading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">PDF or Word up to 10MB</p>
                </div>
              </div>
              {resumeFile && (
                <p className="mt-2 text-sm text-green-400">
                  Selected file: {resumeFile.name}
                </p>
              )}
            </div>
            
            {/* Job URL Input */}
            <div>
              <label htmlFor="job-url" className="block text-sm font-medium text-gray-300 mb-2">
                Job Posting Link
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
            
            {/* Progress Indicator */}
            {isLoading && (
              <div className="mb-4 p-4 bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">{currentStep}</span>
                  <span className="text-sm text-purple-400">{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {jobId && (
                  <div className="mt-2 text-xs text-gray-400">
                    Job ID: {jobId}
                  </div>
                )}
              </div>
            )}
            
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
                  Processing...
                </div>
              ) : (
                'Analyze'
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Consent Modal */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onConsent={handleConsentResponse}
        onClose={handleConsentModalClose}
        type="job-analysis"
      />
    </div>
  );
}