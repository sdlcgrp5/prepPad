// components/dashboard/AnalysisCard.tsx
'use client';
import Image from "next/image";

interface AnalysisCardProps {
  onAnalyzeClick: () => void;
  loading?: boolean;
}

export default function AnalysisCard({ onAnalyzeClick, loading = false }: AnalysisCardProps) {
  return (
    <div className="bg-purple-900 rounded-lg p-6 flex flex-col mb-8 w-80 ml-auto">
      <div className="mb-2 flex items-center">
        <span className=" bg-gray-700/60 p-1 rounded mr-2">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            <Image
               className="fill-purple-400"
               src="/QrCode.svg"
               alt="job analysis"
               width={24}
               height={24}
               priority
             />
          </div>
        </span>
        <span className="font-semibold">Application analysis</span>
      </div>
      <p className="text-sm mb-4">Optimize your job application, <br /> find what is missing in your resume</p>
      <button 
        onClick={onAnalyzeClick}
        disabled={loading}
        className={`mt-auto ${
          loading 
            ? 'bg-white/70 cursor-not-allowed' 
            : 'bg-white/90 hover:bg-gray-100'
        } text-purple-900 py-2 rounded-md font-medium transition-colors`}
      >
        {loading ? 'Processing...' : 'Analyze'}
      </button>
    </div>
  );
}