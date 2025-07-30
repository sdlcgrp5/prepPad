'use client';

import { useState, useEffect } from 'react';
import { AnalysisDetail, AnalysisResult } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface AnalysisDetailModalProps {
  analysisId: number | null;
  onClose: () => void;
}

export default function AnalysisDetailModal({ analysisId, onClose }: AnalysisDetailModalProps) {
  const { token } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId || !token) {
      setAnalysis(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/analysis/${analysisId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analysis details');
        }

        const analysisData: AnalysisDetail = await response.json();
        setAnalysis(analysisData);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId, token]);

  // Don't render anything if no analysisId
  if (!analysisId) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-white">Loading analysis details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Analysis</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-2 rounded transition duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show analysis
  if (analysis) {
    // Convert AnalysisDetail to AnalysisResult format for AnalysisResults component
    const analysisResult: AnalysisResult = {
      match_score: analysis.score,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      improvement_tips: analysis.improvementTips,
      keywords_found: analysis.keywordsFound,
      keywords_missing: analysis.keywordsMissing
    };

    return (
      <div className="fixed inset-0 z-50">
        {/* Enhanced AnalysisResults with additional context */}
        <div className="flex items-center justify-center p-4 bg-black/70 min-h-screen">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="relative p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-full bg-gray-700/50 p-1 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Analysis Header with Context */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Analysis Results</h2>
                <div className="text-gray-400 mb-4">
                  <p className="text-lg">{analysis.company} • {analysis.role}</p>
                  <p className="text-sm">Analyzed on {new Date(analysis.uploadedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-center items-center space-x-2">
                  <div className="text-lg">Match Score:</div>
                  <div className={`text-2xl font-bold ${
                    analysis.score >= 80 ? 'text-green-400' :
                    analysis.score >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {analysis.score}%
                  </div>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">Strengths</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {analysisResult.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-200">{strength}</li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">Areas for Improvement</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {analysisResult.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-gray-200">{weakness}</li>
                    ))}
                  </ul>
                </div>

                {/* Keywords Found */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">Keywords Found</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords_found.map((keyword, index) => (
                      <span key={index} className="bg-purple-900/50 px-2 py-1 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords_missing.map((keyword, index) => (
                      <span key={index} className="bg-yellow-900/50 px-2 py-1 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Improvement Tips */}
                <div className="bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">Improvement Tips</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {analysisResult.improvement_tips.map((tip, index) => (
                      <li key={index} className="text-gray-200">{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center mt-8 space-x-4">
                <a
                  href={analysis.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-2 rounded transition duration-300"
                >
                  View Job Posting
                </a>
                <button
                  onClick={onClose}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}