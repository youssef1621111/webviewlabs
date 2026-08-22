# webviewlabs

Digital products with a point of view — a bilingual Vite + React + TypeScript studio site for WebViewLabs.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4173/`.

## Supabase

Copy `.env.example` to `.env.local` and add the project URL and publishable key from the Supabase Connect panel:

```bash
VITE_SUPABASE_URL=https://kmfyksthoqjobxfypqvy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SITE_URL=https://webviewlabs.vercel.app
```

Apply both migrations in `supabase/migrations/` in the Supabase SQL editor or through the Supabase MCP server. The newer migration adds the required phone field and makes email optional. The table has RLS enabled, grants only anonymous/authenticated inserts, and does not expose contact rows for reading.

The connected Supabase project is `kmfyksthoqjobxfypqvy`: [open its dashboard](https://supabase.com/dashboard/project/kmfyksthoqjobxfypqvy).

The browser preview intentionally works without Supabase configuration and reports a demo-only success state instead of pretending to persist a lead.

## Deploy to Vercel

Import the repository into Vercel with the default Vite settings. Add the three `VITE_` environment variables to the Production and Preview environments, then deploy. `VITE_SITE_URL` should match the final public Vercel URL so canonical URLs and the sitemap stay correct. The static app has no server-only runtime requirement.

The public site uses crawlable bilingual routes such as `/en/projects/` and `/ar/projects/`, with localized metadata, canonical URLs, `hreflang`, JSON-LD, Open Graph cards, `robots.txt`, and `sitemap.xml`.

## Content and architecture

- `src/content.ts` contains the localized English and Arabic copy.
- `src/components/LiveDemo.tsx` owns the interactive working-edition demo.
- `src/components/ContactForm.tsx` owns validation and submission states.
- `src/lib/contact.ts` and `src/lib/supabase.ts` contain the browser-safe Supabase boundary.
- `docs/superpowers/specs/2026-08-22-webviewlabs-studio-design.md` records the design direction and security decisions.
# webviewlabs
