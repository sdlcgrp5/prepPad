import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Define types for our database models
type User = {
  id: number;
  email: string;
  password: string;
  profile?: Profile;
};

type Profile = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  zipCode: string | null;
  jobTitle: string | null;
  company: string | null;
  yearsOfExperience: string | null;
  linkedinUrl: string | null;
  highestDegree: string | null;
  fieldOfStudy: string | null;
  institution: string | null;
  graduationYear: string | null;
  skills: Skill[];
  user: User;
};

type Skill = {
  id: number;
  name: string;
  profileId: number;
  profile: Profile;
};

// Define a type for the profile with skills as a string array
interface ProfileWithStringSkills {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  zipCode: string | null;
  jobTitle: string | null;
  company: string | null;
  yearsOfExperience: string | null;
  linkedinUrl: string | null;
  highestDegree: string | null;
  fieldOfStudy: string | null;
  institution: string | null;
  graduationYear: string | null;
  skills: string[];
}

const profileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  yearsOfExperience: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  highestDegree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
  graduationYear: z.string().optional().nullable(),
  skills: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    console.log('Received token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Decode and verify the token to get the user ID
    const secret = process.env.JWT_SECRET;
    console.log('JWT Secret:', secret ? 'Present' : 'Missing');
    
    if (!secret) {
      return NextResponse.json({ error: 'Server error: JWT secret not configured' }, { status: 500 });
    }
    
    try {
      const decodedToken = jwt.verify(token, secret) as { id: number };
      const userId = decodedToken.id;
      console.log('Decoded user ID:', userId);
    
      // Parse request body
      const body = await request.json();
      console.log('Received profile data:', body);
      
      const validationResult = profileSchema.safeParse(body);
      
      if (!validationResult.success) {
        console.error('Validation error:', validationResult.error);
        return NextResponse.json({ error: 'Invalid data', details: validationResult.error }, { status: 400 });
      }
      
      const data = validationResult.data;
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              skills: true
            }
          }
        }
      });
      
      if (!user) {
        console.error('User not found:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      console.log('Found user:', { id: user.id, hasProfile: !!user.profile });
      
      // Create or update profile
      let profile;
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
          },
          include: {
            skills: true
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
          },
          include: {
            skills: true
          }
        });
      }
      
      // Construct response with the profile and skills
      const profileResponse: ProfileWithStringSkills = {
        ...profile,
        skills: profile.skills.map(skill => skill.name)
      };
      
      return NextResponse.json({ 
        success: true, 
        profile: profileResponse
      });
      
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    
    // Get user profile with skills
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        skills: true
      }
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