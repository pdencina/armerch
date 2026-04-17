let emailSent = false

if (clientEmail && process.env.RESEND_API_KEY) {
  try {
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