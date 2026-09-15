import { createTestPrisma } from './testDatabase';

async function main() {
  const prisma = createTestPrisma();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Dedicated WebMCP test database connection verified.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
