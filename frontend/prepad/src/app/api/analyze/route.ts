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

    if (!file || !jobUrl) {
      return NextResponse.json(
        { error: 'Resume file and job URL are required' },
        { status: 400 }
      );
    }

    // Generate JWT token for Django backend authentication
    let backendJwtToken: string | null = null;
    try {
      const secret = process.env.JWT_SECRET as string;
      if (secret) {
        // Create Django Simple JWT compatible token
        const now = Math.floor(Date.now() / 1000);
        backendJwtToken = jwt.sign(
          { 
            user_id: tokenData.id,  // Django expects 'user_id' not 'id'
            email: tokenData.email,
            token_type: 'access',  // Django Simple JWT token type
            exp: now + (60 * 60),  // 1 hour expiry
            iat: now,  // Issued at time
            jti: `${tokenData.id}_${now}_${Math.random().toString(36).substr(2, 9)}` // Unique token ID
          }, 
          secret
        );
        console.log('Generated JWT token for Django backend authentication');
      } else {
        console.log('No JWT_SECRET available, cannot generate backend token');
      }
    } catch (error) {
      console.log('Failed to generate JWT token:', error);
    }

    // Forward the request to Django backend for analysis processing
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('job_posting_url', jobUrl);

    // Prepare headers with proper JWT authentication
    const headers: Record<string, string> = {};
    if (backendJwtToken) {
      headers['Authorization'] = `Bearer ${backendJwtToken}`;
      console.log('Sending request with generated JWT token');
    } else {
      console.log('Sending request without authentication (no JWT token available)');
    }

    // Call Django backend for analysis
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/analysis/`, {
      method: 'POST',
      headers,
      body: backendFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.detail || 'Failed to analyze');
    }

    // Save analysis results to Supabase if successful
    if (result.analysis && result.job_details && !result.analysis.error) {
      try {
        const savedAnalysis = await prisma.analysis.create({
          data: {
            userId: tokenData.id,
            jobTitle: result.job_details.title || 'Unknown Position',
            company: result.job_details.company_name || 'Unknown Company',
            jobUrl: jobUrl,
            matchScore: parseInt(result.analysis.match_score) || 0,
            strengths: Array.isArray(result.analysis.strengths) ? result.analysis.strengths : [],
            weaknesses: Array.isArray(result.analysis.weaknesses) ? result.analysis.weaknesses : [],
            improvementTips: Array.isArray(result.analysis.improvement_tips) ? result.analysis.improvement_tips : [],
            keywordsFound: Array.isArray(result.analysis.keywords_found) ? result.analysis.keywords_found : [],
            keywordsMissing: Array.isArray(result.analysis.keywords_missing) ? result.analysis.keywords_missing : []
          }
        });

        console.log(`Analysis saved to Supabase with ID: ${savedAnalysis.id} for user: ${tokenData.id}`);

        // Increment rate limit counter after successful analysis
        await incrementRateLimit(request, tokenData.id);

        // Return the analysis with save confirmation
        return NextResponse.json({
          ...result,
          saved: true,
          analysisId: savedAnalysis.id,
          rateLimitRemaining: rateLimitResult.remaining - 1
        });

      } catch (saveError) {
        console.error('Error saving analysis to Supabase:', saveError);
        // Still return the analysis even if save fails
        return NextResponse.json({
          ...result,
          saved: false,
          saveError: 'Failed to save analysis history'
        });
      }
    }

    // Return the analysis results (even if no save was attempted)
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
