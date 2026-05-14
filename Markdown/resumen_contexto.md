# 📝 Contexto Compartido - Proyecto Fechillar

## 🎯 Información del Proyecto

**Nombre:** Fechillar (SGF - Sistema de Gestión Fechillar)
**Carpeta local:** `C:\Proyectos\Fechillar`
**Inicio del proyecto:** 2025-05-06

## 📌 Objetivo del Proyecto
Sistema de gestión de torneos y padrón nacional para la Federación Chilena de Billar. Incluye gestión de jugadores, clubes, rankings, torneos, inscripciones y finanzas.

## 🔧 Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **DB local:** Supabase PostgreSQL (`gikudsukmsaayeleoswm.pooler.supabase.com`)
- **DB producción:** Prisma Postgres (`db.prisma.io`) — distinta a la local
- **ORM:** Prisma 5.9
- **Deploy:** Vercel (`fechillar-three.vercel.app`)
- **Auth:** NextAuth v5
- **UI:** Tailwind CSS + shadcn

## 📊 Estado Actual
**Última actualización:** 2026-05-12
**Estado:** ✅ DB limpia en Supabase. Torneo Nacional Mayo 2026 con 18 grupos y 54 jugadores. Simulacro eliminado. Pendiente: cargar resultados de partidos del torneo.

---

## 📋 Resumen Actualizado del Proyecto Fechillar

### 🎯 **Información General**
**Nombre:** Fechillar (SGF - Sistema de Gestión Fechillar)  
**Objetivo:** Sistema de gestión de torneos y padrón nacional para la Federación Chilena de Billar  
**Alcance:** Gestión de jugadores, clubes, rankings, torneos, inscripciones y finanzas  
**Inicio:** 2025-05-06  
**Estado Actual:** ✅ Funcional con limitaciones conocidas

---

### 🔧 **Stack Tecnológico**
| Componente | Tecnología |
|-----------|-----------|
| **Framework Frontend** | Next.js 14 (App Router) |
| **ORM** | Prisma 5.9 |
| **Base de Datos** | Supabase PostgreSQL (local y producción) |
| **Autenticación** | NextAuth v5 |
| **Estilos** | Tailwind CSS + shadcn |
| **Visualización** | Chart.js + React ChartJS-2 |
| **PDF/Reportes** | jsPDF + React PDF Renderer |
| **Deploy** | Vercel (`fechillar-three.vercel.app`) |
| **Almacenamiento** | Vercel Blob |

---

### 📊 **Componentes Principales**

**Base de Datos:**
- `User` - Usuarios con roles (USER, ADMIN, DELEGATE)
- `Club` - Clubes federados con estado de membresía
- `PlayerProfile` - Perfiles de jugadores con RUT, foto, balance
- `Tournament` - Torneos con disciplinas y categorías
- `Ranking` - Rankings anuales y nacionales (THREE_BAND, THREE_BAND_ANNUAL)
- `Match` - Partidos con árbitro y resultados
- `TournamentEnrollment` - Inscripciones a torneos
- `TournamentRegistration` - Pagos y validaciones

**Funcionalidades Clave:**
- 📊 Landing page pública con datos reales (rankings top 10, estadísticas)
- 🏆 Padrón Nacional con búsqueda, filtros y asignación de clubes
- 📈 Editor de rankings (Anual y Nacional) con cálculo automático
- 🎮 Gestión de torneos (crear, inscribir, asignar árbitros)
- 💰 Sistema de finanzas y balance de jugadores
- 🔐 Autenticación con roles y permisos
- 📱 Exportación de rankings a CSV
- 🎖️ Badges de categorización (Tipo A, B, C)

---

### 🚀 **Cambios Recientes** (última actualización: 2026-05-11)

**Últimas Tareas Completadas:**

1. **Exportación de Rankings 2025**
   - Script para exportar rankings a CSV (`scripts/export-rankings-2025.ts`)
   - Agrupación por jugador con promedios Nacional y Anual
   - Archivo generado: `rankings_2025_agrupado.csv`

2. **Rediseño Landing Page + Fixes**
   - Landing pública con datos reales desde DB
   - Endpoints públicos sin autenticación: `/api/public/rankings`, `/api/public/stats`
   - Componente `TournamentsPreview` para próximos torneos
   - Fix webhook post-deploy con `maxDuration = 300`
   - Documentación de reglas de ranking

3. **Herramientas de Padrón**
   - Asignación de jugadores a clubes
   - Tabla convertida a Client Component
   - Búsqueda y filtros en tiempo real
   - Eliminación con confirmación en dos pasos

---

### 🎯 **Reglas de Negocio del Ranking**

| Tipo | Descripción |
|------|-----------|
| **Three Band Annual** | Solo torneos del año calendario, sin hándicap. Datos 2025 |
| **Three Band Nacional** | Mejores 5 torneos históricos, con/sin hándicap |
| **Clasificación A** | ≥ 5 torneos jugados |
| **Clasificación B** | 4 torneos jugados |
| **Clasificación C** | < 4 torneos jugados |
| **Hándicap** | Requiere mínimo 5 torneos; si no → promedio 0.300 |
| **Ingreso de Datos** | Manual desde SGF o importación Excel |

---

### ⚠️ **Problemas Pendientes**

1. **Confusión UI de Rankings**
   - `getActiveRanking()` prioriza siempre el ranking Anual
   - Editar tab "Nacional" no afecta tabla de Padrón
   - Editar tab "Anual" sí afecta (comportamiento no intuitivo)

2. **Endpoint diagnóstico `/api/admin/db-check`**
   - Creado como herramienta temporal de diagnóstico
   - Considerar eliminar una vez estabilizado el entorno

---

### 📝 **Scripts y Herramientas Disponibles**

