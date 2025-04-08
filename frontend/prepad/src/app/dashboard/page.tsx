'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import JobAnalysisTable from '@/components/dashboard/JobAnalysisTable';
import JobAnalysisModal from '@/components/dashboard/JobAnalysisModal';
import { useAuth } from '@/context/AuthContext';
import { jobApplicationApi } from '@/services/apiservices';
import { JobAnalysis, DashboardStats } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [jobAnalyses, setJobAnalyses] = useState<JobAnalysis[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    averageScore: 0,
    recentAnalyses: [],
    topMissingSkills: []
  });
  
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
        setStats({
          totalAnalyses: 0,
          averageScore: 0,
          recentAnalyses: [],
          topMissingSkills: []
        });
        setIsLoading(false);
      }, 1500);
      
      // Uncomment these lines when your API is ready
      // const analysesResponse = await jobApplicationApi.getJobAnalyses();
      // setJobAnalyses(analysesResponse.data || []);
      // const statsResponse = await jobApplicationApi.getDashboardStats();
      // setStats(statsResponse.data || {
      //   totalAnalyses: 0,
      //   averageScore: 0,
      //   recentAnalyses: [],
      //   topMissingSkills: []
      // });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setJobAnalyses([]);
      setStats({
        totalAnalyses: 0,
        averageScore: 0,
        recentAnalyses: [],
        topMissingSkills: []
      });
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