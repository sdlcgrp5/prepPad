// components/dashboard/JobAnalysisTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
// import EmptyState from './EmptyState';
import { JobAnalysis } from '@/types';

interface JobAnalysisTableProps {
  analyses: JobAnalysis[];
  loading?: boolean;
  onAnalyzeClick: () => void;
}

export default function JobAnalysisTable({ analyses, loading = false, onAnalyzeClick }: JobAnalysisTableProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  const toggleAllRows = () => {
    if (selectedRows.length === analyses.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(analyses.map(analysis => analysis.id));
    }
  };
  
  const toggleRowSelection = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(analyses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = analyses.slice(startIndex, endIndex);
  
  // Generate array of page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-800';
    if (score >= 50) return 'bg-yellow-800';
    return 'bg-red-800';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };
  
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-400">Loading job analyses...</p>
      </div>
    );
  }
  
  // Table header component for reuse
  const TableHeader = () => (
    <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 font-semibold">
      <div className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-2"
          checked={analyses.length > 0 && selectedRows.length === analyses.length}
          onChange={toggleAllRows}
          disabled={analyses.length === 0}
        />
        <button className="flex items-center">
          Company
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="M6 9l6 6 6-6"></path>
          </svg>
        </button>
      </div>
      <button className="flex items-center">
        Date uploaded
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
      <div>Role</div>
      <div>Source</div>
      <button className="flex items-center">
        Score
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
    </div>
  );
  
  // if (analyses.length === 0) {
    // return (
      // <div className="bg-gray-800 rounded-lg overflow-hidden">
        // <TableHeader />
        // <EmptyState onAnalyzeClick={onAnalyzeClick} />
      // </div>
   // );
 // }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <TableHeader />
      
      {/* Table rows */}
      {currentItems.map((analysis) => (
        <div 
          key={analysis.id}
          className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center">
            <input 
              type="checkbox" 
              className="mr-2"
              checked={selectedRows.includes(analysis.id)}
              onChange={() => toggleRowSelection(analysis.id)}
            />
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                {analysis.company.charAt(0).toUpperCase()}
              </div>
              {analysis.company}
            </div>
          </div>
          <div>{formatDate(analysis.uploadedAt)}</div>
          <div>{analysis.role}</div>
          <div>
            <Link href={analysis.source} className="text-blue-400 hover:underline">
              Link
            </Link>
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-white ${getScoreColor(analysis.score)}`}>
              {analysis.score}/100
            </span>
          </div>
        </div>
      ))}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <div className="flex items-center space-x-1">
            <button 
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-600"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            {pageNumbers.map(number => (
              <button 
                key={number}
                className={`w-8 h-8 flex items-center justify-center rounded ${
                  currentPage === number 
                    ? 'bg-purple-700 text-white' 
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
                onClick={() => goToPage(number)}
              >
                {number}
              </button>
            ))}
            
            <button 
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-600"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}