import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHybridAuthData } from '@/utils/auth';
import { checkRateLimit, incrementRateLimit } from '@/utils/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { jobId, results, action } = data;
    
    // Get user data from either JWT token or NextAuth session
    const tokenData = await getHybridAuthData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle different actions
    if (action === 'complete' && jobId && results) {
      // This is a completion request from client-side Django processing
      try {
        // Update job status to completed
        await prisma.analysisJob.update({
          where: { 
            id: jobId,
            userId: tokenData.id, // Ensure user can only update their own jobs
          },
          data: {
            status: 'completed',
            progress: 100,
            completedAt: new Date(),
            currentStep: 'Analysis complete',
            completedSteps: 3,
            result: results,
          },
        });

        // Extract analysis data and job details from results
        const { analysis, job_details } = results;
        
        if (analysis && !analysis.error && job_details) {
          // Save the analysis results to database
          const savedAnalysis = await prisma.analysis.create({
            data: {
              userId: tokenData.id,
              jobId: jobId,
              jobTitle: job_details.title || 'Unknown Position',
              company: job_details.company_name || 'Unknown Company',
              jobUrl: job_details.url || 'Unknown URL',
              matchScore: parseInt(analysis.match_score) || 0,
              strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
              weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
              improvementTips: Array.isArray(analysis.improvement_tips) ? analysis.improvement_tips : [],
              keywordsFound: Array.isArray(analysis.keywords_found) ? analysis.keywords_found : [],
              keywordsMissing: Array.isArray(analysis.keywords_missing) ? analysis.keywords_missing : [],
              wasAnonymized: results.privacy_protected || false,
            }
          });
          
          console.log(`✅ Analysis saved to database with ID: ${savedAnalysis.id} for job: ${jobId}`);
          
          return NextResponse.json({
            success: true,
            jobId: jobId,
            analysisId: savedAnalysis.id,
            message: 'Analysis results saved successfully'
          });
        } else {
          console.warn('⚠️  Invalid analysis data received for job:', jobId);
          return NextResponse.json({
            success: false,
            error: 'Invalid analysis data'
          }, { status: 400 });
        }
        
      } catch (error) {
        console.error('❌ Error saving analysis results:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to save analysis results'
        }, { status: 500 });
      }
    }

    // Legacy support or other actions
    return NextResponse.json({
      error: 'Invalid request - missing required parameters'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
