import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json()

    if (!order_id) {
      return NextResponse.json({ error: 'order_id requerido' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        client_name,
        client_email
      `)
      .eq('id', order_id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (!order.client_email) {
      return NextResponse.json({ error: 'La orden no tiene email' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'ARM Merch <onboarding@resend.dev>',
      to: order.client_email,
      subject: `Reenvío comprobante #${order.order_number}`,
      html: `
        <div style="font-family:sans-serif">
          <h2>Comprobante de compra</h2>
          <p>Hola ${order.client_name || 'cliente'},</p>
          <p>Te reenviamos tu comprobante.</p>

          <hr/>

          <p><strong>Orden:</strong> #${order.order_number}</p>
          <p><strong>Total:</strong> $${order.total}</p>

          <hr/>

          <p>Gracias por tu compra 🙌</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error reenviando email' },
      { status: 500 }
    )
  }
}