import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Compatible con el esquema real de la BD:
//   • order_contacts (tabla separada para datos del cliente)
//   • inventory (update directo, no RPC)
//   • status: 'paid'
//   • Descuentos por ítem, cupón en notes, descuento global
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '').trim()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json({ error: 'Faltan variables de entorno' }, { status: 500 })
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user }, error: userError } = await authClient.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const items: Array<{
      product_id: string; quantity: number; unit_price: number; discount_pct?: number
    }> = Array.isArray(body.items) ? body.items : []
    const paymentMethod: string = body.payment_method ?? null
    const discount = Number(body.discount ?? 0)
    const promoCode: string | null = body.promo_code ?? null
    const extraNotes: string | null = body.notes ?? null
    const requestedCampusId: string | null = body.campus_id ?? null
    const clientName: string | null = String(body.client_name ?? '').trim() || null
    const clientEmail: string | null = String(body.client_email ?? '').trim().toLowerCase() || null

    if (!items.length || !clientName || !paymentMethod) {
      return NextResponse.json(
        { error: 'Datos incompletos: items, nombre del cliente y método de pago son requeridos' },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('id, role, campus_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se encontró el perfil del vendedor' }, { status: 404 })
    }

    const sellingCampusId =
      profile.role === 'super_admin'
        ? requestedCampusId || profile.campus_id
        : profile.campus_id

    if (!sellingCampusId) {
      return NextResponse.json({ error: 'No tienes un campus asignado para vender' }, { status: 400 })
    }

    const normalizedItems = items.map((i) => ({
      product_id: i.product_id,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      discount_pct: Number(i.discount_pct ?? 0),
    }))

    // Verificar stock
    const productIds = normalizedItems.map((i) => i.product_id)
    const { data: inventoryRows, error: inventoryError } = await adminClient
      .from('inventory')
      .select('id, product_id, stock')
      .in('product_id', productIds)
      .eq('campus_id', sellingCampusId)

    if (inventoryError) {
      return NextResponse.json({ error: inventoryError.message }, { status: 400 })
    }

    const inventoryMap = new Map(
      (inventoryRows ?? []).map((row: any) => [row.product_id, row])
    )

    for (const item of normalizedItems) {
      const inventory = inventoryMap.get(item.product_id)
      if (!inventory) {
        return NextResponse.json({ error: 'Producto no encontrado en inventario de este campus' }, { status: 400 })
      }
      if (Number(inventory.stock ?? 0) < item.quantity) {
        return NextResponse.json({
          error: `Stock insuficiente. Disponible: ${inventory.stock ?? 0}`,
        }, { status: 400 })
      }
    }

    // Calcular totales
    const subtotalCalculado = normalizedItems.reduce(
      (sum, i) => sum + i.unit_price * i.quantity * (1 - i.discount_pct / 100),
      0
    )
    const totalCalculado = Math.max(0, subtotalCalculado - discount)

    // Número de orden
    const { data: lastOrder } = await adminClient
      .from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single()
    const orderNumber = Number(lastOrder?.order_number ?? 1000) + 1

    // Notas combinadas: cupón + notas opcionales
    const combinedNotes = [
      promoCode ? `Cupón: ${promoCode}` : null,
      extraNotes,
    ].filter(Boolean).join(' | ') || null

    // Crear orden
    const { data: createdOrder, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        campus_id: sellingCampusId,
        seller_id: profile.id,
        payment_method: paymentMethod,
        discount,
        total: Math.round(totalCalculado),
        notes: combinedNotes,
        status: 'paid',
      })
      .select('id, order_number, status, created_at, total, discount, payment_method, notes')
      .single()

    if (orderError || !createdOrder) {
      return NextResponse.json(
        { error: orderError?.message ?? 'No se pudo crear la orden' },
        { status: 400 }
      )
    }

    // Guardar contacto en order_contacts
    if (clientName || clientEmail) {
      const { error: contactError } = await adminClient
        .from('order_contacts')
        .insert({ order_id: createdOrder.id, client_name: clientName, client_email: clientEmail })
      if (contactError) {
        return NextResponse.json({ error: contactError.message }, { status: 400 })
      }
    }

    // Insertar order_items
    // NOTA: discount_pct y line_total requieren migration_cart_upgrade.sql.
    // Si aún no ejecutaste la migración, comenta esas dos líneas.
    const orderItemsRows = normalizedItems.map((item) => ({
      order_id: createdOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      // Descomentar después de ejecutar migration_cart_upgrade.sql:
      // discount_pct: item.discount_pct,
      // line_total: Math.round(item.unit_price * item.quantity * (1 - item.discount_pct / 100)),
    }))

    const { error: orderItemsError } = await adminClient
      .from('order_items')
      .insert(orderItemsRows)
    if (orderItemsError) {
      return NextResponse.json({ error: orderItemsError.message }, { status: 400 })
    }

    // Actualizar stock e insertar movimientos
    for (const item of normalizedItems) {
      const inventory = inventoryMap.get(item.product_id)
      const newStock = Number(inventory.stock ?? 0) - item.quantity

      const { error: stockError } = await adminClient
        .from('inventory')
        .update({ stock: newStock, updated_at: new Date().toISOString(), updated_by: profile.id })
        .eq('id', inventory.id)
      if (stockError) {
        return NextResponse.json({ error: stockError.message }, { status: 400 })
      }

      const { error: movementError } = await adminClient
        .from('inventory_movements')
        .insert({
          product_id: item.product_id,
          campus_id: sellingCampusId,
          type: 'salida',
          quantity: item.quantity,
          notes: `Venta ${createdOrder.order_number}`,
          created_by: profile.id,
        })
      if (movementError) {
        return NextResponse.json({ error: movementError.message }, { status: 400 })
      }
    }

    // Enviar email con Resend si hay email y API key
    let emailSent = false
    if (clientEmail && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fmt = (n: number) =>
          new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

        const itemsHtml = normalizedItems
          .map((item) => {
            const lineTotal = item.unit_price * item.quantity * (1 - item.discount_pct / 100)
            return `<tr>
              <td style="padding:6px 0;border-bottom:1px solid #eee;">${item.product_id}</td>
              <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
              <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">${fmt(lineTotal)}</td>
            </tr>`
          }).join('')

        const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#111;">Comprobante — ARM Merch</h2>
          <p>Hola <strong>${clientName}</strong>, gracias por tu compra.</p>
          <p><strong>Orden #${createdOrder.order_number}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead><tr style="background:#f5f5f5;">
              <th style="padding:8px;text-align:left;">Producto</th>
              <th style="padding:8px;text-align:center;">Cant.</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ${discount > 0 ? `<p style="color:green;">Descuento: −${fmt(discount)}</p>` : ''}
          <p style="font-size:20px;font-weight:bold;">Total: ${fmt(Math.round(totalCalculado))}</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;"/>
          <p style="color:#666;font-size:12px;text-align:center;">Gracias por tu compra 🙌</p>
        </div>`

        const { error: mailError } = await resend.emails.send({
          from: 'ARM Merch <onboarding@resend.dev>',
          to: clientEmail,
          subject: `Comprobante Orden #${createdOrder.order_number}`,
          html,
        })
        if (!mailError) emailSent = true
        else console.error('Email error:', mailError)
      } catch (e) {
        console.error('Email exception:', e)
      }
    }

    return NextResponse.json({
      success: true,
      order_id: createdOrder.id,
      order_number: createdOrder.order_number,
      status: createdOrder.status,
      email_sent: emailSent,
    })
  } catch (error: any) {
    console.error('POST /api/orders error:', error)
    return NextResponse.json({ error: error?.message ?? 'Error interno del servidor' }, { status: 500 })
  }
}
