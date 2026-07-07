# Kleiner Stern ganz groß — Website

Neuaufbau der Charity-Website (vorher WordPress) als schnelle, statische Astro-Site.
50 % aller Einnahmen gehen an die [Kinder Krebs Aktion Deutschland e.V.](https://www.kinderkrebsaktion.de)

## Stack

- **Astro** (statisch, kein JS-Framework nötig — extrem schnell)
- **Cloudflare Pages** (Hosting + Serverless Functions in `/functions`)
- **Stripe Checkout** (Song-Kauf 0,99 € + freie Spenden)
- **GitHub** (Deployment via Git-Push)

## Lokal starten

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # Produktions-Build nach dist/
```

Hinweis: Die Stripe-Buttons funktionieren lokal nur mit `wrangler pages dev`
(siehe unten), da die API-Endpunkte Cloudflare Pages Functions sind:

```bash
npm run build
npx wrangler pages dev dist --binding STRIPE_SECRET_KEY=sk_test_xxx STRIPE_PRICE_SONG=price_xxx
```

## Deployment (einmalig einrichten)

1. **GitHub:** Repo erstellen und pushen
   ```bash
   git init && git add -A && git commit -m "MVP"
   git remote add origin git@github.com:DEIN-USER/kleiner-stern.git
   git push -u origin main
   ```
2. **Cloudflare Pages:** Dashboard → Workers & Pages → Create → Pages →
   Connect to Git → Repo wählen.
   - Build command: `npm run build`
   - Output directory: `dist`
3. **Stripe:**
   - Dashboard → Produkte → Produkt „Kleiner Stern ganz groß (Song)" mit Preis 0,99 € anlegen → `price_...` ID kopieren
   - Cloudflare Pages → Settings → Environment variables:
     - `STRIPE_SECRET_KEY` = `sk_live_...` (erst `sk_test_...` zum Testen)
     - `STRIPE_PRICE_SONG` = `price_...`
     - `SITE_URL` = `https://enilaangel.com`
4. **Domain:** Cloudflare Pages → Custom domains → `enilaangel.com` verbinden.

## Song-Download einrichten (R2)

Der Kauf-Flow: Hörprobe (30 Sek.) auf der Startseite → Stripe Checkout →
`/danke?session_id=...` → Download-Button ruft `/api/download` auf, das die
Zahlung bei Stripe verifiziert und den Song aus dem privaten R2-Bucket streamt.

1. **Audio-Dateien ersetzen:**
   - `public/audio/kleiner-stern-preview.mp3` = 30-Sekunden-Hörprobe
     (aktuell Platzhalter-Ton!). Empfohlen: 128 kbps, Fade-Out am Ende.
   - Voller Song kommt NICHT ins Repo/public, sondern nach R2 (Schritt 2).
2. **R2-Bucket:** Cloudflare Dashboard → R2 → Bucket `kleiner-stern-songs`
   anlegen → Datei `kleiner-stern-ganz-gross.mp3` hochladen (320 kbps MP3).
3. **Binding:** Pages-Projekt → Settings → Bindings → R2 bucket binding:
   Variable name `SONGS` → Bucket `kleiner-stern-songs`.
4. Fertig. Ohne Binding liefert `/api/download` eine freundliche Fehlermeldung.

## Offene Punkte (Phase 2)

- [ ] **Impressum & Datenschutz**: Platzhalter in `src/pages/impressum.astro` und
      `src/pages/datenschutz.astro` mit echten Angaben füllen
- [ ] **Echte Audio-Dateien**: Hörprobe (30 Sek.) und vollen Song vom
      Kunden anfordern, dann R2 einrichten (siehe oben)
- [ ] **Download-Limit** (optional): KV-basiertes Limit, z. B. 5 Downloads
      pro Kauf innerhalb von 7 Tagen
- [ ] **Shop**: Preis (aktuell fiktiv 9,99 € + 4,90 € Versand) und Produkttexte
      vom Kunden bestätigen lassen; AGB/Widerruf für physische Produkte ergänzen
- [ ] **Partner/Unterstützer**: Platzhalter-Slots auf `/partner` mit echten
      Logos ersetzen
- [ ] **Presse**: Platzhalter-Pressemitteilungen mit echten Texten/PDFs ersetzen
- [ ] **Google Fonts lokal einbinden** (DSGVO): `@fontsource`-Pakete statt CDN
- [ ] Qobuz-/Streaming-Links aktualisieren (Footer)
- [ ] Open-Graph-Bild (`og:image`) hinzufügen

## Struktur

```
src/
  layouts/    Base.astro (Header, Fonts, Meta, Reveal-Animation), Legal.astro
  components/ Header, HeroV1/V2, Quote, Release, About, Pricing, KkadInfo,
              Mission, Project, Press, ShopTeaser, PageIntro, FinalCta, Footer
  pages/      index, ueber, shop, presse, partner, danke, impressum, datenschutz
  styles/     global.css (Design-Tokens: Slate-Grau + Gold)
functions/
  api/        checkout.js (Song 0,99 €), donate.js (freie Spende),
              shop.js (Produkte, serverseitiger Katalog + Versand) — Stripe
public/
  images/     hero-ribbon.jpg, cover-kleiner-stern.jpg, shop-salt.jpg,
              shop-advert.jpg, topgear-ball.jpg
```
