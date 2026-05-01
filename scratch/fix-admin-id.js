const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '6c3a3a52-c0a7-454e-bc62-088209b04052';
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  console.log('User with ID 6c3a3a52... found:', user ? 'YES' : 'NO');
  
  if (!user) {
    console.log('Attempting to fix user ID for admin@fechillar.cl...');
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@fechillar.cl' }
    });
    
    if (admin) {
        console.log('Admin found with ID:', admin.id, '. Updating to match session ID...');
        // We can't update ID easily in Prisma if it's referenced, but we can try to create a new one or update the existing one if no references exist.
        // Or just upsert.
        await prisma.user.upsert({
            where: { id: userId },
            update: { email: 'admin@fechillar.cl', role: 'SUPERADMIN' },
            create: {
                id: userId,
                email: 'admin@fechillar.cl',
                name: 'Rodrigo Zúñiga (Admin)',
                role: 'SUPERADMIN',
                passwordHash: 'admin123'
            }
        });
        console.log('User created/updated with correct ID.');
    } else {
        console.log('Admin not found in DB. Creating...');
        await prisma.user.create({
            data: {
                id: userId,
                email: 'admin@fechillar.cl',
                name: 'Rodrigo Zúñiga (Admin)',
                role: 'SUPERADMIN',
                passwordHash: 'admin123'
            }
        });
        console.log('User created.');
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
