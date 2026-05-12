const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Conexión DIRECTA a Supabase (puerto 5432, sin PgBouncer)
const DIRECT_URL = 'postgresql://postgres.gikudsukmsaayeleoswm:vg5pY5A%2BD2_cJzg@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

const prisma = new PrismaClient({
    datasources: { db: { url: DIRECT_URL } }
});

function stripNested(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => typeof v !== 'object' || v === null)
    );
}

async function restore() {
    const backupPath = path.join(__dirname, '..', 'backups', 'backup_2026-05-12T16-08-09.json');
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const { data } = backup;

    console.log(`Restaurando: ${data.clubs?.length} clubes, ${data.users?.length} usuarios, ${data.players?.length} jugadores, ${data.rankings?.length} rankings, ${data.tournaments?.length} torneos`);

    const countPlayers = async () => (await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "PlayerProfile"`)[0].n;

    // 1. Clubes
    for (const club of data.clubs) {
        const { id, ...fields } = stripNested(club);
        await prisma.club.upsert({
            where: { slug: fields.slug },
            update: fields,
            create: { id, ...fields },
        });
    }
    console.log('✓ Clubes restaurados | jugadores:', await countPlayers());

    // 2. Usuarios
    if (data.users) {
        for (const user of data.users) {
            const { id, ...fields } = stripNested(user);
            try {
                await prisma.user.upsert({
                    where: { email: fields.email },
                    update: fields,
                    create: { id, ...fields },
                });
            } catch (err) {
                console.error(`  Error usuario ${fields.email}: ${err.message}`);
            }
            const cnt = await countPlayers();
            if (cnt === 0) console.warn(`  ⚠️ Jugadores cayeron a 0 tras upsert usuario ${fields.email}`);
        }
        console.log('✓ Usuarios restaurados | jugadores:', await countPlayers());
    }

    // 3. Jugadores
    let playerErrors = 0;
    for (const player of data.players) {
        const { id, ...fields } = stripNested(player);
        try {
            await prisma.playerProfile.upsert({
                where: { slug: fields.slug },
                update: fields,
                create: { id, ...fields },
            });
        } catch (err) {
            if (err.message?.includes('userId') || err.message?.includes('PlayerProfile_userId_fkey')) {
                const { userId: _u, ...fieldsNoUser } = fields;
                await prisma.playerProfile.upsert({
                    where: { slug: fieldsNoUser.slug },
                    update: fieldsNoUser,
                    create: { id, ...fieldsNoUser },
                });
            } else {
                playerErrors++;
                console.error(`  Error jugador ${fields.slug}: ${err.message}`);
            }
        }
    }
    console.log(`✓ Jugadores restaurados (${playerErrors} errores) | jugadores:`, await countPlayers());

    // 4. Torneos
    if (data.tournaments?.length > 0) {
        const skipFields = [
            'registrationFee', 'adjustmentPhaseConfig', 'playoffBracketSize',
            'requiresAdjustment', 'tournamentStructure', 'prizeDistribution',
            'bankAccountName', 'bankAccountRut', 'bankName', 'bankAccountType',
            'bankAccountNumber', 'bankAccountEmail', 'groupFormat', 'maxCapacity',
            'distanceGroups', 'distancePlayoffs', 'distanceFinal',
            'finalUnlimitedInnings', 'scheduleDay1Start', 'scheduleDay2Start',
            'registrationContact', 'registrationPhone', 'registrationDeadline',
            'groupsPublishDate', 'officializationStatus',
            'hostClub', 'venueClub', 'creator', 'registrations', 'groups',
        ];
        for (const t of data.tournaments) {
            const clean = stripNested(t);
            skipFields.forEach(f => delete clean[f]);
            const { id, ...fields } = clean;
            await prisma.tournament.upsert({
                where: { id },
                update: fields,
                create: { id, ...fields },
            });
        }
        console.log('✓ Torneos restaurados | jugadores:', await countPlayers());
    }

    // 5. Grupos
    if (data.groups) {
        for (const group of data.groups) {
            const { id, ...fields } = stripNested(group);
            delete fields.order;
            await prisma.tournamentGroup.upsert({
                where: { id },
                update: fields,
                create: { id, ...fields },
            });
        }
        console.log('✓ Grupos restaurados | jugadores:', await countPlayers());
    }

    // 6. Inscripciones
    if (data.registrations) {
        for (const reg of data.registrations) {
            const { id, ...fields } = stripNested(reg);
            delete fields.turnPreference;
            delete fields.preferredTurn;
            await prisma.tournamentRegistration.upsert({
                where: { tournamentId_playerId: { tournamentId: fields.tournamentId, playerId: fields.playerId } },
                update: fields,
                create: { id, ...fields },
            });
        }
        console.log('✓ Inscripciones restauradas | jugadores:', await countPlayers());
    }

    // 7. Rankings
    if (data.rankings) {
        let rankErrors = 0;
        for (const rank of data.rankings) {
            const { id: _rankId, ...fields } = stripNested(rank);
            try {
                await prisma.ranking.upsert({
                    where: { playerId_discipline_category: { playerId: fields.playerId, discipline: fields.discipline, category: fields.category } },
                    update: fields,
                    create: fields,
                });
            } catch (err) {
                rankErrors++;
            }
        }
        console.log(`✓ Rankings restaurados (${rankErrors} errores) | jugadores:`, await countPlayers());
    }

    console.log('\n✅ Restauración completada');
}

restore()
    .catch(e => { console.error('❌ Error fatal:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
