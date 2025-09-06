import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user for E2E tests
  const testPassword = await hash('correctpassword', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: testPassword,
      name: 'Test User',
      emailVerified: true,
      provider: 'local',
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create demo user
  const demoPassword = await hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@profolio.app' },
    update: {},
    create: {
      email: 'demo@profolio.app',
      password: demoPassword,
      name: 'Demo User',
      emailVerified: true,
      provider: 'local',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  console.log('✅ Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });