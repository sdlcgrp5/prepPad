'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import AnalysisCard from '@/components/dashboard/AnalysisCard';
import JobAnalysisTable from '@/components/dashboard/JobAnalysisTable';
import JobAnalysisModal from '@/components/dashboard/JobAnalysisModal';
import { useAuth } from '@/context/AuthContext';
// import { jobApplicationApi } from '@/services/apiservices';
import { JobAnalysis } from '@/types';

export default function Dashboard() {
   const { user } = useAuth(); // fix user lint error
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobAnalyses, setJobAnalyses] = useState<JobAnalysis[]>([]);

  
  // Fetch dashboard data on load
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would call the API
      // For now, let's simulate an API call with a timeout
      setTimeout(() => {
        // Empty state for the MVP
        setJobAnalyses([]);

        setIsLoading(false);
      }, 1500);
      
  
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setJobAnalyses([]);
      // setStats({
      //   totalAnalyses: 0,
      //   averageScore: 0,
      //   recentAnalyses: [],
      //   topMissingSkills: []
      // });
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
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="ml-36 p-8">
        {/* Header */}
        <Header title="Dashboard" />

        {/* Analysis Card */}
        <AnalysisCard
          onAnalyzeClick={handleOpenModal}
          loading={isLoading}
        />
        
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