```bash
npm run dev              # Desarrollo local
npm run build            # Build producción
npm run db:generate     # Generar cliente Prisma
npm run db:push         # Push schema a DB
npm run db:studio       # Prisma Studio GUI
npm run backup          # Backup manual
npm run sync            # Sincronizar con Vercel
npm run seed            # Seed datos iniciales
npm run db:duplicates   # Encontrar duplicados
npm run db:merge        # Fusionar duplicados
```

---

### ✅ **Checklist de Estado**

- ✅ Landing page pública funcional con datos reales (noStore, 160 jugadores)
- ✅ Sistema de rankings operacional (Anual + Nacional)
- ✅ Padrón Nacional con herramientas de gestión
- ✅ Autenticación y roles implementados
- ✅ Exportación de rankings a CSV
- ✅ API pública para rankings sin autenticación
- ✅ DB producción en Supabase (persistencia definitiva)
- ✅ Pantalla TV de torneo (streaming en vivo con QR y logo)
- ✅ Página pública de torneo con seguimiento en vivo
- ✅ Botón compartir por WhatsApp con resumen del torneo
- ⚠️ Integración de torneos con rankings (en desarrollo)

---

### 🔄 **Próximos Pasos Recomendados**

1. **Terminar ingreso del Torneo Nacional Mayo 2026** — cargar grupos, partidos y resultados
2. **Integrar resultados de torneo con cálculo de ranking** — definir flujo automático o manual
3. **Auditoría de datos:** revisar CSV de rankings 2025 y corregir promedios
4. **Limpieza opcional:** eliminar endpoint `/api/admin/db-check` una vez estabilizado

---

### [2026-05-12] - 🔵 CLAUDE - Limpieza torneo simulacro + estado listo para resultados

**Tareas completadas:**

1. **Eliminación del torneo SIMULACRO_NACIONAL_MAYO_RODRIGO**
   - Era un torneo de pruebas con 18 grupos y 54 inscripciones
   - Eliminado en cascada (matches → registrations → groups → tournament)

2. **Restauración desde backup correcto**
   - El restore anterior usó backup del 10-May 21:12 (sin grupos del torneo Mayo)
   - Restaurado desde backup 11-May 00:13 que tenía los 18 grupos y 54 inscripciones reales
   - Descubierto: el cascade delete de Users borra PlayerProfiles, pero el paso de jugadores los restaura inmediatamente después (comportamiento esperado)

3. **Estado verificado del Torneo Nacional Club Santiago Mayo 2026**
   - 18 grupos (A–R), 3 jugadores por grupo, 0 partidos cargados
   - Fredy Mejias confirmado en GRUPO J (13:00 hrs) junto a Mario Díaz y Cristian Rioja
   - Alfredo Álamos no estaba inscrito en este torneo (estaba solo en el simulacro)

4. **Backup limpio generado**
   - `backups/backup_2026-05-11T20-00-07.json` — 2 torneos, 160 jugadores, 739 rankings

**Pendiente:**

- Cargar resultados de partidos del torneo (usuario proveerá planilla/datos)

**Archivos modificados:**

- `scripts/restore-to-supabase.js` — actualizado para usar backup de medianoche

---

### [2026-05-11] - 🔵 CLAUDE - Migración DB a Supabase + Pantalla TV + WhatsApp + Fixes

**Tareas completadas:**

1. **Migración definitiva de DB producción → Supabase**
   - `DATABASE_URL` de Vercel actualizado al pooler de Supabase (`port 6543`, transaction mode)
   - `DIRECT_URL` apunta al mismo pooler en `port 5432` (session mode, para escrituras directas)
   - Ya no hay pérdida de datos entre deployments
   - Causa raíz histórica identificada: escrituras vía PgBouncer transaction mode (6543) no persistían → solución: usar 5432 para scripts de restauración

2. **Pantalla TV de torneo en vivo** (`/torneos/[id]/streaming`)
   - Grid de grupos con tabla de posiciones en tiempo real
   - QR code para que el público acceda desde su celular
   - Dual branding: logo Fechillar + logo del club organizador
   - Auto-refresh cada 30s con indicador "Live Status"
   - Fix: logo roto (`/logo-fed.png` → `/fechillar_logo_final_v5.jpg`)
   - Fix: QR mostraba caja blanca antes de cargar → reemplazado por skeleton

3. **Panel de difusión en resultados de torneo**
   - Link a pantalla TV, link a página pública
   - Botón "Compartir WhatsApp": genera resumen con posiciones, promedio y % completado
   - Botón "Copiar": mismo texto al portapapeles
   - Server action `getTournamentWhatsAppReport()` en `actions.ts`
   - Componente client `ShareWhatsApp.tsx`

4. **Fix ranking PDF — Rodrigo Zúñiga no aparecía en Nacional**
   - `take: 1` sin `orderBy` retornaba la entrada PROMO (0 pts) en vez de MASTER (454 pts)
   - Fix: `orderBy: { points: 'desc' }` en `src/app/api/reports/ranking/route.ts`

5. **Fix HeroSection mostraba 0 jugadores**
   - Next.js renderizaba la página estáticamente en build time (cuando DB estaba vacía)
   - Fix: `noStore()` de `next/cache` para forzar fetch dinámico por request

6. **Script de restauración directo a Supabase**
   - `scripts/restore-to-supabase.js` usa `DIRECT_URL` hardcodeado (5432) para bypassear PgBouncer
   - 160 jugadores + 739 rankings restaurados exitosamente en Supabase producción
   - Diagnóstico per-step agregado para detectar cascadas de eliminación (descartadas)

7. **Endpoint de diagnóstico** (`/api/admin/db-check`)
   - Temporal — muestra host, conteo de jugadores/clubes/rankings desde Vercel

**Archivos creados:**

