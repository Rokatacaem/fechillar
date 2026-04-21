# Motor de Competencia - Implementación de Definiciones Tácticas

Este plan detalla la implementación de las mejoras tácticas para el Motor de Competencia de Fechillar, enfocándose en la integridad del sorteo (snapshot de hándicap), estética de transmisión (Broadcast Style) y robustez del sistema (Tipado estricto).

## User Review Required

> [!IMPORTANT]
> Los cambios en el esquema de Prisma requieren una migración de base de datos. Se recomienda realizar un respaldo previo.
> La restricción por Enum de disciplinas invalidará cualquier registro previo con texto libre que no coincida exactamente con los nuevos valores.

## Proposed Changes

### 1. Robustez del Sistema: Tipado Estricto (Prisma Schema)

#### [MODIFY] [schema.prisma](file:///c:/Proyectos/Fechillar/prisma/schema.prisma)
- Definir `enum Discipline` con valores: `THREE_BAND`, `POOL_8`, `POOL_9`, `POOL_10`.
- Cambiar el campo `discipline` en el modelo `Tournament` de `String` a `Discipline`.
- Agregar campos de snapshot a `TournamentRegistration`:
    - `registeredAverage` (Float)
    - `registeredCategory` (String)
    - `registeredRank` (Int?)

---

### 2. Integridad del Sorteo: Captura de Hándicap (Snapshot)

#### [MODIFY] [tournament-actions.ts](file:///c:/Proyectos/Fechillar/src/lib/actions/tournaments.ts) (Asumiendo que existe)
- Actualizar la lógica de inscripción para que, al momento de crear un `TournamentRegistration`, se consulte el `Ranking` actual del jugador para la disciplina del torneo y se guarden los valores en los nuevos campos de snapshot.

---

### 3. Estética y Funcionalidad: Visualización Horizontal (Broadcast Style)

#### [MODIFY] [cuadros/page.tsx](file:///c:/Proyectos/Fechillar/src/app/%28sgf%29/tournaments/%5Bid%5D/cuadros/page.tsx)
- Rediseñar la interfaz para una experiencia premium "Broadcast Style":
    - Optimización para pantallas de 21.5" (layout ultra-wide).
    - Tipografía más moderna y jerárquica.
    - Inclusión de banderas y logos de clubes con mayor prominencia.
    - Animaciones de entrada suaves para las llaves.
    - Modo "Presentación" o "Fullscreen" para streaming.

---

### 4. Automatización de Reglas por Disciplina

#### [NEW] [discipline-rules.ts](file:///c:/Proyectos/Fechillar/src/lib/discipline-rules.ts)
- Implementar una utilidad que retorne configuraciones específicas por disciplina basadas en el Enum (e.g., `shotClock: 40` para `THREE_BAND`).

## Open Questions

> [!NOTE]
> ¿Existen disciplinas adicionales que deban incluirse en el Enum inicial además de 3-Bandas y Pool 8/9/10?
> ¿Desea que el "Modo Broadcast" sea la vista por defecto o una opción conmutable para paneles de salón?

## Verification Plan

### Automated Tests
- Ejecutar `npx prisma validate` para asegurar la integridad del esquema.
- Pruebas manuales de inscripción de jugadores verificando que los datos de ranking se copien correctamente al registro.

### Manual Verification
- Visualizar el cuadro de competencia en una resolución 1080p y 4K para validar el escalado del "Broadcast Style".
- Verificar que al cambiar la disciplina del torneo se activen/desactiven los relojes de tiro correspondientes en la vista de arbitraje.
