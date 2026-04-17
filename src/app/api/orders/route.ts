import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function escapeHtml(value: string) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function POST(req: Request) {
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
      return NextResponse.json(
        { error: 'Faltan variables de entorno de Supabase' },
        { status: 500 }
      )
    }

    const resend = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()

    const items = Array.isArray(body.items) ? body.items : []
    const paymentMethod = body.payment_method ?? null
    const notes = body.notes ?? null
    const discount = Number(body.discount ?? 0)
    const requestedCampusId = body.campus_id ?? null

    const clientName = String(body.client_name ?? '').trim() || null
    const clientEmail = String(body.client_email ?? '').trim().toLowerCase() || null

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'La venta no tiene productos' },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, campus_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      )
    }

    const sellingCampusId =
      profile.role === 'super_admin'
        ? requestedCampusId || profile.campus_id
        : profile.campus_id

    if (!sellingCampusId) {
      return NextResponse.json(
        { error: 'Campus inválido' },
        { status: 400 }
      )
    }

    const normalizedItems = items.map((item: any) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity ?? 0),
      unit_price: Number(item.unit_price ?? item.price ?? 0),
    }))

    const invalidItem = normalizedItems.find(
      (item: any) =>
        !item.product_id ||
        item.quantity <= 0 ||
        item.unit_price < 0
    )

    if (invalidItem) {
      return NextResponse.json(
        { error: 'Hay productos inválidos en la venta' },
        { status: 400 }
      )
    }

    if (discount < 0) {
      return NextResponse.json(
        { error: 'El descuento no puede ser negativo' },
        { status: 400 }
      )
    }

    const productIds = normalizedItems.map((item: any) => item.product_id)

    const { data: inventoryRows, error: inventoryError } = await adminClient
      .from('inventory')
      .select('id, product_id, stock')
      .eq('campus_id', sellingCampusId)
      .in('product_id', productIds)

    if (inventoryError) {
      return NextResponse.json(
        { error: inventoryError.message },
        { status: 400 }
      )
    }

    const inventoryMap = new Map(
      (inventoryRows ?? []).map((row: any) => [row.product_id, row])
    )

    for (const item of normalizedItems) {
      const inventory = inventoryMap.get(item.product_id)

      if (!inventory) {
        return NextResponse.json(
          { error: 'Uno de los productos no tiene inventario en este campus' },
          { status: 400 }
        )
      }

      if (Number(inventory.stock ?? 0) < item.quantity) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para uno de los productos. Disponible: ${inventory.stock ?? 0}`,
          },
          { status: 400 }
        )
      }
    }

    const subtotalCalculado = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price,
      0
    )

    const totalCalculado = subtotalCalculado - discount

    if (totalCalculado < 0) {
      return NextResponse.json(
        { error: 'El total no puede ser negativo' },
        { status: 400 }
      )
    }

    const { data: lastOrder, error: lastOrderError } = await adminClient
      .from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastOrderError) {
      return NextResponse.json(
        { error: lastOrderError.message },
        { status: 400 }
      )
    }

    const lastOrderNumber = Number(lastOrder?.order_number ?? 1000)
    const orderNumber = lastOrderNumber + 1

    const { data: createdOrder, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        campus_id: sellingCampusId,
        seller_id: profile.id,
        payment_method: paymentMethod,
        discount,
        total: totalCalculado,
        notes,
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

    if (clientEmail) {
      const { error: contactError } = await adminClient
        .from('order_contacts')
        .insert({
          order_id: createdOrder.id,
          client_name: clientName,
          client_email: clientEmail,
        })

      if (contactError) {
        return NextResponse.json(
          { error: contactError.message },
          { status: 400 }
        )
      }
    }

    const orderItemsRows = normalizedItems.map((item: any) => ({
      order_id: createdOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))

    const { error: orderItemsError } = await adminClient
      .from('order_items')
      .insert(orderItemsRows)

    if (orderItemsError) {
      return NextResponse.json(
        { error: orderItemsError.message },
        { status: 400 }
      )
    }

    const enrichedItems = []

    for (const item of normalizedItems) {
      const inventory = inventoryMap.get(item.product_id)
      const newStock = Number(inventory.stock ?? 0) - item.quantity

      const { error: stockError } = await adminClient
        .from('inventory')
        .update({
          stock: newStock,
          updated_at: new Date().toISOString(),
          updated_by: profile.id,
        })
        .eq('id', inventory.id)

      if (stockError) {
        return NextResponse.json(
          { error: stockError.message },
          { status: 400 }
        )
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
        return NextResponse.json(
          { error: movementError.message },
          { status: 400 }
        )
      }

      const { data: productData } = await adminClient
        .from('products')
        .select('name, sku')
        .eq('id', item.product_id)
        .single()

      enrichedItems.push({
        name: productData?.name ?? 'Producto',
        sku: productData?.sku ?? '—',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineTotal: item.quantity * item.unit_price,
      })
    }

    let emailSent = false

    if (clientEmail && resend) {
      try {
        const html = `
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
            <div style="text-align:center; margin-bottom: 24px;">
              <div style="width:48px; height:48px; line-height:48px; margin:0 auto 12px; background:#111; color:#fff; border-radius:12px; font-weight:700;">A</div>
              <h2 style="margin:0;">ARM MERCH</h2>
              <p style="margin:6px 0 0; color:#666;">Comprobante de compra</p>
            </div>

            <hr style="border:none; border-top:1px solid #ddd; margin:16px 0;" />

            <p><strong>Cliente:</strong> ${escapeHtml(clientName || 'Cliente')}</p>
            <p><strong>Orden:</strong> #${escapeHtml(String(createdOrder.order_number))}</p>
            <p><strong>Fecha:</strong> ${escapeHtml(new Date(createdOrder.created_at).toLocaleString('es-CL'))}</p>
            <p><strong>Método de pago:</strong> ${escapeHtml(createdOrder.payment_method ?? 'Sin definir')}</p>

            <hr style="border:none; border-top:1px solid #ddd; margin:16px 0;" />

            ${enrichedItems.map((item) => `
              <div style="display:flex; justify-content:space-between; gap:16px; margin-bottom:12px;">
                <div>
                  <div style="font-weight:600;">${escapeHtml(item.name)}</div>
                  <div style="font-size:12px; color:#666;">SKU: ${escapeHtml(item.sku)}</div>
                  <div style="font-size:12px; color:#666;">${item.quantity} × ${escapeHtml(formatCurrency(item.unitPrice))}</div>
                </div>
                <div style="font-weight:600; white-space:nowrap;">
                  ${escapeHtml(formatCurrency(item.lineTotal))}
                </div>
              </div>
            `).join('')}

            <hr style="border:none; border-top:1px solid #ddd; margin:16px 0;" />

            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#666;">Subtotal</span>
              <span>${escapeHtml(formatCurrency(subtotalCalculado))}</span>
            </div>

            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#666;">Descuento</span>
              <span>${escapeHtml(formatCurrency(Number(createdOrder.discount ?? 0)))}</span>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:700; margin-top:10px;">
              <span>Total</span>
              <span>${escapeHtml(formatCurrency(Number(createdOrder.total ?? 0)))}</span>
            </div>

            ${
              createdOrder.notes
                ? `
              <hr style="border:none; border-top:1px solid #ddd; margin:16px 0;" />
              <div>
                <div style="font-size:12px; color:#666; margin-bottom:4px;">Nota</div>
                <div>${escapeHtml(createdOrder.notes)}</div>
              </div>
            `
                : ''
            }

            <hr style="border:none; border-top:1px solid #ddd; margin:16px 0;" />

            <p style="text-align:center; color:#666; font-size:12px;">
              Gracias por tu compra 🙌
            </p>
          </div>
        `

        const { error: mailError } = await resend.emails.send({
          from: 'ARM Merch <onboarding@resend.dev>',
          to: clientEmail,
          subject: `Comprobante Orden #${createdOrder.order_number}`,
          html,
        })

        if (!mailError) {
          emailSent = true
        } else {
          console.error('Email error:', mailError)
        }
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
    return NextResponse.json(
      { error: error?.message ?? 'Error interno del servidor' },
      { status: 500 }
    )
  }
}