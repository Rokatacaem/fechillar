const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

prisma.tournament.update({
    where: { id: '1fa8fea1-4960-4eba-bf71-49fb8539e17d' },
    data: { status: 'FINISHED' }
})
.then(t => { console.log('Status actualizado:', t.status); prisma.$disconnect(); })
.catch(e => { console.error(e); prisma.$disconnect(); });
