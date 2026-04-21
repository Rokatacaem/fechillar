import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const clubs = await prisma.club.findMany({
    select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
    },
    orderBy: {
        createdAt: 'desc'
    },
    take: 5
  })
  console.log(JSON.stringify(clubs, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
