import { PrismaClient, Discipline, Category, TournamentStatus, TournamentScope, TournamentTurn } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de Fechillar...');

  // ============================================
  // 1. LIMPIAR BASE DE DATOS (OPCIONAL - SOLO DESARROLLO)
  // ============================================
  console.log('🧹 Limpiando base de datos...');
  await prisma.match.deleteMany();
  await prisma.tournamentRegistration.deleteMany();
  await prisma.tournamentGroup.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.playerProfile.deleteMany();
  await prisma.club.deleteMany();
  await prisma.prizeTemplate.deleteMany();

  // ============================================
  // 1.1 CREAR PLANTILLAS DE PREMIOS
  // ============================================
  console.log('🏆 Creando plantillas de premios...');
  await prisma.prizeTemplate.create({
    data: {
      id: 'default-8-places',
      name: 'Estándar 8 lugares',
      isDefault: true,
      distribution: [
        { position: 1, percentage: 35, label: 'Primer Lugar' },
        { position: 2, percentage: 25, label: 'Segundo Lugar' },
        { position: 3, percentage: 12, label: 'Tercer Lugar' },
        { position: 4, percentage: 12, label: 'Cuarto Lugar' },
        { position: 5, percentage: 4, label: 'Quinto Lugar' },
        { position: 6, percentage: 4, label: 'Sexto Lugar' },
        { position: 7, percentage: 4, label: 'Séptimo Lugar' },
        { position: 8, percentage: 4, label: 'Octavo Lugar' },
      ],
    }
  });

  // ============================================
  // 2. CREAR CLUBES
  // ============================================
  console.log('🏛️ Creando clubes...');

  const clubValparaiso = await prisma.club.create({
    data: {
      slug: 'club-valparaiso',
      name: 'Club Valparaíso',
      city: 'Valparaíso',
      brandColor: '#0f2040',
      accentColor: '#10b981',
      isValidated: true
    }
  });

  const clubSanMiguel = await prisma.club.create({
    data: {
      slug: 'club-san-miguel',
      name: 'Club San Miguel',
      city: 'Santiago',
      brandColor: '#0f2040',
      accentColor: '#10b981',
      isValidated: true
    }
  });

  const clubLaCalera = await prisma.club.create({
    data: {
      slug: 'club-la-calera',
      name: 'Club La Calera',
      city: 'La Calera',
      brandColor: '#0f2040',
      accentColor: '#10b981',
      isValidated: true
    }
  });

  const clubSantiago = await prisma.club.create({
    data: {
      slug: 'club-santiago',
      name: 'Club Santiago',
      city: 'Santiago',
      address: 'Av. Libertador Bernardo O\'Higgins 2020',
      brandColor: '#0f2040',
      accentColor: '#10b981',
      isValidated: true
    }
  });

  // ============================================
  // 3. CREAR JUGADORES CON DATOS DEL RANKING
  // ============================================
  console.log('👥 Creando jugadores...');

  const players = [
    // ========================================
    // CLUB VALPARAÍSO (15 jugadores)
    // ========================================
    
    { 
      firstName: 'Marco', 
      lastName: 'Sobarzo', 
      club: clubValparaiso.id,
      pointsNational: 676,
      averageNational: 1.097,
      rankingNational: 1,
      handicap: 28,
      categoryNational: 'MASTER',
      pointsAnnual: 180,
      averageAnnual: 1.0,
      rankingAnnual: 1,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Ulises', 
      lastName: 'Salinas D.', 
      club: clubValparaiso.id,
      pointsNational: 333,
      averageNational: 0.732,
      rankingNational: 9,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 65,
      averageAnnual: 0.709,
      rankingAnnual: 11,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Carlos', 
      lastName: 'Guerra', 
      club: clubValparaiso.id,
      pointsNational: 437,
      averageNational: 0.778,
      rankingNational: 7,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 45,
      averageAnnual: 0.675,
      rankingAnnual: 18,
      categoryAnnual: 'MASTER',
      turnPreference: 'T1_T2' 
    },
    
    { 
      firstName: 'Marcelo', 
      lastName: 'Peña', 
      club: clubValparaiso.id,
      pointsNational: 424,
      averageNational: 0.781,
      rankingNational: 6,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 80,
      averageAnnual: 0.725,
      rankingAnnual: 6,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Jorge', 
      lastName: 'Castillo', 
      club: clubValparaiso.id,
      pointsNational: 518,
      averageNational: 0.728,
      rankingNational: 11,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 45,
      averageAnnual: 0.594,
      rankingAnnual: 19,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Mario', 
      lastName: 'Díaz', 
      club: clubValparaiso.id,
      pointsNational: 319,
      averageNational: 0.51,
      rankingNational: 35,
      handicap: 22,
      categoryNational: 'MASTER',
      pointsAnnual: 60,
      averageAnnual: 0.523,
      rankingAnnual: 13,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Manuel', 
      lastName: 'Pulgar', 
      club: clubValparaiso.id,
      pointsNational: 178,
      averageNational: 0.451,
      rankingNational: 38,
      handicap: 22,
      categoryNational: 'MASTER',
      pointsAnnual: 20,
      averageAnnual: 0.465,
      rankingAnnual: 31,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Cristian', 
      lastName: 'Rioja', 
      club: clubValparaiso.id,
      pointsNational: 119,
      averageNational: 0.37,
      rankingNational: 42,
      handicap: 20,
      categoryNational: 'MASTER',
      pointsAnnual: 15,
      averageAnnual: 0.25,
      rankingAnnual: 36,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Luis', 
      lastName: 'Bustos', 
      club: clubValparaiso.id,
      pointsNational: 318,
      averageNational: 0.593,
      rankingNational: 22,
      handicap: 24,
      categoryNational: 'MASTER',
      pointsAnnual: 40,
      averageAnnual: 0.489,
      rankingAnnual: 22,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Ricardo', 
      lastName: 'Ponce', 
      club: clubValparaiso.id,
      pointsNational: 379,
      averageNational: 0.62,
      rankingNational: 20,
      handicap: 24,
      categoryNational: 'MASTER',
      pointsAnnual: 40,
      averageAnnual: 0.572,
      rankingAnnual: 21,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Nelson', 
      lastName: 'Salas', 
      club: clubValparaiso.id,
      pointsNational: 110,
      averageNational: 0.312,
      rankingNational: 45,
      handicap: 20,
      categoryNational: 'MASTER',
      pointsAnnual: 20,
      averageAnnual: 0.256,
      rankingAnnual: 34,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'José', 
      lastName: 'Rodríguez', 
      club: clubValparaiso.id,
      pointsNational: 129,
      averageNational: 0.324,
      rankingNational: 44,
      handicap: 20,
      categoryNational: 'MASTER',
      pointsAnnual: 15,
      averageAnnual: 0.218,
      rankingAnnual: 38,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Javier', 
      lastName: 'Jiménez', 
      club: clubValparaiso.id,
      pointsNational: 0,
      averageNational: 0.3,
      rankingNational: 999,
      handicap: 18,
      categoryNational: 'MASTER',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
    
    { 
      firstName: 'Yoiber', 
      lastName: 'López', 
      club: clubValparaiso.id,
      pointsNational: 0,
      averageNational: 0.3,
      rankingNational: 999,
      handicap: 18,
      categoryNational: 'MASTER',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
    
    { 
      firstName: 'Marcos', 
      lastName: 'Selman', 
      club: clubValparaiso.id,
      pointsNational: 0,
      averageNational: 0.3,
      rankingNational: 999,
      handicap: 18,
      categoryNational: 'MASTER',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
  
    // ========================================
    // CLUB SAN MIGUEL (6 jugadores)
    // ========================================
    
    { 
      firstName: 'Bladimir', 
      lastName: 'Arenas', 
      club: clubSanMiguel.id,
      pointsNational: 522,
      averageNational: 0.781,
      rankingNational: 5,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 80,
      averageAnnual: 0.676,
      rankingAnnual: 7,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Carlos', 
      lastName: 'Olaya', 
      club: clubSanMiguel.id,
      pointsNational: 377,
      averageNational: 0.66,
      rankingNational: 16,
      handicap: 24,
      categoryNational: 'MASTER',
      pointsAnnual: 70,
      averageAnnual: 0.575,
      rankingAnnual: 10,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Pablo', 
      lastName: 'Chicurel', 
      club: clubSanMiguel.id,
      pointsNational: 375,
      averageNational: 0.651,
      rankingNational: 17,
      handicap: 24,
      categoryNational: 'MASTER',
      pointsAnnual: 50,
      averageAnnual: 0.652,
      rankingAnnual: 16,
      categoryAnnual: 'MASTER',
      preferredTurn: 'T1' 
    },
    
    { 
      firstName: 'Alejandro', 
      lastName: 'Riffo', 
      club: clubSanMiguel.id,
      pointsNational: 397,
      averageNational: 0.739,
      rankingNational: 90,
      handicap: 26,
      categoryNational: 'BEGINNER',
      pointsAnnual: 40,
      averageAnnual: 0.764,
      rankingAnnual: 88,
      categoryAnnual: 'BEGINNER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Jesús', 
      lastName: 'Arenas', 
      club: clubSanMiguel.id,
      pointsNational: 257,
      averageNational: 0.502,
      rankingNational: 64,
      handicap: 22,
      categoryNational: 'INTERMEDIATE',
      pointsAnnual: 15,
      averageAnnual: 0.512,
      rankingAnnual: 58,
      categoryAnnual: 'INTERMEDIATE',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Álvaro', 
      lastName: 'Serrano', 
      club: clubSanMiguel.id,
      pointsNational: 0,
      averageNational: 0.3,
      rankingNational: 999,
      handicap: 18,
      categoryNational: 'MASTER',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
  
    // ========================================
    // CLUB LA CALERA (12 jugadores)
    // ========================================
    
    { 
      firstName: 'Luis', 
      lastName: 'Bahamondes', 
      club: clubLaCalera.id,
      pointsNational: 741,
      averageNational: 1.044,
      rankingNational: 2,
      handicap: 28,
      categoryNational: 'MASTER',
      pointsAnnual: 150,
      averageAnnual: 0.896,
      rankingAnnual: 2,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Cristian', 
      lastName: 'Rubilar', 
      club: clubLaCalera.id,
      pointsNational: 471,
      averageNational: 0.721,
      rankingNational: 12,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 60,
      averageAnnual: 0.721,
      rankingAnnual: 12,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Juan Carlos', 
      lastName: 'Toro', 
      club: clubLaCalera.id,
      pointsNational: 306,
      averageNational: 0.654,
      rankingNational: 52,
      handicap: 24,
      categoryNational: 'INTERMEDIATE',
      pointsAnnual: 50,
      averageAnnual: 0.684,
      rankingAnnual: 47,
      categoryAnnual: 'INTERMEDIATE',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Rodolfo', 
      lastName: 'Silva', 
      club: clubLaCalera.id,
      pointsNational: 245,
      averageNational: 0.504,
      rankingNational: 36,
      handicap: 22,
      categoryNational: 'MASTER',
      pointsAnnual: 35,
      averageAnnual: 0.503,
      rankingAnnual: 23,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Peter', 
      lastName: 'Sarmiento', 
      club: clubLaCalera.id,
      pointsNational: 306,
      averageNational: 0.636,
      rankingNational: 18,
      handicap: 24,
      categoryNational: 'MASTER',
      pointsAnnual: 90,
      averageAnnual: 0.584,
      rankingAnnual: 5,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'José', 
      lastName: 'Salinas', 
      club: clubLaCalera.id,
      pointsNational: 92,
      averageNational: 0.293,
      rankingNational: 46,
      handicap: 20,
      categoryNational: 'MASTER',
      pointsAnnual: 15,
      averageAnnual: 0.25,
      rankingAnnual: 37,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Ariel', 
      lastName: 'Bernal', 
      club: clubLaCalera.id,
      pointsNational: 269,
      averageNational: 0.531,
      rankingNational: 29,
      handicap: 22,
      categoryNational: 'MASTER',
      pointsAnnual: 60,
      averageAnnual: 0.486,
      rankingAnnual: 14,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Mario', 
      lastName: 'Cofre', 
      club: clubLaCalera.id,
      pointsNational: 447,
      averageNational: 0.7,
      rankingNational: 14,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 50,
      averageAnnual: 0.595,
      rankingAnnual: 17,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Marco', 
      lastName: 'Duarte', 
      club: clubLaCalera.id,
      pointsNational: 402,
      averageNational: 0.73,
      rankingNational: 10,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 10,
      averageAnnual: 0.695,
      rankingAnnual: 40,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Pablo', 
      lastName: 'Plaza', 
      club: clubLaCalera.id,
      pointsNational: 57,
      averageNational: 0.302,
      rankingNational: 85,
      handicap: 20,
      categoryNational: 'INTERMEDIATE',
      pointsAnnual: 10,
      averageAnnual: 0.0,
      rankingAnnual: 71,
      categoryAnnual: 'INTERMEDIATE',
      preferredTurn: null 
    },
    
    { 
      firstName: 'José', 
      lastName: 'Naranjo', 
      club: clubLaCalera.id,
      pointsNational: 0,
      averageNational: 0.3,
      rankingNational: 999,
      handicap: 18,
      categoryNational: 'MASTER',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
    
    { 
      firstName: 'Emilio', 
      lastName: 'Gallardo', 
      club: clubLaCalera.id,
      pointsNational: 0,
      averageNational: 0.0,
      rankingNational: 146,
      handicap: 18,
      categoryNational: 'BEGINNER',
      pointsAnnual: 5,
      averageAnnual: 0.0,
      rankingAnnual: 101,
      categoryAnnual: 'BEGINNER',
      preferredTurn: null 
    },
  
    // ========================================
    // CLUB SANTIAGO (21 jugadores)
    // ========================================
    
    { 
      firstName: 'Jorge', 
      lastName: 'Díaz', 
      club: clubSantiago.id,
      pointsNational: 465,
      averageNational: 0.752,
      rankingNational: 8,
      handicap: 26,
      categoryNational: 'MASTER',
      pointsAnnual: 110,
      averageAnnual: 0.729,
      rankingAnnual: 4,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Rodrigo', 
      lastName: 'Zúñiga', 
      club: clubSantiago.id,
      pointsNational: 454,
      averageNational: 0.677,
      rankingNational: 15,
      handicap: 24,
      categoryNational: 'MASTER',
      pointsAnnual: 115,
      averageAnnual: 0.625,
      rankingAnnual: 3,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Alejandro', 
      lastName: 'Carvajal', 
      club: clubSantiago.id,
      pointsNational: 605,
      averageNational: 0.957,
      rankingNational: 3,
      handicap: 28,
      categoryNational: 'MASTER',
      pointsAnnual: 70,
      averageAnnual: 0.814,
      rankingAnnual: 9,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Camilo', 
      lastName: 'Hadad', 
      club: clubSantiago.id,
      pointsNational: 289,
      averageNational: 0.566,
      rankingNational: 23,
      handicap: 24,
      categoryNational: 'MASTER',
      pointsAnnual: 30,
      averageAnnual: 0.488,
      rankingAnnual: 27,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Silvio', 
      lastName: 'Matus', 
      club: clubSantiago.id,
      pointsNational: 421,
      averageNational: 0.682,
      rankingNational: 49,
      handicap: 24,
      categoryNational: 'INTERMEDIATE',
      pointsAnnual: 40,
      averageAnnual: 0.676,
      rankingAnnual: 48,
      categoryAnnual: 'INTERMEDIATE',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Leopoldo', 
      lastName: 'Rojas', 
      club: clubSantiago.id,
      pointsNational: 238,
      averageNational: 0.545,
      rankingNational: 58,
      handicap: 22,
      categoryNational: 'INTERMEDIATE',
      pointsAnnual: 30,
      averageAnnual: 0.511,
      rankingAnnual: 52,
      categoryAnnual: 'INTERMEDIATE',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Jorge', 
      lastName: 'Trujillo', 
      club: clubSantiago.id,
      pointsNational: 291,
      averageNational: 0.61,
      rankingNational: 21,
      handicap: 24,
      categoryNational: 'MASTER',
      pointsAnnual: 35,
      averageAnnual: 0.446,
      rankingAnnual: 24,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Rogelio', 
      lastName: 'Orozco', 
      club: clubSantiago.id,
      pointsNational: 252,
      averageNational: 0.513,
      rankingNational: 32,
      handicap: 22,
      categoryNational: 'MASTER',
      pointsAnnual: 30,
      averageAnnual: 0.5,
      rankingAnnual: 26,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Francisco', 
      lastName: 'Marshall', 
      club: clubSantiago.id,
      pointsNational: 176,
      averageNational: 0.476,
      rankingNational: 37,
      handicap: 22,
      categoryNational: 'MASTER',
      pointsAnnual: 20,
      averageAnnual: 0.409,
      rankingAnnual: 33,
      categoryAnnual: 'MASTER',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Carlos', 
      lastName: 'Sáenz', 
      club: clubSantiago.id,
      pointsNational: 185,
      averageNational: 0.521,
      rankingNational: 60,
      handicap: 22,
      categoryNational: 'INTERMEDIATE',
      pointsAnnual: 10,
      averageAnnual: 0.543,
      rankingAnnual: 66,
      categoryAnnual: 'INTERMEDIATE',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Fernando', 
      lastName: 'Ramírez', 
      club: clubSantiago.id,
      pointsNational: 124,
      averageNational: 0.38,
      rankingNational: 77,
      handicap: 20,
      categoryNational: 'INTERMEDIATE',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
    
    { 
      firstName: 'Donato', 
      lastName: 'Rodríguez', 
      club: clubSantiago.id,
      pointsNational: 41,
      averageNational: 0.325,
      rankingNational: 133,
      handicap: 20,
      categoryNational: 'BEGINNER',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
    
    { 
      firstName: 'Robinson', 
      lastName: 'Roa', 
      club: clubSantiago.id,
      pointsNational: 166,
      averageNational: 0.462,
      rankingNational: 68,
      handicap: 22,
      categoryNational: 'INTERMEDIATE',
      pointsAnnual: 15,
      averageAnnual: 0.45,
      rankingAnnual: 60,
      categoryAnnual: 'INTERMEDIATE',
      preferredTurn: null 
    },
    
    { 
      firstName: 'Alejandro', 
      lastName: 'Olguín', 
      club: clubSantiago.id,
      pointsNational: 33,
      averageNational: 0.478,
      rankingNational: 110,
      handicap: 22,
      categoryNational: 'BEGINNER',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
    
    { 
      firstName: 'Arnaldo', 
      lastName: 'Paredes', 
      club: clubSantiago.id,
      pointsNational: 0,
      averageNational: 0.3,
      rankingNational: 999,
      handicap: 18,
      categoryNational: 'MASTER',
      pointsAnnual: null,
      averageAnnual: null,
      rankingAnnual: null,
      categoryAnnual: null,
      preferredTurn: null 
    },
    
    // Resto de jugadores de Santiago...
    { firstName: 'Carlos', lastName: 'Enrique Olaya', club: clubSantiago.id, pointsNational: 0, averageNational: 0.3, rankingNational: 999, handicap: 18, categoryNational: 'MASTER', pointsAnnual: null, averageAnnual: null, rankingAnnual: null, categoryAnnual: null, preferredTurn: null },
    { firstName: 'Carlos', lastName: 'Illanes', club: clubSantiago.id, pointsNational: 0, averageNational: 0.3, rankingNational: 999, handicap: 18, categoryNational: 'MASTER', pointsAnnual: null, averageAnnual: null, rankingAnnual: null, categoryAnnual: null, preferredTurn: null },
    { firstName: 'Cristian', lastName: 'Pailacura', club: clubSantiago.id, pointsNational: 0, averageNational: 0.3, rankingNational: 999, handicap: 18, categoryNational: 'MASTER', pointsAnnual: null, averageAnnual: null, rankingAnnual: null, categoryAnnual: null, preferredTurn: null },
    { firstName: 'Marcelo', lastName: 'Zambra', club: clubSantiago.id, pointsNational: 619, averageNational: 0.814, rankingNational: 4, handicap: 26, categoryNational: 'MASTER', pointsAnnual: 70, averageAnnual: 0.837, rankingAnnual: 8, categoryAnnual: 'MASTER', preferredTurn: null },
    { firstName: 'Luis', lastName: 'Rubino', club: clubSantiago.id, pointsNational: 347, averageNational: 0.704, rankingNational: 13, handicap: 26, categoryNational: 'MASTER', pointsAnnual: 40, averageAnnual: 0.627, rankingAnnual: 20, categoryAnnual: 'MASTER', preferredTurn: null },
    { firstName: 'Carlos', lastName: 'Johnson', club: clubSantiago.id, pointsNational: 208, averageNational: 0.505, rankingNational: 62, handicap: 22, categoryNational: 'INTERMEDIATE', pointsAnnual: 35, averageAnnual: 0.504, rankingAnnual: 49, categoryAnnual: 'INTERMEDIATE', preferredTurn: null }
  ];

  const createdPlayers = [];
  for (const p of players) {
    const player = await prisma.playerProfile.create({
      data: {
        slug: `${p.firstName.toLowerCase()}-${p.lastName.toLowerCase().replace(/\s+/g, '-')}`,
        publicSlug: `${p.firstName.toLowerCase()}-${p.lastName.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(7)}`,
        firstName: p.firstName,
        lastName: p.lastName,
        tenantId: p.club,
        averageBase: p.averageNational, // Usar el nacional como base
        rankings: {
          create: [
            // Ranking Nacional (con handicap)
            {
              discipline: Discipline.THREE_BAND,
              category: (p.categoryNational || 'MASTER') as Category,
              points: p.pointsNational || 0,
              average: p.averageNational || 0,
              rankPosition: p.rankingNational || 999,
              handicapTarget: p.handicap || 15
            },
            // Ranking Anual (sin handicap)
            ...(p.pointsAnnual !== null ? [{
              discipline: Discipline.THREE_BAND_ANNUAL,
              category: (p.categoryAnnual || 'MASTER') as Category,
              points: p.pointsAnnual,
              average: p.averageAnnual || 0,
              rankPosition: p.rankingAnnual || 999,
              handicapTarget: null
            }] : [])
          ]
        }
      }
    });
    createdPlayers.push(player);
  }

  console.log(`✅ ${createdPlayers.length} jugadores creados`);

  // ============================================
  // 4. CREAR TORNEO NACIONAL CLUB SANTIAGO
  // ============================================
  console.log('🏆 Creando torneo...');

  const tournament = await prisma.tournament.create({
    data: {
      name: 'Torneo Nacional Club Santiago Mayo 2026',
      description: 'Torneo Nacional sin Handicap - 54 jugadores en 18 grupos de 3',
      startDate: new Date('2026-05-02T09:00:00'),
      endDate: new Date('2026-05-02T23:00:00'),
      discipline: 'THREE_BAND',
      category: 'MASTER',
      status: 'DRAFT',
      scope: 'NATIONAL',
      venue: 'Club de Billar Santiago',
      location: 'Santiago, Chile',
      venueClubId: clubSantiago.id,
      tenantId: clubSantiago.id,
      maxTables: 6,
      playersPerTable: 2,
      hasTimeLimit: false,
      config: {
        playerCount: 54,
        groupCount: 18,
        playersPerGroup: 3,
        advancingPerGroup: 2,
        directToPlayoffs: 16,
        adjustmentPhase: true,
        targetCaroms: 25,
        inningLimit: 35,
        finalCaroms: 30,
        finalInningLimit: null, // Sin límite en final
        tables: 6,
        turns: 3,
        turnDuration: 3.5,
        modality: 'NO_HANDICAP'
      }
    }
  });

  // ============================================
  // 5. INSCRIBIR JUGADORES AL TORNEO
  // ============================================
  console.log('📝 Inscribiendo jugadores al torneo...');

  // Obtener jugadores con rankings para ordenar
  const playersWithRankings = await prisma.playerProfile.findMany({
    where: {
      id: { in: createdPlayers.map(p => p.id) }
    },
    include: {
      rankings: {
        where: { discipline: 'THREE_BAND' }
      }
    }
  });

  // Ordenar jugadores por puntos para siembra
  const sortedPlayers = playersWithRankings.sort((a, b) => {
    const aRanking = a.rankings?.[0];
    const bRanking = b.rankings?.[0];
    if (!aRanking) return 1;
    if (!bRanking) return -1;
    return (bRanking.points || 0) - (aRanking.points || 0);
  });

  for (const player of sortedPlayers) {
    const ranking = await prisma.ranking.findFirst({
      where: {
        playerId: player.id,
        discipline: 'THREE_BAND'
      }
    });

    const playerData = players.find(p => 
      p.firstName === player.firstName && p.lastName === player.lastName
    );

    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        playerId: player.id,
        status: 'APPROVED',
        paymentStatus: 'PAID',
        paid: true,
        registeredPoints: ranking?.points || 0,
        registeredAverage: ranking?.average || 0,
        registeredRank: ranking?.rankPosition || 999,
        registeredCategory: 'MASTER',
        isWaitingList: false,
        preferredTurn: (playerData?.preferredTurn as TournamentTurn) || null
      }
    });
  }

  console.log('✅ 54 jugadores inscritos');

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n🎉 SEED COMPLETADO EXITOSAMENTE\n');
  console.log('📊 Resumen:');
  console.log(`   • 4 Clubes creados`);
  console.log(`   • 54 Jugadores creados`);
  console.log(`   • 1 Torneo configurado`);
  console.log(`   • 54 Inscripciones aprobadas`);
  console.log('\n🚀 Próximos pasos:');
  console.log('   1. Ejecutar: npm run dev');
  console.log('   2. Ir a: http://localhost:3000/tournaments');
  console.log('   3. Abrir el torneo y usar "Generar Grupos"');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
