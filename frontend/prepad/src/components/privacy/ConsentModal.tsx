'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ConsentModalProps {
  isOpen: boolean;
  onConsent: (granted: boolean) => void;
  onClose: () => void;
  type: 'resume-upload' | 'job-analysis';
}

export default function ConsentModal({ isOpen, onConsent, onClose, type }: ConsentModalProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false);

  if (!isOpen) return null;

  const handleConsent = (granted: boolean) => {
    onConsent(granted);
    if (!granted) {
      onClose();
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'resume-upload':
        return 'Resume Processing Consent';
      case 'job-analysis':
        return 'Job Analysis Consent';
      default:
        return 'Data Processing Consent';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'resume-upload':
        return 'Your resume will be processed by our AI system to extract and analyze your professional information.';
      case 'job-analysis':
        return 'Your profile and resume data will be analyzed against job postings to provide matching insights.';
      default:
        return 'Your data will be processed by our AI system.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700/50">
        <div className="relative p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white rounded-full bg-gray-700/50 p-2 transition-colors duration-200"
          >
            <Image
              src="/X.svg"
              alt="close"
              width={20}
              height={20}
              priority
            />
          </button>

          {/* Title */}
          <div className="flex justify-center mb-8 mt-2">
            <div className="bg-gray-700/80 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-500/50">
              <span className="text-white font-medium">{getTitle()}</span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Main Description */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-4">AI Processing Notice</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {getDescription()}
              </p>
            </div>

            {/* Privacy Information */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-500/50">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">🔒 Privacy & Data Protection</h3>
              
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-white">External AI Processing:</strong> Your data will be processed by DeepSeek AI, an external artificial intelligence service, to provide resume analysis and job matching insights.
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-white">Data Anonymization:</strong> We implement privacy-preserving techniques to protect your personal information during processing.
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-white">Data Security:</strong> All data transmission is encrypted and secure. We do not store your data longer than necessary for processing.
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-white">Your Control:</strong> You can withdraw consent at any time and request deletion of your processed data through your profile settings.
                  </div>
                </div>
              </div>
            </div>

            {/* What data is processed */}
            <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-500/50">
              <h3 className="text-lg font-semibold text-blue-400 mb-4">📋 Data Processing Details</h3>
              
              <div className="text-gray-300">
                <p className="mb-3">The following information may be processed:</p>
                <ul className="space-y-2 text-sm">
                  {type === 'resume-upload' && (
                    <>
                      <li className="flex items-center space-x-2">
                        <span className="text-blue-400">•</span>
                        <span>Resume content and formatting</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-blue-400">•</span>
                        <span>Professional experience and skills</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-blue-400">•</span>
                        <span>Education and qualifications</span>
                      </li>
                    </>
                  )}
                  {type === 'job-analysis' && (
                    <>
                      <li className="flex items-center space-x-2">
                        <span className="text-blue-400">•</span>
                        <span>Your professional profile information</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-blue-400">•</span>
                        <span>Job posting content for comparison</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-blue-400">•</span>
                        <span>Skills and experience matching analysis</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start space-x-3 bg-gray-700/30 rounded-lg p-4 border border-gray-500/50">
              <input
                type="checkbox"
                id="consent-terms"
                checked={hasReadTerms}
                onChange={(e) => setHasReadTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="consent-terms" className="text-gray-300 text-sm">
                I have read and understand the privacy notice above. I consent to the processing of my data by external AI services for the purpose of resume analysis and job matching. I understand that I can withdraw this consent at any time.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-4">
              <button
                onClick={() => handleConsent(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Decline
              </button>
              <button
                onClick={() => handleConsent(true)}
                disabled={!hasReadTerms}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  hasReadTerms
                    ? 'bg-purple-700 hover:bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}