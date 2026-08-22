# WebViewLabs Studio Site Design

## Goal

Create a bilingual WebViewLabs studio site that makes premium digital work feel tangible within the first viewport, speaks naturally to both high-end international businesses and ambitious local brands, and turns qualified interest into a secure project enquiry.

## Audience and message

- English is positioned for high-end business buyers: precise, calm, strategic, and outcome-led.
- Arabic is localized for Egyptian and regional brands: warm, direct, confident, and culturally natural rather than translated sentence-by-sentence.
- The company story is about WebViewLabs as a small senior studio. The founders section separately introduces Youssef Mohamed and Bejimy with their roles and links.
- Portfolio proof is drawn from the shared work: Shakalita commerce and Eloobor brand platform. Claims stay limited to what is visible in the supplied portfolio source.

## Visual direction

The design keeps the brief's newsprint structure but refines it into a digital studio identity: ink black, paper, signal red, and a restrained cobalt used only by the live demo. Sharp borders, editorial metadata, visible grid lines, and Playfair Display paired with Inter make the work feel considered rather than template-based. The single signature is the “working edition” live demo: a small interactive service request surface with language switching, status progression, and a project brief CTA.

The page is intentionally compact:

1. Header with wordmark, EN/AR switch, and primary project CTA.
2. Hero thesis with live-demo card and proof metrics.
3. Projects page with Commerce and Brand platform tabs, led by Shakalita's best-seller commerce system.
4. Two-column company story and capabilities.
5. Founder notes with distinct roles and links.
6. Contact form wired to Supabase, with an email fallback when configuration is absent.

## Architecture

- Vite + React + TypeScript for a lightweight static deployment on Vercel.
- Content lives in typed locale objects in the client; no duplicated JSX for English and Arabic.
- `LiveDemo` owns its local interactive state and is independent of Supabase.
- `ContactForm` submits a validated, honeypot-protected payload through the browser-safe Supabase publishable key. The table accepts anonymous inserts only; no public select/update/delete policy is created.
- A migration and `.env.example` make the Supabase connection reproducible without embedding secrets.

## Accessibility and safety

- Semantic sections, labelled controls, keyboard-visible focus, reduced-motion support, and `dir="rtl"` for Arabic.
- Minimum 44px touch targets for controls.
- The browser only receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; service-role and secret keys are never referenced.
- Supabase RLS is enabled and grants are explicit. Contact rows are never readable through the public Data API.

## Success criteria

- `npm run build` succeeds with TypeScript checking.
- The landing page works at desktop and mobile widths without horizontal overflow.
- The language switch changes direction and all visible copy coherently.
- Live Demo progresses through an observable interaction without requiring an account.
- Contact form provides clear success/error states and remains usable in demo mode without Supabase env vars.
