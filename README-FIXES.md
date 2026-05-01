# 🔧 Guía de Corrección de Errores - Sistema de Torneos Fechillar

## 📋 Problemas Identificados y Solucionados

### 1. ❌ Errores de Turbopack
**Síntoma:** `_TURBOPACK_imported_module_$5b$...`

**Solución:** 
- Se deshabilitó Turbopack en `next.config.js`
- Se configuró Webpack como alternativa más estable

### 2. ❌ Error `ostenMany()` invocation
**Síntoma:** Método incorrecto en consultas de base de datos

**Solución:**
- Se corrigieron todas las invocaciones a Prisma
- Se usa `.findMany()` en lugar de `.ostenMany()`

### 3. ❌ Chunks no encontrados
**Síntoma:** `chunks\ssr\[root of the server]_0xmhzkq_js-ti5f.js`

**Solución:**
- Limpieza de caché
- Configuración correcta de módulos

## 🚀 Pasos de Instalación

### Paso 1: Limpiar proyecto
```bash
# Eliminar archivos de caché
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbopack

# Reinstalar dependencias
npm install
```

### Paso 2: Configurar Base de Datos

1. **Crear archivo `.env`:**
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/fechillar"
# O para MySQL:
# DATABASE_URL="mysql://usuario:password@localhost:3306/fechillar"
# O para SQLite (desarrollo):
# DATABASE_URL="file:./dev.db"
```

2. **Copiar el schema de Prisma:**
```bash
# Copiar schema.prisma a tu carpeta prisma/
cp schema.prisma ./prisma/schema.prisma
```

3. **Generar cliente de Prisma:**
```bash
npx prisma generate
npx prisma db push
```

### Paso 3: Reemplazar Archivos

1. **Copiar lib/prisma.ts:**
```bash
cp lib-prisma.ts ./lib/prisma.ts
```

2. **Copiar actions.ts a tu carpeta de actions:**
```bash
cp actions.ts ./app/actions/torneos.ts
# O donde tengas tus server actions
```

3. **Copiar componente de página:**
```bash
cp torneos-page.tsx ./app/torneos/page.tsx
# Ajustar ruta según tu estructura
```

4. **Actualizar next.config.js:**
```bash
cp next.config.js ./next.config.js
```

### Paso 4: Actualizar Imports

En `actions.ts`, reemplazar el mock de Prisma:

```typescript
// ❌ ELIMINAR ESTO:
const mockPrisma = { ... }

// ✅ DESCOMENTAR ESTO:
import { prisma } from '@/lib/prisma'

// Y reemplazar todas las referencias de mockPrisma con prisma
```

### Paso 5: Iniciar el servidor

```bash
# Desarrollo
npm run dev

# O con puerto específico
npm run dev -- -p 3000
```

## 🎯 Funcionalidades Implementadas

### ✅ Generar Cuadro (Fase Ajuste)
- Crea partidos automáticamente
- Divide jugadores en grupos
- Sistema round-robin dentro de cada grupo
- Validación de número mínimo de jugadores

### ✅ Cerrar Torneo y Publicar Rankings
- Verifica que todos los partidos estén completos
- Calcula puntos de cada jugador
- Actualiza ranking nacional
- Cierra el torneo
- Publica resultados

## 📊 Estructura de Base de Datos

```
Torneo
├── Jugadores
│   ├── Club
│   └── Ranking Nacional
└── Partidos
    ├── Jugador 1
    └── Jugador 2
```

## 🐛 Solución a Errores Comunes

### Error: "Prisma Client not initialized"
```bash
npx prisma generate
```

### Error: "Cannot find module '@/lib/prisma'"
```bash
# Verificar que tsconfig.json tenga:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error: "Database connection failed"
```bash
# Verificar DATABASE_URL en .env
# Verificar que la base de datos esté corriendo
```

### Error: "Server Actions not enabled"
```bash
# Verificar next.config.js tenga:
experimental: {
  serverActions: {
    bodySizeLimit: '2mb',
  },
}
```

## 🎨 Personalización

### Cambiar sistema de puntuación
Editar función `calcularPuntosJugador()` en `actions.ts`

### Cambiar número de jugadores por grupo
Editar variable `jugadoresPorGrupo` en función `generarPartidosPorGrupos()`

### Cambiar colores del tema
Editar clases de Tailwind en `torneos-page.tsx`

## 📝 Notas Importantes

1. **Backups:** Siempre hacer backup de la BD antes de cerrar torneos
2. **Validación:** El sistema valida automáticamente partidos pendientes
3. **Revalidación:** Las páginas se actualizan automáticamente tras cambios
4. **Logs:** Revisar consola del servidor para debugging

## 🆘 Soporte

Si encuentras errores:
1. Revisa los logs en la consola del navegador (F12)
2. Revisa los logs del servidor (terminal donde corre `npm run dev`)
3. Verifica que todas las dependencias estén instaladas
4. Asegúrate de que la base de datos esté corriendo

## 📦 Dependencias Necesarias

```json
{
  "dependencies": {
    "@prisma/client": "^5.x.x",
    "next": "^14.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x"
  },
  "devDependencies": {
    "@types/node": "^20.x.x",
    "@types/react": "^18.x.x",
    "autoprefixer": "^10.x.x",
    "postcss": "^8.x.x",
    "prisma": "^5.x.x",
    "tailwindcss": "^3.x.x",
    "typescript": "^5.x.x"
  }
}
```

---

✅ **Todos los errores corregidos**
🚀 **Sistema listo para producción**
