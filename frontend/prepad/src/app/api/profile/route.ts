import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import type { Prisma } from '@prisma/client';
import { auth } from '../../../../auth';

// Define a type for the profile with skills as a string array
type ProfileWithStringSkills = Omit<
  Prisma.ProfileGetPayload<{
    include: { 
      skills: true;
      user: {
        select: {
          email: true;
        }
      }
    }
  }>,
  'skills' | 'createdAt' | 'updatedAt' | 'user'
> & {
  skills: string[];
  email: string;
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  zipCode: string | null;
  jobTitle: string | null;
  company: string | null;
  yearsOfExperience: string | null;
  linkedinUrl: string | null;
  resumeFile: string | null;
  resumeFileName: string | null;
  resumeFileType: string | null;
  highestDegree: string | null;
  fieldOfStudy: string | null;
  institution: string | null;
  graduationYear: string | null;
};

// Hybrid authentication function to handle both JWT and NextAuth sessions
async function authenticate(request: NextRequest): Promise<{ userId: number; email: string } | null> {
  try {
    // First, try JWT token authentication
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (token && token !== 'nextauth') {
      const secret = process.env.JWT_SECRET as string;
      if (!secret) {
        console.error('JWT_SECRET environment variable is not set');
        return null;
      }
      try {
        const decoded = jwt.verify(token, secret) as { id: number; email: string };
        return { userId: decoded.id, email: decoded.email };
      } catch (error) {
        console.error('JWT validation failed:', error);
      }
    }
    
    // Fallback to NextAuth session
    const session = await auth();
    console.log('NextAuth session debug:', JSON.stringify(session, null, 2));

    if (session?.user?.email) {
      // If we have an email but no user ID, we need to look up the user ID from the database
      if (session.user.id) {
        return {
          userId: Number(session.user.id),
          email: session.user.email
        };
      } else {
        // Look up user ID by email
        console.log('No user ID in session, looking up by email:', session.user.email);
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, email: true }
        });

        if (user) {
          console.log('Found user by email:', user);
          return {
            userId: user.id,
            email: user.email
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
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
    // Use hybrid authentication to support both JWT and NextAuth sessions
    const authResult = await authenticate(request);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    const { userId } = authResult;
    
    // Parse request body
    const body = await request.json();
    const validationResult = profileSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json({ error: 'Invalid data', details: validationResult.error }, { status: 400 });
      }
      
      const data = validationResult.data;
      
      // Check if user exists and update/create profile
      const user = await prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: { id: userId },
          include: {
            profile: {
              include: {
                skills: true
              }
            }
          }
        });
        
        if (!foundUser) {
          return null;
        }

        // Create or update profile
        const skillsToAdd = data.skills || [];
        
        // Define the type for profile
        let profile: Prisma.ProfileGetPayload<{ include: { skills: true } }>;
        
        if (foundUser.profile) {
          // Update existing profile
          profile = await tx.profile.update({
            where: { id: foundUser.profile.id },
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
          await tx.skill.deleteMany({
            where: { profileId: profile.id }
          });
          
          if (skillsToAdd.length > 0) {
            await Promise.all(skillsToAdd.map(skillName => 
              tx.skill.create({
                data: {
                  name: skillName,
                  profileId: profile.id
                }
              })
            ));
          }
        } else {
          // Create new profile with skills
          profile = await tx.profile.create({
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
              userId: foundUser.id,
              skills: {
                create: skillsToAdd.map(name => ({ name }))
              }
            },
            include: {
              skills: true
            }
          });
        }
        
        return { user: foundUser, profile };
      });
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Construct response with the profile and skills
      const profileResponse: ProfileWithStringSkills = {
        ...user.profile,
        skills: user.profile.skills.map(skill => skill.name),
        email: user.user.email
      };
      
      return NextResponse.json({ 
        success: true, 
        profile: profileResponse
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
      
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use hybrid authentication to support both JWT and NextAuth sessions
    const authResult = await authenticate(request);

    if (!authResult || !authResult.email) {
      console.log('Authentication failed or missing email:', authResult);
      return NextResponse.json({ error: 'Unauthorized - missing authentication or email' }, {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const { userId, email: authenticatedEmail } = authResult;
    console.log('Profile GET - Authenticated user:', { userId, authenticatedEmail });

    // Get user profile with skills - with fallback to email-based lookup
    let profile;
    if (userId) {
      // Primary lookup by userId
      profile = await prisma.profile.findFirst({
        where: { userId },
        include: {
          skills: true,
          user: {
            select: {
              email: true
            }
          }
        }
      });
    }

    // Fallback: if no profile found by userId or userId is undefined, look up by email
    if (!profile) {
      console.log('Profile GET - No profile found by userId, trying email lookup for:', authenticatedEmail);
      profile = await prisma.profile.findFirst({
        where: {
          user: {
            email: authenticatedEmail
          }
        },
        include: {
          skills: true,
          user: {
            select: {
              email: true
            }
          }
        }
      });
    }

    if (!profile) {
      console.log('Profile GET - No profile found for userId:', userId);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('Profile GET - Found profile:', {
      profileId: profile.id,
      profileUserId: profile.userId,
      profileEmail: profile.user.email,
      authenticatedEmail
    });

    // Validate that the profile email matches the authenticated user email
    if (profile.user.email !== authenticatedEmail) {
      console.error('Profile GET - Email mismatch:', {
        profileEmail: profile.user.email,
        authenticatedEmail,
        userId,
        profileUserId: profile.userId
      });
      return NextResponse.json({
        error: 'Profile data inconsistency detected. Please contact support.'
      }, { status: 409 });
    }

    // Construct response with the profile and skills
    const profileResponse: ProfileWithStringSkills = {
      ...profile,
      skills: profile.skills.map(skill => skill.name),
      email: profile.user.email
    };
    
    // Return the profile data with CORS headers
    return NextResponse.json({ 
      success: true, 
      profile: profileResponse
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use hybrid authentication to support both JWT and NextAuth sessions
    const authResult = await authenticate(request);

    if (!authResult || !authResult.email) {
      console.log('Authentication failed or missing email:', authResult);
      return NextResponse.json({ error: 'Unauthorized - missing authentication or email' }, {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const { userId, email: authenticatedEmail } = authResult;
    console.log('Profile PUT - Authenticated user:', { userId, authenticatedEmail });
    
    // Parse request body
    const body = await request.json();
    const validationResult = profileSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: validationResult.error 
      }, { status: 400 });
    }
    
    const profileData = validationResult.data;
    
    // Check if profile exists - with fallback to email-based lookup
    let existingProfile;
    if (userId) {
      // Primary lookup by userId
      existingProfile = await prisma.profile.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });
    }

    // Fallback: if no profile found by userId or userId is undefined, look up by email
    if (!existingProfile) {
      console.log('Profile PUT - No profile found by userId, trying email lookup for:', authenticatedEmail);
      existingProfile = await prisma.profile.findFirst({
        where: {
          user: {
            email: authenticatedEmail
          }
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });
    }

    if (!existingProfile) {
      console.log('Profile PUT - No profile found for userId:', userId);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Validate that the profile email matches the authenticated user email
    if (existingProfile.user.email !== authenticatedEmail) {
      console.error('Profile PUT - Email mismatch:', {
        profileEmail: existingProfile.user.email,
        authenticatedEmail,
        userId,
        profileUserId: existingProfile.userId
      });
      return NextResponse.json({
        error: 'Profile data inconsistency detected. Please contact support.'
      }, { status: 409 });
    }
    
    // Update profile in transaction
    await prisma.$transaction(async (tx) => {
      // Update profile data
      const updatedProfile = await tx.profile.update({
        where: { id: existingProfile.id },
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          zipCode: profileData.zipCode,
          jobTitle: profileData.jobTitle,
          company: profileData.company,
          yearsOfExperience: profileData.yearsOfExperience,
          linkedinUrl: profileData.linkedinUrl,
          highestDegree: profileData.highestDegree,
          fieldOfStudy: profileData.fieldOfStudy,
          institution: profileData.institution,
          graduationYear: profileData.graduationYear,
        }
      });
      
      // Delete existing skills
      await tx.skill.deleteMany({
        where: { profileId: existingProfile.id }
      });
      
      // Add new skills
      if (profileData.skills && profileData.skills.length > 0) {
        await tx.skill.createMany({
          data: profileData.skills.map(skillName => ({
            profileId: existingProfile.id,
            name: skillName
          }))
        });
      }
      
      return updatedProfile;
    });
    
    // Fetch updated profile with skills for response
    let profileWithSkills;
    if (userId) {
      profileWithSkills = await prisma.profile.findFirst({
        where: { userId },
        include: {
          skills: true,
          user: {
            select: {
              email: true
            }
          }
        }
      });
    }

    // Fallback: if no profile found by userId, look up by email
    if (!profileWithSkills) {
      profileWithSkills = await prisma.profile.findFirst({
        where: {
          user: {
            email: authenticatedEmail
          }
        },
        include: {
          skills: true,
          user: {
            select: {
              email: true
            }
          }
        }
      });
    }
    
    if (!profileWithSkills) {
      return NextResponse.json({ error: 'Failed to fetch updated profile' }, { status: 500 });
    }
    
    // Format response to match expected structure
    const profileResponse: ProfileWithStringSkills = {
      id: profileWithSkills.id,
      firstName: profileWithSkills.firstName,
      lastName: profileWithSkills.lastName,
      email: profileWithSkills.user.email,
      phone: profileWithSkills.phone,
      zipCode: profileWithSkills.zipCode,
      jobTitle: profileWithSkills.jobTitle,
      company: profileWithSkills.company,
      yearsOfExperience: profileWithSkills.yearsOfExperience,
      linkedinUrl: profileWithSkills.linkedinUrl,
      resumeFile: profileWithSkills.resumeFile,
      resumeFileName: profileWithSkills.resumeFileName,
      resumeFileType: profileWithSkills.resumeFileType,
      highestDegree: profileWithSkills.highestDegree,
      fieldOfStudy: profileWithSkills.fieldOfStudy,
      institution: profileWithSkills.institution,
      graduationYear: profileWithSkills.graduationYear,
      userId: profileWithSkills.userId,
      dataClassification: profileWithSkills.dataClassification,
      isDeleted: profileWithSkills.isDeleted,
      deletedAt: profileWithSkills.deletedAt,
      resumeUploadedAt: profileWithSkills.resumeUploadedAt,
      skills: profileWithSkills.skills.map(skill => skill.name)
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile: profileResponse
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(_request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}