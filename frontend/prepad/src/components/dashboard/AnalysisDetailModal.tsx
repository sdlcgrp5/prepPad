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
          const errorData = await response.text();
          console.error('API Error Response:', errorData);
          throw new Error(`Failed to fetch analysis details: ${response.status} ${response.statusText}`);
        }

        const analysisData: AnalysisDetail = await response.json();
        console.log('Analysis data received:', analysisData);
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
              className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-2 rounded font-medium transition duration-300"
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
    // Convert AnalysisDetail to AnalysisResult format with proper data validation
    const analysisResult: AnalysisResult = {
      match_score: analysis.score || 0,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      improvement_tips: Array.isArray(analysis.improvementTips) ? analysis.improvementTips : [],
      keywords_found: Array.isArray(analysis.keywordsFound) ? analysis.keywordsFound : [],
      keywords_missing: Array.isArray(analysis.keywordsMissing) ? analysis.keywordsMissing : []
    };

    return (
      <div className="fixed inset-0 z-50">
        {/* Enhanced AnalysisResults with additional context */}
        <div className="flex items-center justify-center p-2 md:p-4 bg-black/70 backdrop-blur-sm min-h-screen">
          <div className="bg-gray-800/95 backdrop-blur-md rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-700/50">
            <div className="relative p-4 md:p-8">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-white rounded-full bg-gray-700/50 p-2 z-10 font-medium transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Analysis Badge */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-700/80 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-600/50">
                  <span className="text-white font-medium">Analysis</span>
                </div>
              </div>

              {/* Circular Match Score */}
              <div className="flex justify-center mb-6 md:mb-8">
                <div className="relative">
                  <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full backdrop-blur-md border-4 flex items-center justify-center shadow-2xl ${
                    analysis.score >= 80
                      ? 'bg-green-500/20 border-green-500/30'
                      : analysis.score >= 60
                        ? 'bg-yellow-500/20 border-yellow-500/30'
                        : 'bg-red-500/20 border-red-500/30'
                  }`}>
                    <div className="text-center">
                      <div className="text-gray-300 text-xs md:text-sm font-medium mb-1 md:mb-2">Match Score</div>
                      <div className={`text-4xl md:text-5xl font-bold ${
                        analysis.score >= 80
                          ? 'text-green-400'
                          : analysis.score >= 60
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}>
                        {analysis.score}%
                      </div>
                    </div>
                  </div>
                  {/* Outer glow effect */}
                  <div className={`absolute inset-0 rounded-full opacity-30 blur-xl ${
                    analysis.score >= 80 
                      ? 'bg-green-500/40' 
                      : analysis.score >= 60 
                        ? 'bg-yellow-500/40'
                        : 'bg-red-500/40'
                  }`}></div>
                </div>
              </div>

              {/* Company and Role Info Card */}
              <div className="flex justify-center mb-6 md:mb-8">
                <div className="bg-gray-700/60 backdrop-blur-sm rounded-lg px-4 md:px-8 py-4 border border-gray-600/40 w-full md:w-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div>
                      <div className="text-gray-400 text-sm font-medium mb-1">COMPANY</div>
                      <div className="text-white text-lg font-semibold">{analysis.company}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm font-medium mb-1">ROLE</div>
                      <div className="text-white text-lg font-semibold">{analysis.role}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Strengths */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border-l-4 border-green-500 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-green-400">⚡ Strengths</h3>
                  </div>
                  <ul className="space-y-3">
                    {analysisResult.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-200 leading-relaxed flex items-start">
                        <span className="text-green-400 mr-2 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border-l-4 border-red-500 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-red-400">🚀 Areas for Improvement</h3>
                  </div>
                  <ul className="space-y-3">
                    {analysisResult.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-gray-200 leading-relaxed flex items-start">
                        <span className="text-red-400 mr-2 mt-1">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Keywords Found */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border-l-4 border-blue-500 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-blue-400">💎 Keywords Found</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords_found.map((keyword, index) => (
                      <span key={index} className="bg-blue-900/40 border border-blue-500/30 px-3 py-1 rounded-full text-sm text-blue-200 font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border-l-4 border-yellow-500 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-yellow-400">🏷️ Missing Keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords_missing.map((keyword, index) => (
                      <span key={index} className="bg-yellow-900/40 border border-yellow-500/30 px-3 py-1 rounded-full text-sm text-yellow-200 font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Improvement Tips - Full Width Section */}
              <div className="mb-8">
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border-l-4 border-cyan-500 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-cyan-400">💡 Improvement Tips</h3>
                  </div>
                  <ul className="space-y-3">
                    {analysisResult.improvement_tips.map((tip, index) => (
                      <li key={index} className="text-gray-200 leading-relaxed flex items-start">
                        <span className="text-cyan-400 mr-2 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4">
                <a
                  href={analysis.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border border-purple-500/30 text-center"
                >
                  View job posting
                </a>
                <button
                  onClick={onClose}
                  className="bg-gray-700/80 hover:bg-gray-600/80 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border border-gray-600/30"
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