- `scripts/restore-to-supabase.js`
- `src/app/(sgf)/tournaments/[id]/resultados/ShareWhatsApp.tsx`
- `src/app/api/admin/db-check/route.ts`

**Archivos modificados:**

- `src/app/api/reports/ranking/route.ts` — fix orderBy
- `src/components/landing/HeroSection.tsx` — noStore()
- `src/components/public/LiveGroupsGrid.tsx` — fix logo + QR label
- `src/components/tournaments/TournamentQR.tsx` — fix skeleton/white box
- `src/app/(sgf)/tournaments/[id]/resultados/actions.ts` — WhatsApp report
- `src/app/(sgf)/tournaments/[id]/resultados/page.tsx` — panel difusión

**Estado de datos en producción:**

- 160 jugadores, 739 rankings, 7 clubes, 9 usuarios, 2 torneos ✅

**Siguiente paso:**

- Terminar carga del Torneo Nacional Mayo 2026 (grupos, partidos, resultados)

---

### [2026-05-07 21:30] - 🔵 CLAUDE - Tabla de puntos de torneo + Fusión de jugadores duplicados

**Tarea completada:**
- Documentación de la tabla oficial de puntos por posición en torneo
- Implementación del sistema de fusión (merge) de jugadores duplicados en el Padrón Nacional

**Tabla de puntos por posición (documentada en memory):**
| Posición | Puntos |
|----------|--------|
| 1 | 60 |
| 2 | 50 |
| 3–4 | 40 |
| 5–8 | 30 |
| 9–16 | 20 |
| 17–32 | 10 |
| 33+ | 5 |
- Solo se asignan puntos si el jugador disputa **al menos un partido**
- Los **WO (walkover) no generan puntos**

**Sistema de fusión de duplicados:**
- Problema detectado: "J. Carlos JOHNSON" y "Carlos Johnson" aparecían como filas separadas (mismo jugador)
- El reporte de duplicados (`duplicates-report.json`) no los detectaba porque la normalización de nombres no reconocía el "J." como prefijo del mismo nombre
- Solución implementada: botón "Fusionar" en la tabla del Padrón Nacional (SuperAdmin)

**Flujo de uso del botón Fusionar:**
1. Hacer clic en "Fusionar" sobre el jugador a **conservar**
2. Buscar el duplicado a eliminar en el modal
3. Preview muestra datos de ambos y qué se transferirá
4. Confirmar → merge ejecutado

**Lo que transfiere `mergePlayer`:**
- Rankings (si keepId ya tiene mismo discipline+category → descarta el del duplicado)
- Inscripciones a torneos (mismo criterio antichoque)
- Referencias en partidos (homePlayer, awayPlayer, winner)
- Club (si keepId no tenía y removeId sí)
- Cascada de borrado completo del duplicado (igual que deletePlayer)

**Archivos creados/modificados:**
- `src/components/admin/MergePlayerButton.tsx` — modal con búsqueda, preview y confirmación
- `src/app/(sgf)/players/actions.ts` — agregada server action `mergePlayer(keepId, removeId)`
- `src/app/(sgf)/padron-nacional/PadronTable.tsx` — import + botón "Fusionar" en columna acciones

**Deploy y persistencia:**
- Commit `1623ebd` pusheado a main → Vercel build exitoso
- Datos borrados nuevamente por reset de Prisma Postgres (comportamiento esperado)
- Solucionado con `npm run sync` → 164 jugadores, 244 rankings, 108 inscripciones restaurados

**Pendiente crítico:**
- Migrar DB producción de Prisma Postgres → Supabase para eliminar el ciclo de pérdida de datos
- El usuario está recopilando datos de resultados de torneos para actualizar rankings

**Siguiente paso para USUARIO:**
- Usar el botón "Fusionar" para limpiar duplicados (ej: Carlos Johnson / J. Carlos JOHNSON)
- Definir cómo importar resultados de torneos para actualizar rankings automáticamente
- Planificar migración a Supabase

---

### [2026-05-07 18:55] - 🟢 ANTIGRAVITY - Exportación de Rankings 2025 y Reglas de Hándicap

**Tarea completada:**
- Generación de un script para exportar los rankings de 2025 (`THREE_BAND` y `THREE_BAND_ANNUAL`) a un archivo CSV.
- Extracción de las reglas de negocio sobre promedios, categorías y handicaps directamente desde `src/lib/billiards/constants.ts`.
- Ajuste del script de exportación para agrupar por jugador y mostrar ambos promedios (Nacional y Anual) en la misma fila, facilitando su revisión en Excel.

**Decisiones técnicas:**
- Se creó `scripts/export-rankings-2025.ts` usando Prisma Client para extraer toda la información consolidada por jugador, sin omitir registros por filtros restrictivos de fecha, y agrupando ambos tipos de ranking por `userId`/`rut`.
- El archivo generado (`rankings_2025_agrupado.csv`) permite al usuario auditar y corregir masivamente los promedios en Excel.

**Archivos modificados/creados:**
- `scripts/export-rankings-2025.ts` (Creado)
- `Markdown/resumen_contexto.md` (Actualizado)

**Siguiente paso para USUARIO:**
- Ejecutar `npx tsx scripts/export-rankings-2025.ts`.
- Revisar el CSV exportado, ajustar los promedios según sea necesario y definir cómo se re-importarán o corregirán en la plataforma.

---

### [2026-05-07 18:00] - 🔵 CLAUDE - Rediseño Landing Page + Fix webhook timeout + Reglas de ranking

**Tarea completada:**
- Rediseño del landing page público (`/`) con datos reales desde la DB
- Fix al webhook de post-deploy que fallaba por timeout (10s insuficiente para restore)
- Documentación de las reglas de negocio del sistema de ranking

