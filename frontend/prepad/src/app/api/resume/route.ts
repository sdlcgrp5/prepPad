import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
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

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Forward to Django backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch('http://localhost:8000/api/resume-upload/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: backendFormData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.detail || 'Resume parsing failed');
    }

    // Update profile with resume data
    await prisma.profile.update({
      where: { userId },
      data: {
        resumeFile: result.file,
        resumeFileName: file.name,
        resumeFileType: file.type,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Resume parsing failed' },
      { status: 500 }
    );
  }
}

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
