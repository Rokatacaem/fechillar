import { PrismaClient, MembershipStatus } from "@prisma/client";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

async function forceAmberStatus() {
    const email = process.argv[2];

    if (!email) {
        console.error("❌ Error: Debes proporcionar el email del jugador.");
        process.exit(1);
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { memberships: { orderBy: { validUntil: 'desc' }, take: 1 } }
        });

        if (!user) {
            console.error(`❌ Error: Usuario con email ${email} no encontrado.`);
            process.exit(1);
        }

        const amberDate = addDays(new Date(), 10);
        const lastMembership = user.memberships[0];

        if (!lastMembership) {
            console.log(`⚠️  El usuario no tiene membresía. Creando una nueva en estado ÁMBAR...`);
            await prisma.membership.create({
                data: {
                    userId: user.id,
                    amount: 15000,
                    status: MembershipStatus.PAID,
                    validUntil: amberDate,
                    validatedAt: new Date(),
                    paymentReference: "QA_AUTO_GENERATED"
                }
            });
        } else {
            console.log(`🔄 Actualizando membresía existente a estado ÁMBAR...`);
            await prisma.membership.update({
                where: { id: lastMembership.id },
                data: {
                    validUntil: amberDate,
                    status: MembershipStatus.PAID,
                    validatedAt: new Date()
                }
            });
        }

        console.log(`✅ ÉXITO: Membresía de ${user.name} configurada.`);
        console.log(`📅 Nuevo vencimiento: ${amberDate.toLocaleDateString()} (Estado ÁMBAR).`);

    } catch (error) {
        console.error("❌ Error durante la ejecución del script:", error);
    } finally {
        await prisma.$disconnect();
    }
}

forceAmberStatus();
