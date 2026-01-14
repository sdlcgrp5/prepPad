'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import JobAnalysisTable from '@/components/dashboard/JobAnalysisTable';
import JobAnalysisModal from '@/components/dashboard/JobAnalysisModal';
import AnalysisDetailModal from '@/components/dashboard/AnalysisDetailModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import AnalysisCard from '@/components/dashboard/AnalysisCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuth } from '@/context/AuthContext';
import { JobAnalysis, AnalysisHistoryResponse } from '@/types';

export default function Dashboard() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobAnalyses, setJobAnalyses] = useState<JobAnalysis[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ensure jobAnalyses is always a safe array for components
  const safeJobAnalyses = Array.isArray(jobAnalyses) ? jobAnalyses : [];
  const [hasProfile, setHasProfile] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      console.log('No token available for fetching dashboard data');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/analysis/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - redirecting to login');
          router.push('/');
          return;
        }
        throw new Error(`Failed to fetch analysis history: ${response.status}`);
      }

      const data: AnalysisHistoryResponse = await response.json();
      // Multiple layers of safety for array handling
      let analyses: JobAnalysis[] = [];
      
      if (data && typeof data === 'object') {
        if (Array.isArray(data.analyses)) {
          analyses = data.analyses.filter(analysis => 
            analysis && 
            typeof analysis === 'object' && 
            analysis.id && 
            analysis.company && 
            analysis.role
          );
        }
      }
      
      setJobAnalyses(analyses);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Always ensure we have an array to prevent map errors
      setJobAnalyses([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    const initializeDashboard = () => {
      if (authLoading) {
        // Still loading authentication, wait
        return;
      }

      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/');
        return;
      }

      // Assume user has at least minimal profile (created during signup)
      setHasProfile(true);
      fetchDashboardData();
    };

    initializeDashboard();
  }, [router, token, authLoading, fetchDashboardData]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAnalysisSuccess = () => {
    // Refresh dashboard data after successful analysis
    fetchDashboardData();
  };

  const handleAnalysisClick = (analysisId: number) => {
    // Open analysis detail modal
    setSelectedAnalysisId(analysisId);
    setIsDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedAnalysisId(null);
  };

  const handleDeleteAnalyses = async (analysisIds: number[]) => {
    if (!token) {
      console.error('No authentication token available');
      return;
    }

    // Show custom confirmation modal instead of browser confirm
    setPendingDeleteIds(analysisIds);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || pendingDeleteIds.length === 0) {
      return;
    }

    try {
      setIsDeleting(true);

      // Use bulk delete endpoint for efficiency
      const response = await fetch('/api/analysis/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analysisIds: pendingDeleteIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete analyses');
      }

      const result = await response.json();

      // Close modal and clear pending deletes
      setIsDeleteModalOpen(false);
      setPendingDeleteIds([]);

      // Refresh dashboard data after successful deletion
      await fetchDashboardData();
      
      // Show success message
      const successMessage = pendingDeleteIds.length === 1 
        ? 'Analysis deleted successfully' 
        : `${result.deletedCount} analyses deleted successfully`;
      
      // You could use a toast library here instead of alert
      alert(successMessage);

    } catch (error) {
      console.error('Error deleting analyses:', error);
      alert('Failed to delete analyses. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setPendingDeleteIds([]);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Show loading state while auth is being checked
  if (authLoading || !hasProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-100"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Sidebar */}
        <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

        {/* Main content */}
        <div className="ml-0 md:ml-40 p-4 md:p-8">
          {/* Header */}
          <Header title="Dashboard" onMenuToggle={toggleMobileMenu} />

          {/* Analysis Card */}
          <ErrorBoundary fallback={
            <div className="bg-gray-800/50 rounded-md p-8 text-center">
              <p className="text-gray-400">Unable to load analysis card</p>
            </div>
          }>
            <AnalysisCard onAnalyzeClick={handleOpenModal} loading={isLoading} />
          </ErrorBoundary>

          {/* Job Analysis Table */}
          <ErrorBoundary fallback={
            <div className="bg-gray-800/50 rounded-md p-8 text-center">
              <p className="text-gray-400">Unable to load analysis history</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
              >
                Refresh Page
              </button>
            </div>
          }>
            <JobAnalysisTable
              analyses={safeJobAnalyses}
              loading={isLoading}
              onAnalyzeClick={handleOpenModal}
              onAnalysisClick={handleAnalysisClick}
              onDeleteAnalyses={handleDeleteAnalyses}
            />
          </ErrorBoundary>

          {/* Job Analysis Modal */}
          <JobAnalysisModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSuccess={handleAnalysisSuccess}
          />

          {/* Analysis Detail Modal */}
          <AnalysisDetailModal
            analysisId={selectedAnalysisId}
            onClose={handleDetailModalClose}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            analysesToDelete={safeJobAnalyses.filter(analysis => pendingDeleteIds.includes(analysis.id))}
            isDeleting={isDeleting}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}