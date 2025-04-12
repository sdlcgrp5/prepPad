import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Decode and verify the token
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      return NextResponse.json({ error: 'Server error: JWT secret not configured' }, { status: 500 });
    }
    
    const decodedToken = jwt.verify(token, secret) as { id: number };
    const userId = decodedToken.id;
    
    // Get user profile with resume
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        resumeFile: true,
        resumeFileName: true,
        resumeFileType: true,
        updatedAt: true
      }
    });
    
    if (!profile || !profile.resumeFile) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    
    // Return the resume data
    return NextResponse.json({ 
      success: true, 
      resume: {
        id: profile.id,
        fileName: profile.resumeFileName || 'resume',
        fileType: profile.resumeFileType || 'application/pdf',
        fileUrl: profile.resumeFile,
        uploadedAt: profile.updatedAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
