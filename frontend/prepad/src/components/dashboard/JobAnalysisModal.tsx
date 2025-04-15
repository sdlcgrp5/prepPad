'use client';

import { useState } from 'react';
import AnalysisResults from './AnalysisResults';
import { AnalysisResult } from '@/types';

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  
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
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobUrl', jobUrl);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to analyze job posting');
      }
      
      setAnalysisResults(data.analysis);
      setIsLoading(false);
      
    } catch (err) {
      setIsLoading(false);
      setError('Failed to analyze job posting. Please try again.');
      console.error('Job analysis error:', err);
    }
  };
  
  if (!isOpen) return null;
  
  if (analysisResults) {
    return <AnalysisResults results={analysisResults} onClose={handleAnalysisClose} />;
  }
  
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
          
          {/* Title */}
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
            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Resume
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md hover:border-purple-500 transition-colors duration-200">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
                'Analyze'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}