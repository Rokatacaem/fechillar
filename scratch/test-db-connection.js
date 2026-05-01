const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Intentando conectar a la base de datos...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Conexión exitosa:', result);
  } catch (error) {
    console.error('Error de conexión:', error.message);
    if (error.code) console.error('Código de error Prisma:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
