import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      balance: 0,
    },
  });

  console.log('Created admin user:', admin);

  const testUserPassword = await bcrypt.hash('user123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      name: 'Test User',
      password: testUserPassword,
      role: 'USER',
      balance: 1000,
    },
  });

  console.log('Created test user:', testUser);

  const agentUserPassword = await bcrypt.hash('agent123', 10);
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@test.com' },
    update: {},
    create: {
      email: 'agent@test.com',
      name: 'Test Agent',
      password: agentUserPassword,
      role: 'AGENT',
      balance: 500,
    },
  });

  const agent = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      phone: '+201234567890',
      country: 'Egypt',
      status: 'APPROVED',
    },
  });

  console.log('Created agent user:', agentUser);
  console.log('Created agent profile:', agent);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
