const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      name: true
    }
  });
  console.log('--- Usuarios en la Base de Datos ---');
  console.table(users);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
