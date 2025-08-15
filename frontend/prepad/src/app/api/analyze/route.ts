import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHybridAuthData } from '@/utils/auth';
import { checkRateLimit, incrementRateLimit } from '@/utils/rateLimit';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Get user data from either JWT token or NextAuth session
    const tokenData = await getHybridAuthData(request);
    console.log('🔍 tokenData from getHybridAuthData:', tokenData);
    
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!tokenData.id) {
      console.error('❌ tokenData.id is undefined:', tokenData);
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
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

    // Store basic file info for tracking (client will handle the actual file)
    await prisma.analysisJob.update({
      where: { id: analysisJob.id },
      data: {
        resumeFileName: file.name,
        resumeFileSize: file.size,
      },
    });

    console.log(`✅ Job ${analysisJob.id} created - client will handle processing directly`);
    // Note: No background processing triggered here - client handles Django API calls directly

    // Increment rate limit counter after creating job
    await incrementRateLimit(request, tokenData.id);

    // Return job information immediately
    return NextResponse.json({
      success: true,
      jobId: analysisJob.id,
      status: 'pending',
      message: 'Analysis job created successfully. Client will process directly.',
      progress: 0,
      estimatedTime: '30-60 seconds',
      rateLimitRemaining: rateLimitResult.remaining - 1,
      // Include file data for client-side processing
      fileData: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      jobUrl: jobUrl,
      anonymizePii: anonymizePii,
      // Include polling information for status updates
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
