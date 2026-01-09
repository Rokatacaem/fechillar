const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting DB Connection Test...');
    try {
        const timeout = setTimeout(() => {
            console.error('TIMEOUT: Connection took too long (>5s). DB might be locked.');
            process.exit(1);
        }, 5000);

        const start = Date.now();
        console.log('Connecting...');
        await prisma.$connect();
        console.log(`Connected in ${Date.now() - start}ms`);

        console.log('Querying first user...');
        const user = await prisma.user.findFirst();
        console.log('Query result:', user);

        clearTimeout(timeout);
        console.log('Test PASSED.');
    } catch (e) {
        console.error('Test FAILED with error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
