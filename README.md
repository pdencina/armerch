# Iglesia Stats

Plataforma de estadísticas de encuentros con autenticación Google, roles por campus y dashboard en tiempo real.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **Deploy**: Vercel (CI/CD automático desde GitHub)
- **Charts**: Recharts

## Roles de usuario

| Rol | Dashboard | Ingresar datos | Historial | Administración |
|-----|-----------|----------------|-----------|----------------|
| `superadmin` | Todo (todos campus) | Sí (todos campus) | Todo | Sí |
| `admin_campus` | Su campus | Sí (su campus) | Su campus | No |
| `voluntario` | Su campus | Sí (su campus) | Su campus | No |
| `viewer` | Todo | No | Todo | No |

---

## Paso 1 — Supabase

1. Ve a [supabase.com](https://supabase.com) → tu proyecto → **SQL Editor**
2. Copia y ejecuta **todo** el contenido de `supabase-migration.sql`
3. Ve a **Authentication → Providers → Google** y activa Google OAuth:
   - Copia el **Callback URL** que muestra Supabase
   - Ve a [console.cloud.google.com](https://console.cloud.google.com) → APIs → Credentials → Create OAuth Client ID (Web)
   - Pega el callback URL en "Authorized redirect URIs"
   - Copia el Client ID y Client Secret de vuelta a Supabase
4. En **Project Settings → API** copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Paso 2 — GitHub

```bash
git init
git add .
git commit -m "feat: initial setup iglesia-stats"
git remote add origin https://github.com/TU_USUARIO/iglesia-stats.git
git push -u origin main
```

---

## Paso 3 — Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New Project** → importa tu repo de GitHub
2. En **Environment Variables** agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
   ```
3. Haz click en **Deploy** — Vercel detecta Next.js automáticamente

Desde ahora, cualquier `git push` a `main` hace deploy automático en Vercel.

---

## Paso 4 — Primer usuario superadmin

Después del primer login con Google:

1. Ve a Supabase → **Table Editor → profiles**
2. Busca tu usuario y cambia `role` a `superadmin`
3. Listo — ya puedes gestionar el resto desde la UI en `/admin`

---

## Desarrollo local

```bash
# 1. Clonar e instalar
npm install

# 2. Variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus claves de Supabase

# 3. Iniciar
npm run dev
# → http://localhost:3000
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── login/          # Página de login con Google
│   ├── auth/callback/  # Callback OAuth
│   ├── dashboard/      # Dashboard con stats y gráficos
│   ├── ingresar/       # Formulario de ingreso de datos
│   ├── historial/      # Historial con filtros y exportar CSV
│   └── admin/          # Gestión de usuarios y roles
├── components/
│   └── Sidebar.tsx     # Navegación lateral
├── lib/supabase/       # Cliente Supabase (browser/server/middleware)
└── types/              # TypeScript interfaces
```

## Formulario de ingreso

El formulario en `/ingresar` captura exactamente:
- Datos generales (fecha, campus, tipo de encuentro, modalidad, predicador, mensaje)
- Sección Presencial: aceptaron a Jesús, total general, asistencia auditorio/kids/tweens/sala bebé/sensorial
- Voluntarios: servicio, técnica, kids, tweens, worship, cocina, RRSS, seguridad, sala bebés, conexión, oración, merch, amor por la casa, sensorial, punto de siembra
- Sección Online: aceptaron a Jesús, espectadores a la vez
- Líderes de voluntarios y admins de campus