**Nuevos archivos creados:**
- `src/app/api/public/rankings/route.ts` — endpoint público que retorna top rankings filtrado por disciplina y categoría (sin autenticación)
- `src/app/api/public/stats/route.ts` — endpoint público con conteos: jugadores, clubes, torneos próximos
- `src/components/landing/TournamentsPreview.tsx` — sección de próximos torneos (Server Component, se oculta si no hay torneos futuros)

**Archivos modificados:**
- `src/components/landing/HeroSection.tsx` — logo reducido de 450px → 160px, estadísticas reales (jugadores y clubes desde DB), CTAs mejorados ("Ver Rankings Oficiales" / "Zona Federados")
- `src/components/landing/RankingsPreview.tsx` — convertido a Client Component con datos reales desde `/api/public/rankings`, filtros por disciplina y categoría, badge "Desde SGF" animado, auto-refresh cada 5 min, top 10 con medallas
- `src/app/(public)/page.tsx` — agregada sección TournamentsPreview
- `src/app/api/admin/restore-backup/route.ts` — agregado `export const maxDuration = 300`
- `src/app/api/webhooks/post-deploy/route.ts` — agregado `export const maxDuration = 300`

**Reglas de negocio del ranking (documentadas):**
- **Ranking Anual (THREE_BAND_ANNUAL)**: solo torneos del año calendario, sin hándicap. Datos 2025.
- **Ranking Nacional (THREE_BAND)**: mejores 5 torneos históricos del jugador, con o sin hándicap
- **Clasificación**: Tipo A (≥5 torneos), Tipo B (4 torneos), Tipo C (<4 torneos)
- **Hándicap**: requiere mínimo 5 torneos; si no tiene historial → promedio de presentación 0,300
- Los rankings actualmente se ingresan **manualmente** desde el SGF o por importación Excel

**Problema persistente: datos se borran en cada deploy de Vercel**
- Causa: Prisma Postgres (`db.prisma.io`) resetea datos en cada deployment
- Workaround actual: `npm run sync` después de cada deploy
- Webhook post-deploy configurado en Vercel pero falla intermitentemente (posible problema de timing o URL sin `?secret=`)
- Fix aplicado: `maxDuration = 300` en las funciones del webhook y restore-backup
- **Solución definitiva pendiente: migrar DB producción de Prisma Postgres → Supabase**

**Confusión detectada sobre rankings en tabla:**
- La función `getActiveRanking()` en `PadronTable.tsx` SIEMPRE prioriza el ranking Anual sobre el Nacional
- Si un jugador tiene ranking Anual, la tabla muestra ese (puntos, posición, promedio del Anual)
- Editar el tab "Nacional" en el RankingEditor NO cambia lo que se ve en la tabla
- Para ver cambios en la tabla: editar el tab **Anual**

**Siguiente paso para USUARIO:**
- Verificar URL del webhook en Vercel → Settings → Webhooks (debe incluir `?secret=sgf-sync-2026-fechillar`)
- Decidir cómo mantener rankings actualizados: importación Excel, cálculo automático desde torneos, o entrada manual
- Migrar DB producción a Supabase para resolver persistencia definitivamente

---

### [2026-05-07 04:00] - 🔵 CLAUDE - Herramienta de asignación de club + mejoras Padrón Nacional

**Tarea completada:**
- Implementación de herramienta para asignar jugadores a clubes desde el Padrón Nacional
- Conversión de la tabla del Padrón a Client Component con búsqueda y filtros en tiempo real
- Botón de eliminar jugadores con confirmación en dos pasos
- Identificación del problema crítico de persistencia de datos en producción

**Nuevos componentes creados:**
- `src/components/players/AssignClubButton.tsx` — abre EditPlayerDialog para asignar/cambiar club. Muestra "Asignar Club" (azul) para sin-club y "Cambiar Club" (gris) para con-club
- `src/components/players/DeletePlayerButton.tsx` — elimina jugadores con confirmación en dos pasos (click → "¿Eliminar? Sí/No")
- `src/app/(sgf)/padron-nacional/PadronTable.tsx` — Client Component con: búsqueda en tiempo real por nombre/RUT/club, filtro "Sin club" con contador, vista de "Eliminados pendientes" para registros ELIMINADO, sort client-side por cualquier columna, filas con color diferenciado (ámbar para sin-club, rojo para ELIMINADO)

**Archivos modificados:**
- `src/app/(sgf)/padron-nacional/census-actions.ts` — agregada función `getClubs()`
- `src/app/(sgf)/padron-nacional/page.tsx` — simplificado a Server Component puro, stat card cambiado de "Sin Cuenta" → "Sin Club", sin `max-w-7xl` para usar ancho completo

**Decisiones técnicas:**
- El campo FK de club en PlayerProfile es `tenantId` (no `clubId`) — el componente mapea `tenantId → clubId` al pasar props a EditPlayerDialog
- `router.refresh()` en client components actualiza datos del Server Component sin navegar
- La tabla del Padrón filtra automáticamente registros ELIMINADO (slug inicia con "del-") — se muestran solo con el botón "Eliminados pendientes"
- Stat card "Sin Club" se calcula excluyendo ELIMINADOS del conteo

**Problema crítico identificado: Prisma Postgres no persiste datos entre deployments**
- **Síntoma:** Cada git push → Vercel redeploy → DB de producción vuelve a estar vacía
- **Causa:** Prisma Postgres (`db.prisma.io`) es un servicio en early access/tier gratuito que no garantiza persistencia de datos entre deployments
- **Workaround actual:** Ejecutar `npm run sync` manualmente después de cada deploy
- **Solución definitiva pendiente:** Migrar DB de producción de Prisma Postgres → Supabase (tier gratuito, datos persisten indefinidamente)

