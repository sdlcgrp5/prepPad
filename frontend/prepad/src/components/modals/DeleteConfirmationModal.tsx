'use client';

import { useEffect } from 'react';
import { JobAnalysis } from '@/types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  analysesToDelete: JobAnalysis[];
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  analysesToDelete,
  isDeleting = false 
}: DeleteConfirmationModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  const count = analysesToDelete.length;
  const isMultiple = count > 1;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800/95 backdrop-blur-md rounded-lg w-full max-w-md shadow-2xl border border-gray-700/50">
        <div className="relative p-8">
          {/* Close button */}
          {!isDeleting && (
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 text-gray-400 hover:text-white rounded-full bg-gray-700/50 p-2 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}

          {/* Title Badge */}
          <div className="flex justify-center mb-8 mt-2">
            <div className="bg-red-700/80 backdrop-blur-sm px-6 py-2 rounded-full border border-red-500/50">
              <span className="text-white font-medium">Delete Confirmation</span>
            </div>
          </div>

          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="m12 17 .01 0"/>
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-6">
            {/* Main message */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">
                {isMultiple ? `Delete ${count} Analyses?` : 'Delete Analysis?'}
              </h2>
              <p className="text-gray-300 text-lg">
                {isMultiple 
                  ? `You are about to permanently delete ${count} job analyses. This action cannot be undone.`
                  : 'You are about to permanently delete this job analysis. This action cannot be undone.'
                }
              </p>
            </div>

            {/* List of analyses being deleted */}
            {count <= 5 ? (
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-500/50">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  {isMultiple ? 'Analyses to be deleted:' : 'Analysis to be deleted:'}
                </h3>
                <div className="space-y-2">
                  {analysesToDelete.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-medium">
                          {analysis.company.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{analysis.company}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-300">{analysis.role}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        analysis.score >= 80 ? 'bg-green-800 text-green-200' :
                        analysis.score >= 60 ? 'bg-yellow-800 text-yellow-200' :
                        'bg-red-800 text-red-200'
                      }`}>
                        {analysis.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-500/50">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  {count} analyses selected for deletion
                </h3>
                <p className="text-gray-400 text-sm">
                  Including analyses from {Array.from(new Set(analysesToDelete.map(a => a.company))).slice(0, 3).join(', ')}
                  {Array.from(new Set(analysesToDelete.map(a => a.company))).length > 3 && ' and others'}
                </p>
              </div>
            )}

            {/* Warning message */}
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m15 9-6 6"/>
                  <path d="m9 9 6 6"/>
                </svg>
                <div className="text-left">
                  <p className="text-red-200 text-sm font-medium">Permanent Action</p>
                  <p className="text-red-300 text-sm mt-1">
                    Once deleted, these analyses and their results cannot be recovered. All associated data will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-6">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isDeleting 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center ${
                isDeleting
                  ? 'bg-red-700/50 text-red-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isDeleting && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isDeleting ? 'Deleting...' : `Delete ${isMultiple ? `${count} Analyses` : 'Analysis'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}