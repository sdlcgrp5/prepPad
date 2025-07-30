import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Get user data from JWT token
    const tokenData = getTokenData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Forward the request to Django backend for analysis processing
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('job_posting_url', jobUrl);

    // Call Django backend for analysis
    const response = await fetch('http://localhost:8000/api/analysis/', {
      method: 'POST',
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

        // Return the analysis with save confirmation
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
