const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVaibhav() {
  const users = await prisma.user.findMany({
    where: { username: { contains: 'vaibhav', mode: 'insensitive' } },
    include: {
      company: true,
      devices: { include: { license: true } },
      licenses: true,
      screenshots: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  });
  console.log('--- VAIBHAV USER & DEVICES & LICENSES ---');
  console.log(JSON.stringify(users, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  const allScreenshots = await prisma.screenshot.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  console.log('--- LATEST 10 SCREENSHOTS IN DB ---');
  console.log(JSON.stringify(allScreenshots, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  await prisma.$disconnect();
}

checkVaibhav();
