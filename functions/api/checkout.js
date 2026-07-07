// Cloudflare Pages Function: POST /api/checkout
// Creates a Stripe Checkout Session for the 0,99 € song.
// Env vars (Cloudflare Pages > Settings > Environment variables):
//   STRIPE_SECRET_KEY, STRIPE_PRICE_SONG, SITE_URL

export async function onRequestPost({ env, request }) {
  try {
    const site = env.SITE_URL || new URL(request.url).origin;

    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price]': env.STRIPE_PRICE_SONG,
      'line_items[0][quantity]': '1',
      success_url: `${site}/danke?typ=song&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/?abgebrochen=1`,
      locale: 'de',
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
