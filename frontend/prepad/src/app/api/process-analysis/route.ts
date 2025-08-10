import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Find the job
    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: { user: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status !== 'pending') {
      return NextResponse.json(
        { error: 'Job is not in pending status' },
        { status: 400 }
      );
    }

    // Update job to processing status
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        startedAt: new Date(),
        currentStep: 'Starting analysis',
        progress: 10,
      },
    });

    // Start background processing (don't await - let it run in background)
    processAnalysisInBackground(jobId);

    return NextResponse.json({ 
      success: true, 
      message: 'Analysis processing started' 
    });

  } catch (error) {
    console.error('Error starting analysis processing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processAnalysisInBackground(jobId: string) {
  try {
    console.log(`🚀 Starting background processing for job ${jobId}`);
    
    // Get the job with user data
    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: { user: true },
    });

    if (!job) {
      console.error(`Job ${jobId} not found`);
      return;
    }

    // Update progress: Step 1 - Preparing to contact Django backend
    await updateJobProgress(jobId, 20, 'Preparing analysis request', 0);

    // Generate JWT token for Django backend authentication
    const jwt = require('jsonwebtoken');
    let backendJwtToken: string | null = null;
    
    try {
      const secret = process.env.JWT_SECRET as string;
      if (secret) {
        const now = Math.floor(Date.now() / 1000);
        backendJwtToken = jwt.sign(
          { 
            user_id: job.userId,
            email: job.user.email,
            token_type: 'access',
            exp: now + (60 * 60),  // 1 hour expiry
            iat: now,
            jti: `${job.userId}_${now}_${Math.random().toString(36).substr(2, 9)}`
          }, 
          secret
        );
        console.log(`Generated JWT token for job ${jobId}`);
      }
    } catch (error) {
      console.log(`Failed to generate JWT token for job ${jobId}:`, error);
    }

    // Get file data from job result (stored as base64)
    const jobResult = job.result as any;
    if (!jobResult || !jobResult.fileData) {
      throw new Error('Resume file data not found in job');
    }

    // Convert base64 back to file
    const fileBuffer = Buffer.from(jobResult.fileData, 'base64');
    const file = new File([fileBuffer], jobResult.fileName, { type: jobResult.fileType });

    // Create form data for Django backend
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_posting_url', job.jobUrl);
    formData.append('anonymize_pii', job.anonymizePii.toString());
    
    const headers: Record<string, string> = {};
    
    if (backendJwtToken) {
      headers['Authorization'] = `Bearer ${backendJwtToken}`;
    }

    // Update progress: Step 2 - Contacting Django backend
    await updateJobProgress(jobId, 40, 'Processing with Django backend', 1);

    // Call Django backend (this is the long-running operation)
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    
    console.log(`Calling Django backend for job ${jobId}: ${backendUrl}/api/analysis/`);
    
    const response = await fetch(`${backendUrl}/api/analysis/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.detail || `Django backend error: ${response.status}`);
    }
    
    // Update progress: Step 3 - Processing complete
    await updateJobProgress(jobId, 90, 'Finalizing results', 2);

    console.log(`✅ Django backend processing completed for job ${jobId}`);

    // Save analysis to database using real results from Django
    const analysis = await prisma.analysis.create({
      data: {
        userId: job.userId,
        jobId: jobId,
        jobTitle: result.job_details?.title || 'Unknown Position',
        company: result.job_details?.company_name || 'Unknown Company',
        jobUrl: job.jobUrl,
        matchScore: parseInt(result.analysis?.match_score) || 0,
        strengths: Array.isArray(result.analysis?.strengths) ? result.analysis.strengths : [],
        weaknesses: Array.isArray(result.analysis?.weaknesses) ? result.analysis.weaknesses : [],
        improvementTips: Array.isArray(result.analysis?.improvement_tips) ? result.analysis.improvement_tips : [],
        keywordsFound: Array.isArray(result.analysis?.keywords_found) ? result.analysis.keywords_found : [],
        keywordsMissing: Array.isArray(result.analysis?.keywords_missing) ? result.analysis.keywords_missing : [],
        wasAnonymized: job.anonymizePii,
      },
    });

    // Update job to completed
    const processingTime = job.startedAt 
      ? Math.round((new Date().getTime() - job.startedAt.getTime()) / 1000)
      : 0;

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        currentStep: 'Analysis complete',
        completedSteps: 3,
        result: result,
        processingTime,
      },
    });

    console.log(`✅ Job ${jobId} completed successfully in ${processingTime} seconds`);

  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);
    
    // Update job to failed status
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

// Helper function to update job progress
async function updateJobProgress(
  jobId: string, 
  progress: number, 
  currentStep: string, 
  completedSteps: number
) {
  try {
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        progress,
        currentStep,
        completedSteps,
        updatedAt: new Date(),
      },
    });
    console.log(`📊 Job ${jobId} progress: ${progress}% - ${currentStep}`);
  } catch (error) {
    console.error(`Failed to update progress for job ${jobId}:`, error);
  }
}

export const maxDuration = 300; // Allow up to 5 minutes for this endpoint