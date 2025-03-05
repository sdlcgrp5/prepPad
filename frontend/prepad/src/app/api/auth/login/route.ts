import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Define validation schema for login credentials
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid credentials format' }, { status: 400 });
    }
    
    const { email, password } = result.data;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      secret,
      { expiresIn: '1d' }
    );
    
    // Return success response with token
    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}