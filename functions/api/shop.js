// Cloudflare Pages Function: POST /api/shop
// Creates a Stripe Checkout Session for physical shop products.
// Body: { product: '<id>', quantity: 1..10 }
// Prices are defined HERE (server-side) - the client only sends the product id.

const CATALOG = {
  salt: {
    name: 'Himalaya Pink Salt · Charity Edition (1000 g)',
    description:
      'Charity-Produkt: Ein Teil des Erlöses geht an die Kinder Krebs Aktion Deutschland e.V.',
    unit_amount: 999, // 9,99 € - fictional placeholder price
  },
};

const SHIPPING_CENTS = 490; // 4,90 € flat - placeholder

export async function onRequestPost({ env, request }) {
  try {
    const { product, quantity } = await request.json();
    const item = CATALOG[product];
    const qty = Math.round(Number(quantity));

    if (!item || !Number.isFinite(qty) || qty < 1 || qty > 10) {
      return json({ error: 'Ungültige Bestellung' }, 400);
    }

    const site = env.SITE_URL || new URL(request.url).origin;

    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(item.unit_amount),
      'line_items[0][price_data][product_data][name]': item.name,
      'line_items[0][price_data][product_data][description]': item.description,
      'line_items[0][quantity]': String(qty),
      'shipping_address_collection[allowed_countries][0]': 'DE',
      'shipping_address_collection[allowed_countries][1]': 'AT',
      'shipping_address_collection[allowed_countries][2]': 'CH',
      'shipping_options[0][shipping_rate_data][display_name]': 'Standardversand',
      'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
      'shipping_options[0][shipping_rate_data][fixed_amount][amount]': String(SHIPPING_CENTS),
      'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'eur',
      success_url: `${site}/danke?typ=shop`,
      cancel_url: `${site}/shop?abgebrochen=1`,
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