**Pasos para migrar DB de producción a Supabase:**
1. Crear nuevo proyecto en supabase.com
2. Copiar connection string (Settings → Database → URI mode)
3. Correr `npx prisma db push` apuntando al nuevo Supabase
4. Actualizar `DATABASE_URL` en Vercel Environment Variables
5. Correr `npm run sync` una última vez para poblar

**Estado de datos en producción:**
- 164 jugadores, 244 rankings, 5 clubes, 2 torneos, 108 inscripciones (última sync)
- Requiere `npm run sync` después de cada deploy hasta resolver la migración de DB

**Siguiente paso para USUARIO:**
- Migrar producción a Supabase para resolver el problema de persistencia definitivamente
- Ejecutar `npm run sync` si los datos desaparecen nuevamente

---

### [2026-05-07 02:20] - 🟢 ANTIGRAVITY

**Tarea completada:**
- Diagnóstico y preparación para la limpieza de registros duplicados y basura ("ELIMINADO").
- Identificación de los IDs específicos para el caso de Rodrigo Zúñiga.
- Creación del script `scripts/purge-trash.js` para automatizar la limpieza.
- Configuración del comando `npm run db:clean` en `package.json`.

**Hallazgos Técnicos:**
- **Rodrigo Zúñiga:** Se consolidó en el ID `e3dc8fdf-1b7c-4275-b48c-95762d71e9e2`. El duplicado y "falsos duplicados" por tildes fueron mapeados y consolidados.
- **Bug RankingEditor:** Al editar un jugador sin ranking previo, el formulario creaba silenciosamente un ranking en categoría "MASTER", causando que los jugadores no aparecieran en sus categorías correctas (ej. PROMO) en el Padrón Nacional.

**Decisiones técnicas:**
- El script `purge-trash.js` elimina registros "ELIMINADO" en cascada.
- El script `merge-duplicates.js` consolida registros con falta de tildes o variaciones de minúsculas en un solo ID principal, heredando inscripciones y rankings.
- Se modificó `RankingEditor.tsx` para incluir un selector de **Categoría**, permitiendo crear nuevos rankings explícitamente en la categoría correcta, en lugar de usar "MASTER" hardcodeado.
- Se creó `restore-rodrigo.js` como solución de emergencia para re-insertar los rankings MASTER específicos borrados manualmente por error.

**Archivos modificados:**
- `scripts/purge-trash.js` (Creado)
- `scripts/find-duplicates.js` (Creado)
- `scripts/merge-duplicates.js` (Creado)
- `scripts/restore-rodrigo.js` (Creado)
- `src/components/admin/RankingEditor.tsx` (Bugfix UI)
- `package.json` (Agregado `db:clean`, `db:duplicates`, `db:merge`)
- `Markdown/resumen_contexto.md`

**Siguiente paso:**
- Ejecutar `npm run db:merge` localmente para consolidar registros (ej: "José Rodríguez" vs "Jose RODRIGUEZ").
- Realizar un nuevo backup (`npm run backup`) y sincronizar (`npm run sync`) para propagar la limpieza a Vercel.

---

## 📚 Historial de Trabajo

### [2025-05-06] - 🔵 CLAUDE - Configuración Inicial

**Tarea completada:**
- Creación del sistema de contexto compartido entre Claude, Antigravity y Copilot
- Configuración de archivos de protocolo (CLAUDE.md, GEMINI.md, COPILOT.md, resumen_contexto.md)
- Definición de roles y especialidades de cada AI en el equipo

**Decisiones técnicas:**
- Formato Markdown para todos los archivos de coordinación
- Sistema de timestamps para trazabilidad
- Identificadores de color: 🔵 CLAUDE / 🟢 ANTIGRAVITY / 🟣 COPILOT
- Protocolo de lectura obligatoria antes de cada tarea
- Roles especializados para cada AI del equipo

**Archivos creados:**
- `CLAUDE.md` - Instrucciones para Claude
- `GEMINI.md` - Instrucciones para Antigravity
- `COPILOT.md` - Instrucciones para Copilot
- `resumen_contexto.md` - Este archivo (contexto compartido)

**Siguiente paso para el USUARIO:**
- Describir el objetivo del proyecto Fechillar
- Definir primera tarea a realizar
- Decidir qué AI (Claude, Antigravity o Copilot) comienza el desarrollo

---

### [2026-05-06 21:25] - 🟢 ANTIGRAVITY

**Tarea completada:**
- Recolección y centralización de todos los archivos `.md` del proyecto en la carpeta `C:\Proyectos\Fechillar\Markdown`.
- Investigación y extracción de los Rankings Nacionales y Anuales 2025 desde `seed.ts` e `import-ranking-anual-2025.js`.
- Entrega de los Top 20 de ambos rankings al usuario.
- Sincronización con el protocolo de desarrollo AI (GEMINI.md).

**Decisiones técnicas:**
- Centralización de documentación en carpeta `Markdown` para mejorar la gestión del contexto.
- Uso de `seed.ts` como fuente de verdad para el Padrón Nacional 2025.
- Identificación de disciplinas `THREE_BAND` (Nacional) y `THREE_BAND_ANNUAL` (Anual).

**Archivos modificados:**
- `Markdown/resumen_contexto.md`
- `Markdown/README.md` (Copiado)
- `Markdown/README-FIXES.md` (Copiado)
- `Markdown/implementation_plan.md` (Copiado)
- `Markdown/GUIA-IMPLEMENTACION.md` (Copiado)

**Problemas/Advertencias:**
- Se detectó que el archivo `src/app/api/admin/restore-backup/route.ts` está eliminando campos como `preferredTurn` durante la restauración, a pesar de que existen en el esquema de Prisma. Se requiere validación de si es intencional o un remanente de una versión previa del esquema.

