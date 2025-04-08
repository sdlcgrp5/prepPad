// components/dashboard/emptystate.tsx
'use client';

import React from 'react';

interface EmptyStateProps {
  onAnalyzeClick: () => void;
}

export default function EmptyState({ onAnalyzeClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="8" y1="12" x2="16" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="16"></line>
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
      <p className="text-gray-400 mb-6 text-center max-w-md">
        Start by analyzing your resume against job postings to see your match score
      </p>
      <button 
        onClick={onAnalyzeClick}
        className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-6 rounded-md transition">
        Analyze new job posting
      </button>
    </div>
  );
}