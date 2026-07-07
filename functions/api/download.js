// Cloudflare Pages Function: GET /api/download?session_id=cs_...
// Verifies the Stripe Checkout session was PAID, then streams the full
// song from the private R2 bucket.
//
// Setup (Cloudflare Pages > Settings):
//   1. R2 bucket (e.g. "kleiner-stern-songs"), upload: kleiner-stern-ganz-gross.mp3
//   2. Bindings > R2 bucket binding: name SONGS -> that bucket
//   3. Env var STRIPE_SECRET_KEY (already set for checkout)

const SONG_KEY = 'kleiner-stern-ganz-gross.mp3';
const SONG_FILENAME = 'Kleiner Stern ganz gross - Enilaangel.mp3';

export async function onRequestGet({ env, request }) {
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!sessionId || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return text('Ungültiger Link.', 400);
  }

  // 1. Verify payment with Stripe
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
  );

  if (!res.ok) return text('Kauf konnte nicht bestätigt werden.', 403);

  const session = await res.json();
  if (session.payment_status !== 'paid') {
    return text('Diese Zahlung ist noch nicht abgeschlossen.', 403);
  }

  // 2. Stream the song from R2
  if (!env.SONGS) {
    return text(
      'Der Download ist noch nicht eingerichtet. Bitte kontaktiere info@enilaangel.com',
      503
    );
  }

  const object = await env.SONGS.get(SONG_KEY);
  if (!object) return text('Song-Datei nicht gefunden.', 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${SONG_FILENAME}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

function text(msg, status) {
  return new Response(msg, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
