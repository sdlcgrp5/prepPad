import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHybridAuthData } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    // Get user data from either JWT token or NextAuth session
    const tokenData = await getHybridAuthData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch analysis history from Supabase via Prisma
    const analyses = await prisma.analysis.findMany({
      where: { 
        userId: tokenData.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    });

    // Format the response to match the expected frontend structure
    const analysesData = analyses.map(analysis => ({
      id: analysis.id,
      company: analysis.company,
      role: analysis.jobTitle,
      uploadedAt: analysis.createdAt.toISOString(),
      score: analysis.matchScore,
      source: analysis.jobUrl,
      matchDetails: {
        matchedSkills: analysis.keywordsFound,
        missingSkills: analysis.keywordsMissing,
        analysis: `Match score: ${analysis.matchScore}%`
      },
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      improvementTips: analysis.improvementTips
    }));

    return NextResponse.json({
      analyses: analysesData,
      total: analysesData.length
    });

  } catch (error) {
    console.error('Error fetching analysis history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}