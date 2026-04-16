# ARM Merch — Estructura del Proyecto Next.js

arm-merch/
├── .env.local                          # Variables de entorno (no subir a GitHub)
├── .env.example                        # Plantilla de variables (sí subir)
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   └── logo.svg
│
└── src/
    ├── app/                            # Next.js App Router
    │   ├── layout.tsx                  # Layout raíz con providers
    │   ├── page.tsx                    # Redirect a /dashboard o /login
    │   │
    │   ├── (auth)/                     # Grupo de rutas públicas
    │   │   └── login/
    │   │       └── page.tsx
    │   │
    │   └── (dashboard)/                # Grupo protegido (requiere auth)
    │       ├── layout.tsx              # Sidebar + navbar compartidos
    │       │
    │       ├── dashboard/
    │       │   └── page.tsx            # Resumen: ventas del día, stock bajo
    │       │
    │       ├── pos/                    # Punto de Venta (voluntarios)
    │       │   └── page.tsx            # Carrito + búsqueda productos
    │       │
    │       ├── inventory/              # Inventario (admin, super_admin)
    │       │   ├── page.tsx            # Lista productos con stock
    │       │   ├── [id]/
    │       │   │   └── page.tsx        # Detalle y edición de producto
    │       │   └── movements/
    │       │       └── page.tsx        # Historial de movimientos
    │       │
    │       ├── products/               # Gestión de productos (admin+)
    │       │   ├── page.tsx
    │       │   └── new/
    │       │       └── page.tsx
    │       │
    │       ├── orders/                 # Órdenes/Ventas (admin+)
    │       │   ├── page.tsx
    │       │   └── [id]/
    │       │       └── page.tsx
    │       │
    │       ├── reports/                # Reportes (admin+)
    │       │   └── page.tsx
    │       │
    │       └── settings/               # Configuración (super_admin)
    │           ├── page.tsx
    │           └── users/
    │               └── page.tsx        # Gestión de usuarios y roles
    │
    ├── components/
    │   ├── ui/                         # Componentes base reutilizables
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── badge.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── table.tsx
    │   │   └── toast.tsx
    │   │
    │   ├── layout/
    │   │   ├── sidebar.tsx             # Nav lateral con items por rol
    │   │   ├── navbar.tsx              # Top bar con usuario y notificaciones
    │   │   └── page-header.tsx
    │   │
    │   ├── pos/
    │   │   ├── product-grid.tsx        # Grid de productos para el POS
    │   │   ├── cart.tsx                # Panel del carrito
    │   │   ├── cart-item.tsx
    │   │   └── checkout-modal.tsx      # Modal de pago
    │   │
    │   ├── inventory/
    │   │   ├── product-table.tsx
    │   │   ├── stock-badge.tsx         # Badge rojo/verde según stock
    │   │   ├── movement-form.tsx       # Formulario entrada/salida stock
    │   │   └── low-stock-alert.tsx
    │   │
    │   ├── products/
    │   │   ├── product-form.tsx        # Crear/editar producto
    │   │   └── image-upload.tsx        # Upload a Supabase Storage
    │   │
    │   ├── orders/
    │   │   ├── orders-table.tsx
    │   │   └── order-detail.tsx
    │   │
    │   └── dashboard/
    │       ├── stats-card.tsx          # Tarjetas de métricas
    │       ├── sales-chart.tsx         # Gráfico ventas del día
    │       └── low-stock-list.tsx
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts               # createBrowserClient (lado cliente)
    │   │   ├── server.ts               # createServerClient (RSC / Server Actions)
    │   │   └── middleware.ts           # Refresh de sesión
    │   │
    │   ├── hooks/
    │   │   ├── use-user.ts             # Hook: usuario actual + rol
    │   │   ├── use-products.ts         # Hook: productos con stock (realtime)
    │   │   ├── use-cart.ts             # Hook: estado del carrito (Zustand)
    │   │   └── use-orders.ts
    │   │
    │   ├── actions/                    # Server Actions de Next.js
    │   │   ├── auth.ts                 # login, logout
    │   │   ├── products.ts             # CRUD productos
    │   │   ├── inventory.ts            # movimientos de stock
    │   │   └── orders.ts               # crear y completar ventas
    │   │
    │   └── utils/
    │       ├── format.ts               # formatCurrency, formatDate
    │       └── roles.ts                # helpers de permisos por rol
    │
    ├── types/
    │   └── database.types.ts           # Tipos generados por Supabase CLI
    │
    └── middleware.ts                   # Protección de rutas por rol
