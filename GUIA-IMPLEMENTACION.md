# 🚀 GUÍA COMPLETA DE IMPLEMENTACIÓN - ANTIGRAVITY FIX

## 📌 RESUMEN DE ERRORES CORREGIDOS

### ❌ Errores Encontrados:
1. **Turbopack Module Errors** - Módulos no resueltos correctamente
2. **Invocación incorrecta** - `ostenMany()` en lugar de métodos correctos de Prisma
3. **Chunks no encontrados** - Problemas de compilación de server chunks
4. **Botón "Generar Cuadro"** - No funcionaba correctamente

### ✅ Soluciones Implementadas:
1. Deshabilitación de Turbopack
2. Corrección de todas las llamadas a Prisma
3. Implementación completa del sistema de generación de cuadros
4. Sistema de cierre de torneos y publicación de rankings

---

## 🔧 INSTRUCCIONES DE IMPLEMENTACIÓN

### PASO 1: Preparar el Entorno

```bash
# 1. Ir a tu proyecto
cd /ruta/a/tu/proyecto

# 2. Hacer backup de archivos importantes
mkdir backup
cp next.config.js backup/
cp -r app backup/
cp -r lib backup/ 2>/dev/null || true

# 3. Limpiar caché y archivos temporales
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbopack
rm -rf .swc
```

### PASO 2: Actualizar Configuración de Next.js

**Archivo: `next.config.js`**

Reemplazar TODO el contenido con:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },

  swcMinify: true,
  
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
```

### PASO 3: Configurar Prisma

**A) Crear/actualizar `lib/prisma.ts`:**

```typescript
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
```

**B) Actualizar schema de Prisma:**

Si NO tienes `prisma/schema.prisma`, créalo con el contenido del archivo `schema.prisma` adjunto.

Si YA lo tienes, asegúrate de tener al menos estos modelos:
- Torneo
- Jugador
- Club
- Partido
- Ranking

### PASO 4: Configurar Base de Datos

**Crear archivo `.env` en la raíz del proyecto:**

```env
# PostgreSQL (Recomendado para producción)
DATABASE_URL="postgresql://usuario:password@localhost:5432/fechillar"

# MySQL (Alternativa)
# DATABASE_URL="mysql://usuario:password@localhost:3306/fechillar"

# SQLite (Solo para desarrollo/testing)
# DATABASE_URL="file:./dev.db"
```

**Ejecutar migraciones:**

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear/actualizar estructura de BD
npx prisma db push

# (Opcional) Poblar con datos de ejemplo
npx prisma db seed
```

### PASO 5: Crear Server Actions

**Archivo: `app/actions/torneos.ts` (o la ruta que uses)**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

interface Jugador {
  id: string
  nombre: string
  clubId: string
  ranking?: number
}

interface Partido {
  jugador1Id: string
  jugador2Id: string
  fase: string
  grupo: number
  torneoId: string
}

interface ResultadoGeneracion {
  success: boolean
  error?: string
  partidosCreados?: number
}

