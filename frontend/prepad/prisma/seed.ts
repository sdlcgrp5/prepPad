// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  if (!existingUser) {
    // Hash the password
    const hashedPassword123 = await bcrypt.hash('password123', 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword123,
      },
    });

    console.log(`Created test user with id: ${user.id}`);
  } else {
    console.log('Test user already exists, skipping creation');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });