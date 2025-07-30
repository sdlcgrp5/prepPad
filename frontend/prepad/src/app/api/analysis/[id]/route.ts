import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/utils/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user data from JWT token
    const tokenData = getTokenData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: analysisIdStr } = await params;
    const analysisId = parseInt(analysisIdStr);

    if (isNaN(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    // Fetch analysis from Supabase via Prisma with user authorization
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId: tokenData.id // Ensure user can only access their own analyses
      }
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Format response to match expected structure
    return NextResponse.json({
      id: analysis.id,
      company: analysis.company,
      role: analysis.jobTitle,
      uploadedAt: analysis.createdAt.toISOString(),
      score: analysis.matchScore,
      source: analysis.jobUrl,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      improvementTips: analysis.improvementTips,
      keywordsFound: analysis.keywordsFound,
      keywordsMissing: analysis.keywordsMissing
    });

  } catch (error) {
    console.error('Error fetching analysis details:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user data from JWT token
    const tokenData = getTokenData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: analysisIdStr } = await params;
    const analysisId = parseInt(analysisIdStr);

    if (isNaN(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    // First check if the analysis exists and belongs to the user
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId: tokenData.id
      }
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Delete the analysis from Supabase via Prisma
    await prisma.analysis.delete({
      where: {
        id: analysisId
      }
    });

    return NextResponse.json({ 
      message: 'Analysis deleted successfully',
      deletedId: analysisId 
    });

  } catch (error) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}