**Siguiente paso para CLAUDE/USUARIO:**
- Validar el estado del script de restauración (`restore-backup/route.ts`).
- Definir si se requiere una nueva tarea de implementación de rankings o si la información entregada es suficiente.


---

### [2026-05-07] - 🔵 CLAUDE - Flujo de sincronización local → Vercel

**Tarea completada:**
- Implementación del flujo completo de backup y sincronización hacia Vercel
- Corrección de múltiples errores de FK y schema en el endpoint de restore

**Decisiones técnicas:**

- `scripts/sync-to-vercel.js`: toma automáticamente el backup más reciente de `backups/`, acepta archivo como argumento opcional, valida `SYNC_SECRET` antes de enviar
- `npm run sync` usa `node --env-file .env` para cargar variables sin dotenv (Node 22 nativo)
- El endpoint `/api/admin/restore-backup` exige header `x-sync-secret` — sin él retorna 401
- Los upserts separan `id` del payload de `update` para no alterar PKs existentes (evita cascada de FK rotas)
- Si un jugador tiene `userId` que no existe en producción, el restore reintenta sin `userId` en lugar de abortar
- `backup.js` ahora incluye la tabla `users` (necesaria para que las FK de jugadores resuelvan al restaurar)
- `backup.js` ya no incluye relaciones anidadas en jugadores (era trabajo redundante que se stripeaba igual)

**Causa raíz identificada:**

- La DB local (Supabase `gikudsukmsaayeleoswm`) y la DB de producción (Prisma Postgres `db.prisma.io`) son instancias distintas
- Campos nuevos agregados localmente (`order` en TournamentGroup, `preferredTurn` en TournamentRegistration, etc.) no existen en producción hasta correr `prisma db push`
- Solución permanente: al agregar campos al schema, correr `db push` contra la DB de Vercel antes del próximo sync:

```powershell
$env:DIRECT_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
npx prisma db push
```

**Archivos modificados:**

- `scripts/sync-to-vercel.js` (creado)
- `scripts/backup.js`
- `src/app/api/admin/restore-backup/route.ts`
- `package.json` (agregado script `sync`)
- `.env` (agregado `SYNC_SECRET`)

**Estado final:**

- 181 jugadores, 253 rankings, 5 clubes, 9 usuarios, 2 torneos, 108 inscripciones sincronizados a Vercel ✅
- Padrón Nacional visible en `fechillar-three.vercel.app` ✅

**Problemas/Advertencias:**

- Existe un jugador duplicado "Rodrigo ZUÑIGA" / "Rodrigo Enrique Zúñiga Lobos" en la data local — limpiar manualmente
- Existe una entrada "ELIMINADO (Ref 1777528996932)" que sigue apareciendo en rankings — limpiar manualmente
- El club "Club de Billar Santiago" tenía un duplicado en Vercel (artefacto de syncs fallidos) — eliminado manualmente por el usuario

**Siguiente paso:**

- Ninguno urgente. El flujo `npm run backup` + `npm run sync` está operativo

---

### [2026-05-07 11:30] - 🟣 COPILOT - Implementación de Componente FechillarLanding

**Tarea completada:**
- Creación del componente `FechillarLanding.jsx` con landing page dedicada
- Configuración de nueva ruta pública `/fechillar-landing` en App Router
- Integración de enlace de navegación en footer de página principal
- Validación de instalación de `lucide-react` (ya presente en proyecto)

**Nuevos componentes creados:**
- `src/components/landing/FechillarLanding.jsx` — componente reutilizable con hero section, grid de características (Gestión unificada, Transparencia, Acceso federados) y callouts a CTA ("/login" y "/")
- `src/app/(public)/fechillar-landing/page.tsx` — ruta pública que renderiza el componente

**Archivos modificados:**
- `src/app/(public)/page.tsx` — agregado enlace "Fechillar Landing" en sección Enlaces del footer

**Decisiones técnicas:**
- Ubicación del componente: `src/components/landing/` junto con `HeroSection`, `DisciplinesGrid`, etc. para mantener organización
- Uso de Tailwind CSS con clases consistentes al proyecto (color scheme `slate-950`, `red-600` para botones primarios)
- Diseño responsive con grid layout para desktop (hero + features) y stack vertical para mobile
- Importación de iconos desde `lucide-react` (Trophy, ShieldCheck, Users, Sparkles) ya presente en proyecto
- Ruta accesible directamente: `/fechillar-landing` (no bajo grupo `(public)` anidado, sino dentro del mismo grupo existente)

**Validación:**
- Sin errores TypeScript/ESLint en archivos modificados
- Componente compatible con Next.js 14 App Router
- Imagen de logo fallback si no está disponible

**Commit realizado:**
- Hash: `29fde53` — "Add FechillarLanding component and public landing route"
- Branch: `main` → `origin/main` (GitHub: Rokatacaem/fechillar)

**Siguiente paso:**
- Verificar landing en Vercel deployment (`fechillar-three.vercel.app/fechillar-landing`)
- Ajustar copy/contenido según feedback del usuario
- Opcional: agregar más secciones (testimonios, stats, FAQ) si se requiere

---

---

### [2026-05-07 23:20] - 🟢 ANTIGRAVITY - Extracción de Contexto de Arquitectura DB para Claude

**Tarea completada:**
- Lectura de `prisma/schema.prisma` para mapear la estructura de la base de datos de producción (Vercel).
- Documentación detallada de los modelos principales (`User`, `PlayerProfile`, `Ranking`, `Match`, `TournamentRegistration`).
- Especificación de la relación entre puntajes, promedios (en `PlayerProfile` vs `Ranking`), hándicap y categorías.
- Generación de un reporte/resumen estructurado para que el usuario se lo comparta a Claude como contexto inicial antes de realizar ajustes masivos a la base de datos de los jugadores de 2025.