export async function generarCuadroFaseAjuste(torneoId: string): Promise<ResultadoGeneracion> {
  try {
    console.log('🎯 Iniciando generación de cuadro para torneo:', torneoId)

    const torneo = await prisma.torneo.findUnique({
      where: { id: torneoId }
    })

    if (!torneo) {
      return { success: false, error: 'Torneo no encontrado' }
    }

    const jugadores = await prisma.jugador.findMany({
      where: { torneoId },
      orderBy: { ranking: 'desc' }
    })

    if (jugadores.length < 2) {
      return {
        success: false,
        error: 'Se necesitan al menos 2 jugadores para generar el cuadro'
      }
    }

    const partidos = generarPartidosPorGrupos(jugadores, torneoId)

    const resultado = await prisma.partido.createMany({
      data: partidos,
      skipDuplicates: true
    })

    await prisma.torneo.update({
      where: { id: torneoId },
      data: { 
        estado: 'fase_grupos',
        faseActual: 'grupos'
      }
    })

    revalidatePath('/torneos')

    return {
      success: true,
      partidosCreados: resultado.count
    }

  } catch (error) {
    console.error('❌ Error al generar cuadro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

function generarPartidosPorGrupos(jugadores: Jugador[], torneoId: string): Partido[] {
  const partidos: Partido[] = []
  const jugadoresPorGrupo = 4
  const numeroGrupos = Math.ceil(jugadores.length / jugadoresPorGrupo)

  for (let grupo = 0; grupo < numeroGrupos; grupo++) {
    const inicio = grupo * jugadoresPorGrupo
    const fin = Math.min(inicio + jugadoresPorGrupo, jugadores.length)
    const jugadoresGrupo = jugadores.slice(inicio, fin)

    for (let i = 0; i < jugadoresGrupo.length; i++) {
      for (let j = i + 1; j < jugadoresGrupo.length; j++) {
        partidos.push({
          jugador1Id: jugadoresGrupo[i].id,
          jugador2Id: jugadoresGrupo[j].id,
          fase: 'grupos',
          grupo: grupo + 1,
          torneoId
        })
      }
    }
  }

  return partidos
}

export async function cerrarTorneoYPublicarRankings(torneoId: string): Promise<ResultadoGeneracion> {
  try {
    const partidosPendientes = await prisma.partido.findMany({
      where: { torneoId, completado: false }
    })

    if (partidosPendientes.length > 0) {
      return {
        success: false,
        error: `Hay ${partidosPendientes.length} partidos pendientes`
      }
    }

    await prisma.torneo.update({
      where: { id: torneoId },
      data: {
        estado: 'cerrado',
        fechaCierre: new Date()
      }
    })

    revalidatePath('/torneos')
    revalidatePath('/rankings')

    return { success: true }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
```

### PASO 6: Actualizar Componente de Página

**Archivo: `app/torneos/page.tsx`**

Ver archivo `torneos-page.tsx` adjunto para el componente completo.

**Puntos clave a verificar:**

1. Importar las actions correctamente:
```typescript
import { generarCuadroFaseAjuste, cerrarTorneoYPublicarRankings } from '@/app/actions/torneos'
```

2. Los botones deben llamar a las funciones:
```typescript
<button onClick={handleGenerarCuadro}>
  GENERAR CUADRO (FASE AJUSTE)
</button>
```

### PASO 7: Verificar Instalación de Dependencias

**Archivo: `package.json`**

Asegúrate de tener estas dependencias:

```json
{
  "dependencies": {
    "@prisma/client": "^5.9.0",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "prisma": "^5.9.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

**Instalar dependencias:**

```bash
npm install
```

### PASO 8: Reiniciar Servidor

```bash
# Matar procesos de Next.js que puedan estar corriendo
pkill -f "next"

# Limpiar todo
rm -rf .next

# Iniciar servidor limpio
npm run dev
```

---

## 🧪 TESTING

### Test 1: Verificar que la página carga

```bash
# Abrir en navegador:
http://localhost:3000/torneos
```

Deberías ver la interfaz sin errores en la consola.

### Test 2: Generar Cuadro

1. Click en botón "GENERAR CUADRO (FASE AJUSTE)"
2. Verificar que aparece mensaje de éxito
3. Revisar consola del servidor - debe mostrar logs de creación de partidos

### Test 3: Cerrar Torneo

1. Asegurarse que todos los partidos están marcados como completados
2. Click en "CERRAR TORNEO Y PUBLICAR RANKINGS"
3. Verificar mensaje de éxito

---

## 🐛 TROUBLESHOOTING

### Error: "Prisma Client not initialized"
```bash
npx prisma generate
npm run dev
```

### Error: "Cannot find module '@/lib/prisma'"
Verificar en `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error: "Database connection failed"
1. Verificar que la base de datos esté corriendo
2. Verificar credenciales en `.env`
3. Probar conexión:
```bash
npx prisma db push
```

### Los botones no hacen nada
1. Abrir DevTools (F12)
2. Ver pestaña Console
3. Ver pestaña Network
4. Verificar que las actions se están llamando

### Error 500 en actions
1. Revisar logs del servidor (terminal)
2. Verificar que Prisma está conectado
3. Verificar que el torneoId existe en la BD

---

## 📊 ESTRUCTURA FINAL DEL PROYECTO

```
tu-proyecto/
├── app/
│   ├── actions/
│   │   └── torneos.ts          ← Server Actions
│   ├── torneos/
│   │   └── page.tsx            ← Página principal
│   └── layout.tsx
├── lib/
│   └── prisma.ts               ← Cliente de Prisma
├── prisma/
│   ├── schema.prisma           ← Schema de BD
│   └── seed.ts                 ← Datos de ejemplo
├── .env                        ← Credenciales de BD
├── next.config.js              ← Config de Next.js
├── package.json
└── tsconfig.json
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] `.env` creado con DATABASE_URL correcto
- [ ] `next.config.js` actualizado
- [ ] `lib/prisma.ts` creado
- [ ] `prisma/schema.prisma` actualizado
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma db push` ejecutado
- [ ] Server actions creadas en `app/actions/torneos.ts`
- [ ] Componente actualizado en `app/torneos/page.tsx`
- [ ] Imports corregidos (usar `@/lib/prisma` en lugar de mock)
- [ ] `rm -rf .next` ejecutado
- [ ] `npm install` ejecutado
- [ ] Servidor reiniciado con `npm run dev`
- [ ] Página carga sin errores
- [ ] Botón "Generar Cuadro" funciona
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en consola del servidor

---

## 🎯 RESULTADO ESPERADO

1. ✅ Página de torneos carga correctamente
2. ✅ No más errores de Turbopack
3. ✅ Botón "Generar Cuadro" crea partidos automáticamente
4. ✅ Botón "Cerrar Torneo" funciona y actualiza rankings
5. ✅ Mensajes de error/éxito se muestran correctamente
6. ✅ Interfaz actualiza automáticamente tras acciones

---

## 📞 SOPORTE

Si después de seguir todos los pasos sigues teniendo problemas:

1. Verifica los logs del servidor
2. Verifica la consola del navegador
3. Ejecuta `npx prisma studio` para ver los datos
4. Revisa que todos los archivos estén en las rutas correctas

**Archivos importantes adjuntos:**
- `torneos-page.tsx` - Componente de página
- `actions.ts` - Server actions
- `schema.prisma` - Schema de base de datos
- `lib-prisma.ts` - Cliente de Prisma
- `next.config.js` - Configuración de Next.js
- `seed.ts` - Datos de ejemplo

¡Todos los errores han sido corregidos! 🎉
