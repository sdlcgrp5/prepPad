import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHybridAuthData } from '@/utils/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Get user data from either JWT token or NextAuth session
    const tokenData = await getHybridAuthData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    // Find the analysis job
    const job = await prisma.analysisJob.findUnique({
      where: {
        id: jobId,
        userId: tokenData.id, // Ensure user can only access their own jobs
      },
      include: {
        analyses: true, // Include completed analysis if available
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Calculate processing time if job is completed
    let processingTime = null;
    if (job.completedAt && job.startedAt) {
      processingTime = Math.round(
        (job.completedAt.getTime() - job.startedAt.getTime()) / 1000
      );
    }

    // Format response
    const response = {
      id: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      currentStep: job.currentStep,
      completedSteps: job.completedSteps,
      totalSteps: job.totalSteps,
      processingTime,
      jobUrl: job.jobUrl,
      error: job.error,
    };

    // If job is completed, include the results
    if (job.status === 'completed' && job.result) {
      return NextResponse.json({
        ...response,
        result: job.result,
        analysis: job.analyses?.[0] || null, // Include saved analysis record
      });
    }

    // If job failed, include error details
    if (job.status === 'failed') {
      return NextResponse.json({
        ...response,
        error: job.error || 'Unknown error occurred',
      });
    }

    // For pending/processing jobs, return status and progress
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Allow cancelling jobs
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Get user data from either JWT token or NextAuth session
    const tokenData = await getHybridAuthData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    // Find and update the job status to cancelled
    const job = await prisma.analysisJob.findUnique({
      where: {
        id: jobId,
        userId: tokenData.id,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Only allow cancelling pending/processing jobs
    if (job.status !== 'pending' && job.status !== 'processing') {
      return NextResponse.json(
        { error: 'Cannot cancel completed or failed jobs' },
        { status: 400 }
      );
    }

    // Update job status
    const updatedJob = await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        error: 'Cancelled by user',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedJob.id,
      status: updatedJob.status,
      message: 'Job cancelled successfully',
    });

  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}