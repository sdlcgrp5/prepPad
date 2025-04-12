'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import JobAnalysisTable from '@/components/dashboard/JobAnalysisTable';
import JobAnalysisModal from '@/components/dashboard/JobAnalysisModal';
import { useAuth } from '@/context/AuthContext';
import { JobAnalysis } from '@/types';

export default function Dashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobAnalyses, setJobAnalyses] = useState<JobAnalysis[]>([]);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          // No profile, redirect to resume upload
          router.push('/resumeupload');
        } else {
          setHasProfile(true);
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, redirect to resume upload
        router.push('/resumeupload');
      }
    };

    // Only check profile after auth is loaded and if we have a token
    if (!authLoading) {
      checkProfile();
    }
  }, [router, token, authLoading]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulating API call with timeout
      setTimeout(() => {
        setJobAnalyses([]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setJobAnalyses([]);
      setIsLoading(false);
    }
  };

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
      <div className="ml-36 p-8">
        {/* Header */}
        <Header title="Dashboard" />

        {/* Job Analysis Table */}
        <JobAnalysisTable
          analyses={jobAnalyses}
          loading={isLoading}
          onAnalyzeClick={handleOpenModal}
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