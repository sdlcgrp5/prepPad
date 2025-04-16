'use client';

interface AnalysisResult {
  strengths: string[];
  weaknesses: string[];
  improvement_tips: string[];
  keywords_missing: string[];
  keywords_found: string[];
  match_score: number;
}

interface AnalysisResultsProps {
  results: AnalysisResult;
  onClose: () => void;
}

export default function AnalysisResults({ results, onClose }: AnalysisResultsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="relative p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white rounded-full bg-gray-700/50 p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Title and Score */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Analysis Results</h2>
            <div className="flex justify-center items-center space-x-2">
              <div className="text-lg">Match Score:</div>
              <div className={`text-2xl font-bold ${
                results.match_score >= 80 ? 'text-green-400' :
                results.match_score >= 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {results.match_score}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-3">Strengths</h3>
              <ul className="list-disc list-inside space-y-2">
                {results.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-200">{strength}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-400 mb-3">Areas for Improvement</h3>
              <ul className="list-disc list-inside space-y-2">
                {results.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-gray-200">{weakness}</li>
                ))}
              </ul>
            </div>

            {/* Keywords */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Keywords Found</h3>
              <div className="flex flex-wrap gap-2">
                {results.keywords_found.map((keyword, index) => (
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
                {results.keywords_missing.map((keyword, index) => (
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
                {results.improvement_tips.map((tip, index) => (
                  <li key={index} className="text-gray-200">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
