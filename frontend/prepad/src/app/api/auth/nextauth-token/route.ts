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

    // Try to parse request body, but make it optional
    let bodyData = {};
    try {
      const bodyText = await request.text();
      if (bodyText && bodyText.trim()) {
        bodyData = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.warn('Could not parse request body, using session data only');
    }

    // Use session data as the source of truth
    const userId = Number(session.user.id);
    const userEmail = session.user.email;
    const userName = session.user.name || session.user.email?.split('@')[0] || 'User';

    // Generate JWT token for Django backend (compatible format)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const now = Math.floor(Date.now() / 1000);
    const djangoToken = jwt.sign(
      {
        user_id: userId,  // Django expects 'user_id' not 'id'
        email: userEmail,
        name: userName,
        token_type: 'access',  // Django Simple JWT token type
        exp: now + (60 * 60),  // 1 hour expiry
        iat: now,
        jti: `${userId}_${now}_${Math.random().toString(36).substr(2, 9)}` // Unique token ID
      },
      secret
    );

    console.log(`🔐 Generated Django JWT token for user ${userId} (${userEmail})`);

    // Return the generated token
    return NextResponse.json({
      success: true,
      token: djangoToken,
      user: {
        id: userId,
        email: userEmail,
        name: userName
      }
    });

  } catch (error) {
    console.error('NextAuth token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}