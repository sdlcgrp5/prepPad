import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Define validation schema for signup credentials
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    const { name, email, password } = result.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user and profile in a transaction
    const result_data = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        }
      });

      // Split name into first and last name
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create minimal profile
      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
        }
      });

      return { user, profile };
    });
    
    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const token = jwt.sign(
      {
        id: result_data.user.id,
        email: result_data.user.email,
        name: result_data.user.name,
      },
      secret,
      { expiresIn: '7d' }  // Token valid for 7 days
    );
    
    // Return success response with token
    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: result_data.user.id,
        email: result_data.user.email,
        name: result_data.user.name
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}