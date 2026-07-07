// Cloudflare Pages Function: POST /api/donate
// Creates a Stripe Checkout Session for a free-amount donation.
// Body: { amount: <cents, integer, 100..1000000> }

export async function onRequestPost({ env, request }) {
  try {
    const { amount } = await request.json();
    const cents = Math.round(Number(amount));

    if (!Number.isFinite(cents) || cents < 100 || cents > 1000000) {
      return json({ error: 'Ungültiger Betrag' }, 400);
    }

    const site = env.SITE_URL || new URL(request.url).origin;

    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(cents),
      'line_items[0][price_data][product_data][name]':
        'Spende · Kleiner Stern ganz groß',
      'line_items[0][price_data][product_data][description]':
        'Deine Spende unterstützt krebskranke Kinder über die Kinder Krebs Aktion Deutschland e.V.',
      'line_items[0][quantity]': '1',
      success_url: `${site}/danke?typ=spende`,
      cancel_url: `${site}/?abgebrochen=1`,
      locale: 'de',
      submit_type: 'donate',
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const session = await res.json();

    if (!res.ok) {
      console.error('Stripe error:', session.error?.message);
      return json({ error: 'Stripe-Fehler' }, 502);
    }

    return json({ url: session.url });
  } catch (err) {
    console.error(err);
    return json({ error: 'Serverfehler' }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
