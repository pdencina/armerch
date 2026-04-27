# 🛒 AR MERCH — Guía de Upgrade: Carrito Avanzado con POS

## ¿Qué cambia en esta actualización?

Esta mejora transforma el carrito básico en un sistema completo estilo Mercado Libre con:

- **Descuentos por ítem** (porcentaje por producto individual)
- **Descuentos globales** manuales sobre el total
- **Cupones de promoción** con validación en tiempo real
- **Resumen de ahorro** dinámico visible al cliente
- **Badges de cantidad** en tarjetas de producto
- **Filtros por categoría** en la grilla de productos
- **Notas de venta** opcionales
- **Datos persistidos** del cliente entre sesiones
- **Actualización de inventario en tiempo real** (Supabase Realtime)
- **Indicador de conexión** online/offline
- **Animaciones** fluidas con Framer Motion

---

## Archivos a reemplazar

```
src/
├── lib/hooks/use-cart.ts              ← Reemplazar completamente
├── components/pos/
│   ├── cart.tsx                       ← Reemplazar completamente
│   └── product-grid.tsx              ← Reemplazar completamente
└── app/
    ├── (dashboard)/pos/page.tsx       ← Reemplazar completamente
    └── api/orders/route.ts            ← Reemplazar completamente
supabase/
└── migration_cart_upgrade.sql         ← Ejecutar en Supabase SQL Editor
```

---

## Pasos de instalación

### 1. Ejecutar la migración SQL

Abre **Supabase Dashboard → SQL Editor** y ejecuta el contenido de `supabase/migration_cart_upgrade.sql`.

Esto agrega:
- Columnas `discount_pct` y `line_total` en `order_items`
- Columnas `subtotal`, `promo_code` y `notes` en `orders`
- Tabla `promotions` con RLS
- Función `decrement_stock` (reemplaza tu función actual si existe)
- Índices de performance
- Datos de prueba para 3 cupones de ejemplo

### 2. Reemplazar los archivos de código

Copia los 5 archivos de esta carpeta a tu proyecto respetando las rutas indicadas arriba.

### 3. Verificar dependencias

Asegúrate de tener instaladas:

```bash
npm install zustand framer-motion lucide-react
```

Todas ya están en tu `package.json`, pero verificar que la versión de Zustand sea ≥ 4.4 para que funcione el middleware `persist`.

### 4. Ajustar los cupones de producción

Los cupones de ejemplo están en el archivo `use-cart.ts` como array `SAMPLE_PROMOS`. Para un entorno real, reemplaza esa constante con una llamada a Supabase:

```typescript
// En cart.tsx, antes del componente:
async function fetchPromos(): Promise<Promotion[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('promotions')
    .select('*')
    .eq('active', true)
  return data ?? []
}
```

---

## Nuevas funcionalidades del carrito

### Descuento por ítem
Cada producto en el carrito tiene un botón **"%"** que expande un campo para ingresar el porcentaje de descuento. El precio tachado aparece si hay descuento activo.

### Cupones de promoción
- Ingresa el código en el campo "Cupón de descuento"
- Presiona Enter o el botón "Aplicar"
- Se valida el monto mínimo si el cupón lo requiere
- Se muestra el ahorro en verde en el resumen

### Descuento manual global
Expandible con el botón "Descuento manual". Acepta cualquier monto en CLP. Útil para negociaciones en punto de venta.

### Resumen de ahorro
Si hay cualquier tipo de descuento activo, aparece un banner verde que muestra cuánto está ahorrando el cliente en monto y porcentaje.

---

## Atajos de teclado (sin cambios)

| Tecla | Acción |
|-------|--------|
| `1` | Método de pago: Efectivo |
| `2` | Método de pago: Transferencia |
| `3` | Método de pago: Débito |
| `4` | Método de pago: Crédito |
| `Enter` | Confirmar venta (si el carrito está listo) |
| Escáner | Agrega producto por SKU o ID automáticamente |

---

## Próximos pasos recomendados

1. **Gestión de promociones en settings**: Crear una pantalla `/settings/promotions` para que los admins puedan crear y editar cupones directamente en la app.

2. **Historial de uso de cupones**: Rastrear qué vouchers se usaron con `used_count` en la tabla `promotions`.

3. **Descuentos automáticos por cantidad**: Agregar lógica en `use-cart.ts` para aplicar descuentos automáticos cuando se compran 3+ unidades del mismo producto.

4. **Vista dividida en tablet AR**: Para dispositivos de realidad aumentada, considerar un layout horizontal 50/50 donde la cámara AR esté en la mitad izquierda y el carrito en la derecha.

5. **WebSocket para sync entre dispositivos**: Si se usa desde múltiples terminales en el mismo campus, agregar sincronización del inventario en tiempo real con Supabase Broadcast.
