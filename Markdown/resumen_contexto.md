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
**Última actualización:** 2026-05-07 04:00
**Estado:** ✅ Herramienta de asignación de club y mejoras al Padrón Nacional implementadas. Pendiente: migrar DB producción de Prisma Postgres → Supabase

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

**Última sincronización:** 2026-05-07 11:30 (Componente FechillarLanding + ruta pública implementado y subido a GitHub)
