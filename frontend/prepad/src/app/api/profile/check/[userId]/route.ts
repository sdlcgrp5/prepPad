import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdParam } = await params;
    const userId = parseInt(userIdParam);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // Check if user has a profile
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });
    
    return NextResponse.json({ hasProfile: !!profile });
    
  } catch (error) {
    console.error('Profile check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}