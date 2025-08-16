import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHybridAuthData } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Get user data from either JWT token or NextAuth session
    const tokenData = await getHybridAuthData(request);
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { analysisIds } = body;

    // Validate input
    if (!Array.isArray(analysisIds) || analysisIds.length === 0) {
      return NextResponse.json({ 
        error: 'analysisIds must be a non-empty array' 
      }, { status: 400 });
    }

    // Convert to numbers and validate
    const numericIds = analysisIds.map(id => {
      const numId = parseInt(id);
      if (isNaN(numId)) {
        throw new Error(`Invalid analysis ID: ${id}`);
      }
      return numId;
    });

    // First check if all analyses exist and belong to the user
    const existingAnalyses = await prisma.analysis.findMany({
      where: {
        id: { in: numericIds },
        userId: tokenData.id
      },
      select: { id: true }
    });

    if (existingAnalyses.length !== numericIds.length) {
      const foundIds = existingAnalyses.map(a => a.id);
      const missingIds = numericIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json({ 
        error: `Some analyses not found or access denied: ${missingIds.join(', ')}` 
      }, { status: 404 });
    }

    // Delete all analyses in a transaction
    const deletedAnalyses = await prisma.analysis.deleteMany({
      where: {
        id: { in: numericIds },
        userId: tokenData.id // Extra safety check
      }
    });

    return NextResponse.json({ 
      message: `Successfully deleted ${deletedAnalyses.count} analyses`,
      deletedCount: deletedAnalyses.count,
      deletedIds: numericIds
    });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}