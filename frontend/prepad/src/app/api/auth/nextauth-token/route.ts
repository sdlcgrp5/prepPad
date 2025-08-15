import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { auth } from '../../../../../auth';

export async function POST(request: NextRequest) {
  try {
    // Verify the request comes from an authenticated NextAuth session
    const session = await auth();
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - no valid NextAuth session' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { id, email, name } = body;

    // Verify the request data matches the session data
    if (Number(session.user.id) !== id || session.user.email !== email) {
      return NextResponse.json({ error: 'Session data mismatch' }, { status: 400 });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const token = jwt.sign(
      {
        id,
        email,
        name,
      },
      secret,
      { expiresIn: '7d' }  // Token valid for 7 days
    );

    // Return the generated token
    return NextResponse.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('NextAuth token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}