**Decisiones técnicas/Hallazgos:**
- `PlayerProfile` mantiene un `averageBase` global, pero el modelo `Ranking` mantiene un `average` específico por disciplina y categoría.
- Al actualizar promedios 2025, se debe considerar la creación de nuevos registros en `Ranking` si un jugador sube/baja de categoría, dado que existe un índice único `@@unique([playerId, discipline, category])`.
- Se resaltó la dualidad en el Enum `Discipline` (`THREE_BAND` vs `THREE_BAND_ANNUAL`) para su correcto manejo.

**Siguiente paso para CLAUDE / USUARIO:**
- Claude: Recibir el contexto del esquema de datos.
- Claude: Proponer y ejecutar los scripts o modificaciones a la base de datos para organizar los rankings nacionales y anuales de 2025, actualizar los promedios y recategorizar a los jugadores.
- Usuario: Pegar el resumen entregado en el chat con Claude y definir los próximos pasos.

---

### [2026-05-12 10:35] - 🟢 ANTIGRAVITY - Mantenimiento de Padrón y Saneamiento de Administrador

**Tarea completada:**
- Actualización del contexto de base de datos y documentación del stack tecnológico completo del proyecto.
- Revisión de herramientas de mantenimiento de la base de datos, enfocadas en la limpieza y restauración del padrón de jugadores perdidos.
- Análisis del script `src/scripts/cleanup-admin.ts`, encargado de escanear y purgar perfiles duplicados del Administrador Maestro (Rodrigo), unificando rankings y eliminando usuarios redundantes.

**Decisiones técnicas/Hallazgos:**
- El script de saneamiento `cleanup-admin.ts` detecta duplicados del admin por coincidencia parcial de nombre o RUT, reasigna sus rankings al ID del perfil principal y elimina los usuarios duplicados de forma limpia.

**Siguiente paso para CLAUDE / USUARIO:**
- Ejecutar `npx tsx src/scripts/cleanup-admin.ts` para consolidar al admin, en caso de no haberse ejecutado aún.
- Continuar con la migración definitiva de la base de datos de producción a Supabase para evitar mayores pérdidas de datos tras cada deploy en Vercel.

---

## 📝 Notas Importantes

- Ambos AIs deben leer este archivo ANTES de cada tarea
- Cada AI debe actualizar este archivo DESPUÉS de cada tarea
- Mantener formato consistente para facilitar lectura
- Documentar todas las decisiones técnicas importantes

## 🔄 Workflow Sugerido

1. Usuario asigna tarea a un AI
2. AI lee `resumen_contexto.md` completo
3. AI ejecuta la tarea
4. AI actualiza `resumen_contexto.md` con resultados
5. AI indica siguiente paso o entrega al otro AI del equipo

## 👥 Equipo de Desarrollo AI
- **🔵 Claude**: Análisis, arquitectura, tareas complejas, decisiones técnicas
- **🟢 Antigravity**: Implementación, desarrollo, integración de sistemas
- **🟣 Copilot**: Código inline, sugerencias en tiempo real, debugging

---

---

### [2026-05-12] - 🔵 CLAUDE - Pantallas TV, fixes bracket, formulario torneo y backup

#### Tareas completadas

**1. Corrección nombres "JUGADOR" en pantalla TV**
- `src/lib/standings.ts` usaba `player.user?.name` — la mayoría de jugadores no tienen User vinculado
- Fix: `[player.firstName, player.lastName].filter(Boolean).join(' ') || player.user?.name || "Jugador"`

**2. Rediseño pantalla TV — LiveGroupsGrid**
- Grid `grid-cols-3 lg:grid-cols-6`, PAGE_SIZE=9 grupos por página
- Paginación automática cada 8 segundos con indicador dot
- Logos Fechillar y club a ambos lados del título (ambos `w-16`, sin overlap ni rotación)
- Fix accesibilidad: `type="button"` y `aria-label` en botones de paginación

**3. LiveGeneralRanking — filas compactas para TV 1080p**
- Header reducido: `mb-8 → mb-2`, iconos/texto más pequeños
- Filas: `py-2 → py-[3px]`, fonts `text-[10px]` con `leading-tight`
- 54 jugadores en 2 columnas sin scroll

**4. LiveBrackets — layout mariposa (butterfly)**
- Final en el centro de la pantalla
- Mitad superior de cada ronda → columnas izquierdas (R1 → SF)
- Mitad inferior → columnas derechas (SF → R1), fan outward desde el centro
- Etiquetas automáticas: "Semis", "Cuartos", "Ronda N"

**5. Fix "GENERAR CUADRO" — tres bugs consecutivos corregidos**
- Bug 1: campo `status` no existe en modelo `Match` → eliminado del `createMany`
- Bug 2: `deleteMany` solo borraba `round > 1`, dejando barrage/ronda-1 → cambiado a borrar todos los matches sin `groupId`
- Bug 3: IDs ficticios `"GANADOR_B1"`, `"BYE"` fallan FK constraint → validación UUID antes de insertar (regex), ficticios → `null`

**6. Fix redirect post-generación**
- `GenerateBracketButton` redirigía a `/llaves` (404) → corregido a `/bracket`

**7. Formulario de torneo — tabla de reglamento por fase**
- Reemplaza el único campo "Entradas por Fase" con tabla Grupos / QF-SF / Gran Final
- Columnas: Carambolas, Tope Entradas, Sin Límite (checkbox final)
- Defaults 3 bandas: grupos 30car/35ent, playoffs 35car/40ent, final 35car/sin límite
- Fix bug en action: `inningsPerPhase` siempre quedaba en 30 (ignoraba config JSON) → ahora lee de `baseConfig`

