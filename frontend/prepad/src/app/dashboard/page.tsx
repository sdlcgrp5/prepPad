'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import JobAnalysisTable from '@/components/dashboard/JobAnalysisTable';
import JobAnalysisModal from '@/components/dashboard/JobAnalysisModal';
import AnalysisCard from '@/components/dashboard/AnalysisCard';
import { useAuth } from '@/context/AuthContext';
import { JobAnalysis, AnalysisHistoryResponse } from '@/types';

export default function Dashboard() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobAnalyses, setJobAnalyses] = useState<JobAnalysis[]>([]);
  const [hasProfile, setHasProfile] = useState(false);

  const fetchDashboardData = useCallback(async () => {
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
        throw new Error('Failed to fetch analysis history');
      }

      const data: AnalysisHistoryResponse = await response.json();
      setJobAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setJobAnalyses([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!token) {
        router.push('/');
        return;
      }

      // Assume user has at least minimal profile (created during signup)
      setHasProfile(true);
      fetchDashboardData();
    };

    // Only initialize after auth is loaded and if we have a token
    if (!authLoading) {
      initializeDashboard();
    }
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
    // Handle viewing specific analysis details
    console.log('Analysis clicked:', analysisId);
    // TODO: Implement analysis detail view
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="ml-40 mr-1- p-8">
        {/* Header */}
        <Header title="Dashboard" />

        {/* Analysis Card */}
        <AnalysisCard onAnalyzeClick={handleOpenModal} loading={isLoading} />

        {/* Job Analysis Table */}
        <JobAnalysisTable
          analyses={jobAnalyses}
          loading={isLoading}
          onAnalyzeClick={handleOpenModal}
          onAnalysisClick={handleAnalysisClick}
        />

        {/* Job Analysis Modal */}
        <JobAnalysisModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleAnalysisSuccess}
        />
      </div>
    </div>
  );
}