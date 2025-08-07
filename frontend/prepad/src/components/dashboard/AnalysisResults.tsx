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
    <div className="fixed inset-0 z-50">
      {/* Enhanced modal with backdrop blur */}
      <div className="flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm min-h-screen">
        <div className="bg-gray-800/95 backdrop-blur-md rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700/50">
          <div className="relative p-8">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-white rounded-full bg-gray-700/50 p-2 z-10 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Analysis Badge */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-700/80 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-600/50">
                <span className="text-white font-medium">Analysis Results</span>
              </div>
            </div>

            {/* Circular Match Score */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className={`w-48 h-48 rounded-full backdrop-blur-md border-4 flex items-center justify-center shadow-2xl ${
                  results.match_score >= 80 
                    ? 'bg-green-500/20 border-green-500/30' 
                    : results.match_score >= 60 
                      ? 'bg-yellow-500/20 border-yellow-500/30'
                      : 'bg-red-500/20 border-red-500/30'
                }`}>
                  <div className="text-center">
                    <div className="text-gray-300 text-sm font-medium mb-2">Match Score</div>
                    <div className={`text-5xl font-bold ${
                      results.match_score >= 80 
                        ? 'text-green-400' 
                        : results.match_score >= 60 
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}>
                      {results.match_score}%
                    </div>
                  </div>
                </div>
                {/* Outer glow effect */}
                <div className={`absolute inset-0 rounded-full opacity-30 blur-xl ${
                  results.match_score >= 80 
                    ? 'bg-green-500/40' 
                    : results.match_score >= 60 
                      ? 'bg-yellow-500/40'
                      : 'bg-red-500/40'
                }`}></div>
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
                  {results.strengths.map((strength, index) => (
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
                  {results.weaknesses.map((weakness, index) => (
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
                  {results.keywords_found.map((keyword, index) => (
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
                  {results.keywords_missing.map((keyword, index) => (
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
                  {results.improvement_tips.map((tip, index) => (
                    <li key={index} className="text-gray-200 leading-relaxed flex items-start">
                      <span className="text-cyan-400 mr-2 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
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
