const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

async function testProfileCheck() {
  try {
    console.log('🔍 Testing profile check logic...\n');

    // Test with test@example.com (user ID 1)
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: {
        profile: true
      }
    });

    console.log('👤 Test User:');
    console.log(`  - ID: ${testUser.id}`);
    console.log(`  - Email: ${testUser.email}`);
    console.log(`  - Has profile: ${testUser.profile ? 'Yes' : 'No'}`);

    if (testUser.profile) {
      console.log(`  - Profile: ${testUser.profile.firstName} ${testUser.profile.lastName}`);
    }

    // Simulate the profile check that happens during login
    console.log('\n🔍 Simulating profile check (like in AuthContext):');
    
    // Create a JWT token for this user
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET;
    const token = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email,
      },
      secret,
      { expiresIn: '7d' }
    );

    console.log(`  - Generated token: ${token.substring(0, 20)}...`);

    // Simulate the profile API call
    const profile = await prisma.profile.findFirst({
      where: { userId: testUser.id },
      include: {
        skills: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log(`  - Profile found: ${profile ? 'Yes' : 'No'}`);
    
    if (profile) {
      console.log(`  - Profile name: ${profile.firstName} ${profile.lastName}`);
      console.log(`  - Profile skills: ${profile.skills.length} skills`);
    }

    // Simulate the login redirect logic
    console.log('\n🔄 Login redirect logic:');
    console.log(`  - Profile exists: ${profile ? 'Yes' : 'No'}`);
    console.log(`  - Should redirect to: ${profile ? '/dashboard' : '/resumeupload'}`);

    // Test with a user that doesn't have a profile
    console.log('\n🔍 Testing with user without profile:');
    const userWithoutProfile = await prisma.user.findUnique({
      where: { email: 'timilehin@example.com' },
      include: {
        profile: true
      }
    });

    console.log(`  - User: ${userWithoutProfile.email}`);
    console.log(`  - Has profile: ${userWithoutProfile.profile ? 'Yes' : 'No'}`);

    const profileForUserWithoutProfile = await prisma.profile.findFirst({
      where: { userId: userWithoutProfile.id }
    });

    console.log(`  - Profile found via API: ${profileForUserWithoutProfile ? 'Yes' : 'No'}`);
    console.log(`  - Should redirect to: ${profileForUserWithoutProfile ? '/dashboard' : '/resumeupload'}`);

  } catch (error) {
    console.error('❌ Error testing profile check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileCheck(); 