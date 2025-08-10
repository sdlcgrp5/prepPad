import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHybridAuthData } from '@/utils/auth';
import { checkRateLimit, incrementRateLimit } from '@/utils/rateLimit';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Get user data from either JWT token or NextAuth session
    const tokenData = await getHybridAuthData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit before processing
    const rateLimitResult = await checkRateLimit(request, tokenData.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitResult.error || 'Rate limit exceeded',
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }, 
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('resume') as File;
    const jobUrl = formData.get('jobUrl') as string;
    const anonymizePii = formData.get('anonymizePii') === 'true';

    if (!file || !jobUrl) {
      return NextResponse.json(
        { error: 'Resume file and job URL are required' },
        { status: 400 }
      );
    }

    // Create analysis job in database
    const analysisJob = await prisma.analysisJob.create({
      data: {
        userId: tokenData.id,
        jobUrl: jobUrl,
        resumeFileName: file.name,
        resumeFileSize: file.size,
        anonymizePii: anonymizePii,
        status: 'pending',
        currentStep: 'Job created, waiting to start processing',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

    console.log(`📝 Created analysis job ${analysisJob.id} for user ${tokenData.id}`);

    // Store file temporarily (you might want to use a different storage method)
    // For now, we'll convert to base64 and store in job result temporarily
    const fileBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString('base64');
    
    // Update job with file data (temporary solution)
    await prisma.analysisJob.update({
      where: { id: analysisJob.id },
      data: {
        result: {
          fileData: fileBase64,
          fileName: file.name,
          fileType: file.type,
        },
      },
    });

    // Trigger background processing
    try {
      const processResponse = await fetch(`${request.nextUrl.origin}/api/process-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId: analysisJob.id }),
      });

      if (!processResponse.ok) {
        console.error('Failed to start background processing:', await processResponse.text());
      } else {
        console.log(`🚀 Background processing started for job ${analysisJob.id}`);
      }
    } catch (processError) {
      console.error('Error starting background processing:', processError);
      // Don't fail the request if background processing fails to start
      // The job is still created and can be processed later
    }

    // Increment rate limit counter after creating job
    await incrementRateLimit(request, tokenData.id);

    // Return job information immediately
    return NextResponse.json({
      success: true,
      jobId: analysisJob.id,
      status: 'pending',
      message: 'Analysis job created successfully. Processing in background.',
      progress: 0,
      estimatedTime: '30-60 seconds',
      rateLimitRemaining: rateLimitResult.remaining - 1,
      // Include polling information for frontend
      polling: {
        statusUrl: `/api/analysis-status/${analysisJob.id}`,
        recommendedInterval: 2000, // Poll every 2 seconds
        maxWaitTime: 120000, // Stop polling after 2 minutes
      },
    });

  } catch (error) {
    console.error('Error creating analysis job:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
