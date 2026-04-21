
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const luis = await prisma.user.findFirst({
        where: { name: { contains: "Luis" } },
        include: {
            playerProfile: {
                include: {
                    matchHome: true,
                    matchAway: true,
                }
            }
        }
    });
    console.log(JSON.stringify(luis, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