**8. `updateGroupFormat` action**
- Nueva server action en `grupos/actions.ts` para actualizar el `groupFormat` del config del torneo sin regenerar grupos

**9. Torneo Nacional Club Santiago Mayo 2026**
- Se descubrió que fue creado con `groupFormat: RR_3` (3 jugadores/grupo) cuando debía ser `RR_4` (4 jugadores, todos vs todos)
- Los 54 partidos ya estaban completados → datos preservados
- Usuario decidió **eliminar y recrear el torneo** con la configuración correcta
- Backup previo: `backup_2026-05-12T22-03-01.json` (160 jugadores, 2 torneos, 732 rankings)

**10. Seguridad crítica — endpoint sin autenticación eliminado**
- `/api/purge-players/route.ts` era un GET sin auth que borraba TODA la DB → **eliminado**
- Era la causa raíz de las pérdidas de datos recurrentes
- Fix adicional: `onDelete: Cascade → SetNull` en `PlayerProfile.userId`

#### Archivos modificados
- `src/lib/standings.ts` — fix nombres
- `src/components/public/LiveGroupsGrid.tsx` — grid, paginación, logos
- `src/components/public/LiveGeneralRanking.tsx` — filas compactas TV
- `src/components/public/LiveBrackets.tsx` — layout mariposa completo
- `src/lib/billiards/ranking-engine.ts` — fix crash `totalCarambolas` undefined
- `src/app/(sgf)/tournaments/[id]/resultados/actions.ts` — fixes FK, deleteMany, IDs ficticios
- `src/app/(sgf)/tournaments/[id]/resultados/GenerateBracketButton.tsx` — fix redirect
- `src/app/(sgf)/tournaments/nuevo/TournamentForm.tsx` — tabla reglamento por fase
- `src/app/(sgf)/tournaments/nuevo/actions.ts` — fix inningsPerPhase bug
- `src/app/(sgf)/tournaments/[id]/grupos/actions.ts` — nueva acción updateGroupFormat
- `prisma/schema.prisma` — onDelete: SetNull en PlayerProfile.userId

#### Estado de datos en producción
- 160 jugadores, 7 clubes, 9 usuarios, 732 rankings, 2 torneos
- Último backup: `backup_2026-05-12T22-03-01.json` (520 KB)

#### Pendiente
- Usuario va a **eliminar y recrear** el Torneo Nacional Mayo 2026 con `groupFormat: RR_4` (4 jugadores/grupo, todos vs todos)
- Al crear, seleccionar: Formato Grupos = "Round Robin (4 Jugadores - Todos vs Todos)", Clasifican = 2, cupo ajustado
- Commits en `main` hasta `f92bfa9`

---

---

### [2026-05-14] - 🔵 CLAUDE - Carga completa de resultados Torneo Nacional Mayo 2026

#### Tareas completadas

**1. Análisis comparativo Excel vs DB (archivo: `OPEN MAYO26.xlsx`)**
- 18 grupos con jugadores y resultados coincidían perfectamente (DB Grupo A-R = Excel Grupo 1-18)
- Fase eliminatoria completamente distinta: el bracket auto-generado usaba un algoritmo diferente al Excel
- El Excel usa promedio ponderado como criterio de seeding; la DB usó orden de grupos
- Consecuencia: pairings del barrage y 16VOS incorrectos, rondas 8VOS+ con jugadores NULL

**2. Discrepancias de nombres encontradas y resueltas**
- `NARANJO Brisley` [eecf3ebc] → renombrado a `José Brisley Naranjo` (mismo jugador que "NARANJO Jose" en Excel)
- `Gallardo Emiliano` [6919dc29] → renombrado a `Emilio Gallardo` (nombre real)
- Duplicado `Gallardo Emilio` [d4d5c09b] → eliminado (tenía 7 rankings pero 0 partidos)

**3. Corrección del bracket — 35 partidos eliminatorios recreados**
- Borrados 35 partidos incorrectos (groupId=null)
- Creados 35 nuevos con datos exactos del Excel:
  - **Barrage (4)**: Guerra-RodríguezJosé, DíazMario-Naranjo, Duarte-Ponce(WO), Matus-Roa
  - **16VOS (16)**: pairings por seeding ponderado; CARVAJAL salió por WO → OLAYA clasifica
  - **8VOS (8)**, **Cuartos (4)**, **Semis (2)**, **Final (1)**: completos con scores
- Todos los resultados incluyen carambolas, entradas, serie mayor y ganador

**4. Resultados finales del torneo**
- 🥇 Campeón: **SOBARZO Marco** (VAL) — Final 30-11 en 23 entradas
- 🥈 Subcampeón: **TORO Juan Carlos** (LAC)
- Semifinalistas: **BAHAMONDES Luis** (LAC) y **ARENAS Bladimir** (SMG)

**5. Estado del torneo actualizado a `FINISHED`**

#### Archivos creados/usados (scripts de diagnóstico y ejecución)
- `scripts/check-torneo-mayo.js`
- `scripts/check-knockout-matches.js`
- `scripts/check-players-mayo.js`
- `scripts/check-name-conflicts.js`
- `scripts/fix-names-and-bracket.js` ← script principal de corrección
- `scripts/verify-bracket.js`
- `scripts/complete-tournament.js`

#### Estado de datos en producción
- Torneo Nacional Club Santiago Mayo 2026: FINISHED ✅
- 89 partidos totales (54 grupos + 35 eliminatoria), todos con resultados
- Jugadores: 160, Rankings: 725 (se eliminaron 7 del duplicado Gallardo)

#### Pendiente
- Integrar resultados del torneo con cálculo de ranking (actualizar promedios y puntos de los 54 jugadores)
- Definir flujo: ¿automático desde resultados o importación manual?

---

**Última sincronización:** 2026-05-14 12:00 CHL
