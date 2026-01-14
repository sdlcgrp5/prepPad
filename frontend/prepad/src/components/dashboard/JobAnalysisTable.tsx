// components/dashboard/JobAnalysisTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import EmptyState from './EmptyState';
import Image from 'next/image';
import { JobAnalysis } from '@/types';

interface JobAnalysisTableProps {
  analyses: JobAnalysis[];
  loading?: boolean;
  onAnalyzeClick: () => void;
  onAnalysisClick: (analysisId: number) => void;
  onDeleteAnalyses?: (analysisIds: number[]) => void;
}

export default function JobAnalysisTable({ analyses, loading = false, onAnalyzeClick, onAnalysisClick, onDeleteAnalyses }: JobAnalysisTableProps) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  // Ensure analyses is always an array to prevent map errors
  const safeAnalyses = Array.isArray(analyses) ? analyses : [];
  
  const toggleAllRows = () => {
    if (selectedRows.length === safeAnalyses.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(safeAnalyses.map(analysis => analysis.id));
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
  const totalPages = Math.ceil(safeAnalyses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = safeAnalyses.slice(startIndex, endIndex);
  
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

  const handleDeleteSelected = () => {
    if (selectedRows.length > 0 && onDeleteAnalyses) {
      onDeleteAnalyses(selectedRows);
      setSelectedRows([]); // Clear selection after delete
    }
  };

  const handleRowClick = (analysisId: number, event: React.MouseEvent) => {
    // Don't trigger if clicking on checkbox or link
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.closest('a') || target.closest('input')) {
      return;
    }
    onAnalysisClick(analysisId);
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
      <div className="bg-gray-800/50 rounded-md p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-400">Loading job analyses...</p>
      </div>
    );
  }
  
  // Table header component for reuse
  const TableHeader = () => (
    <div className="pt-4 pb-4 pl-6 border-b border-gray-500 font-normal">
      {/* Show delete button when items are selected */}
      {selectedRows.length > 0 && onDeleteAnalyses ? (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-gray-300 mr-4">
              {selectedRows.length} item{selectedRows.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="m19 6-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
                <path d="m10 11 6"></path>
                <path d="m12 17 6"></path>
              </svg>
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedRows([])}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        </div>
      ) : null}
      
      {/* Regular header row - hidden on mobile */}
      <div className="hidden md:grid grid-cols-5 gap-4">
        <div className="flex items-center">
          <input 
            type="checkbox" 
            className="mr-2"
            checked={safeAnalyses.length > 0 && selectedRows.length === safeAnalyses.length}
            onChange={toggleAllRows}
            disabled={safeAnalyses.length === 0}
          />
          <button className="flex items-center ">
            Company
              <div className="ml-1">
                 <Image 
                    src="/CodeSimple.svg"
                    alt="sorting"
                    width={16}
                    height={16}
                    priority
                 />
              </div>
          </button>
        </div>
        <button className="flex items-center">
          Date uploaded
          <div className="ml-1">
                 <Image 
                    src="/CodeSimple.svg"
                    alt="sorting"
                    width={16}
                    height={16}
                    priority
                 />
              </div>
        </button>
        <div>Role</div>
        <div>Source</div>
        <button className="flex items-center">
          Score
          <div className="ml-1">
                 <Image 
                    src="/CodeSimple.svg"
                    alt="sorting"
                    width={16}
                    height={16}
                    priority
                 />
              </div>
        </button>
      </div>
    </div>
  );
  
  if (safeAnalyses.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg overflow-hidden">
        <TableHeader />
        <EmptyState onAnalyzeClick={onAnalyzeClick} />
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden">
      <TableHeader />

      {/* Desktop Table rows - hidden on mobile */}
      {currentItems.map((analysis) => (
        <div key={analysis.id}>
          {/* Desktop grid view */}
          <div
            className="hidden md:grid grid-cols-5 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
            onClick={(e) => handleRowClick(analysis.id, e)}
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

          {/* Mobile card view */}
          <div
            className="md:hidden p-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
            onClick={(e) => handleRowClick(analysis.id, e)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedRows.includes(analysis.id)}
                  onChange={() => toggleRowSelection(analysis.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-2">
                      {analysis.company.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold">{analysis.company}</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-1">{analysis.role}</div>
                  <div className="text-xs text-gray-500">{formatDate(analysis.uploadedAt)}</div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-white text-sm ${getScoreColor(analysis.score)}`}>
                {analysis.score}
              </span>
            </div>
            <div className="mt-2">
              <Link href={analysis.source} className="text-blue-400 hover:underline text-sm">
                View Source
              </Link>
            </div>
          </div>
        </div>
      ))}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-700 flex justify-center md:justify-end">
          <div className="flex items-center space-x-1">
            <button
              className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded ${
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
              className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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