import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { resumeId, jobUrl } = data;
    
    // Get user data from JWT token
    const tokenData = getTokenData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the JWT token from the Authorization header for Django call
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Forward the request to Django backend for analysis processing
    const response = await fetch('http://localhost:8000/api/analysis/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        resume_id: resumeId,
        job_posting_url: jobUrl
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to analyze job posting');
    }
    
    // Extract analysis data and job details from Django response
    const { analysis, job_details } = result;
    
    if (analysis && !analysis.error && job_details) {
      try {
        // Save the analysis results to Supabase via Prisma
        const savedAnalysis = await prisma.analysis.create({
          data: {
            userId: tokenData.id,
            jobTitle: job_details.title || 'Unknown Position',
            company: job_details.company_name || 'Unknown Company',
            jobUrl: jobUrl,
            matchScore: parseInt(analysis.match_score) || 0,
            strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
            weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
            improvementTips: Array.isArray(analysis.improvement_tips) ? analysis.improvement_tips : [],
            keywordsFound: Array.isArray(analysis.keywords_found) ? analysis.keywords_found : [],
            keywordsMissing: Array.isArray(analysis.keywords_missing) ? analysis.keywords_missing : []
          }
        });
        
        console.log(`Analysis saved to Supabase with ID: ${savedAnalysis.id}`);
        
        // Return the original result plus confirmation of save
        return NextResponse.json({
          ...result,
          saved: true,
          analysisId: savedAnalysis.id
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
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
