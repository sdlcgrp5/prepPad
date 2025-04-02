import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { Profile, Skill } from '@prisma/client';

// Define a type for the profile with skills as a string array
interface ProfileWithStringSkills extends Omit<Profile, 'createdAt' | 'updatedAt'> {
  skills: string[];
}

const profileSchema = z.object({
  // Basic info
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  
  // Professional info
  jobTitle: z.string().optional().nullable(),
  company: z.string().optional().nullable(), 
  yearsOfExperience: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  
  // Education
  highestDegree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
  graduationYear: z.string().optional().nullable(),
  
  // Skills
  skills: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    // Get the JWT token from the cookies
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Decode and verify the token to get the user ID
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      return NextResponse.json({ error: 'Server error: JWT secret not configured' }, { status: 500 });
    }
    
    const decodedToken = jwt.verify(token, secret) as { id: number };
    const userId = decodedToken.id;
    
    // Parse request body
    const body = await request.json();
    const validationResult = profileSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid data', details: validationResult.error }, { status: 400 });
    }
    
    const data = validationResult.data;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create or update profile
    let profile: Profile;
    const skillsToAdd = data.skills || [];
    
    if (user.profile) {
      // Update existing profile
      profile = await prisma.profile.update({
        where: { id: user.profile.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          zipCode: data.zipCode || null,
          jobTitle: data.jobTitle || null,
          company: data.company || null,
          yearsOfExperience: data.yearsOfExperience || null,
          linkedinUrl: data.linkedinUrl || null,
          highestDegree: data.highestDegree || null,
          fieldOfStudy: data.fieldOfStudy || null,
          institution: data.institution || null,
          graduationYear: data.graduationYear || null,
        }
      });
      
      // Delete existing skills and add new ones
      await prisma.skill.deleteMany({
        where: { profileId: profile.id }
      });
      
      // Add skills if they exist
      if (skillsToAdd.length > 0) {
        await Promise.all(skillsToAdd.map(skillName => 
          prisma.skill.create({
            data: {
              name: skillName,
              profileId: profile.id
            }
          })
        ));
      }
    } else {
      // Create new profile with skills
      profile = await prisma.profile.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          zipCode: data.zipCode || null,
          jobTitle: data.jobTitle || null,
          company: data.company || null,
          yearsOfExperience: data.yearsOfExperience || null,
          linkedinUrl: data.linkedinUrl || null,
          highestDegree: data.highestDegree || null,
          fieldOfStudy: data.fieldOfStudy || null,
          institution: data.institution || null,
          graduationYear: data.graduationYear || null,
          userId: user.id,
          skills: {
            create: skillsToAdd.map(name => ({ name }))
          }
        }
      });
    }
    
    // Construct response with the profile and skills
    const profileResponse: ProfileWithStringSkills = {
      ...profile,
      skills: skillsToAdd
    };
    
    return NextResponse.json({ 
      success: true, 
      profile: profileResponse
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the JWT token from the cookies
    const token = request.cookies.get('auth_token')?.value;
    
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
    
    // Get user profile with skills
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: true }
    });
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Construct response with the profile and skills
    const profileResponse: ProfileWithStringSkills = {
      ...profile,
      skills: profile.skills.map(skill => skill.name)
    };
    
    // Return the profile data
    return NextResponse.json({ 
      success: true, 
      profile: profileResponse
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}