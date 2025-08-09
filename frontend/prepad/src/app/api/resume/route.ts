import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Try to get NextAuth session first
    const session = await auth();
    
    // Also check for JWT token in Authorization header
    const authHeader = request.headers.get('Authorization');
    const jwtToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let userId: number | null = null;
    
    // Try NextAuth session first
    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true }
        });
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        console.log('NextAuth user lookup failed, trying JWT...');
      }
    }
    
    // If NextAuth failed, try JWT token
    if (!userId && jwtToken) {
      try {
        const secret = process.env.JWT_SECRET as string;
        if (!secret) {
          console.error('JWT_SECRET environment variable is not set');
          return NextResponse.json({ error: 'Server error: JWT secret not configured' }, { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          });
        }
        
        const decodedToken = jwt.verify(jwtToken, secret) as { id: number };
        userId = decodedToken.id;
      } catch (error) {
        console.log('JWT verification failed:', error);
      }
    }
    
    // If neither authentication method worked, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - No valid session or token found' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const anonymizePii = formData.get('anonymize_pii') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward to Django backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/resume-upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken || 'session-auth'}` // Send JWT if available, or session indicator
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

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

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
    // Try to get NextAuth session first
    const session = await auth();
    
    // Also check for JWT token in Authorization header
    const authHeader = request.headers.get('Authorization');
    const jwtToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let userId: number | null = null;
    
    // Try NextAuth session first
    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true }
        });
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        console.log('NextAuth user lookup failed, trying JWT...');
      }
    }
    
    // If NextAuth failed, try JWT token
    if (!userId && jwtToken) {
      try {
        const secret = process.env.JWT_SECRET as string;
        if (!secret) {
          console.error('JWT_SECRET environment variable is not set');
          return NextResponse.json({ error: 'Server error: JWT secret not configured' }, { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          });
        }
        
        const decodedToken = jwt.verify(jwtToken, secret) as { id: number };
        userId = decodedToken.id;
      } catch (error) {
        console.log('JWT verification failed:', error);
      }
    }
    
    // If neither authentication method worked, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - No valid session or token found' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

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
      file: profile.resumeFile,
      fileName: profile.resumeFileName,
      fileType: profile.resumeFileType,
      updatedAt: profile.updatedAt
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Error in GET /api/resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
