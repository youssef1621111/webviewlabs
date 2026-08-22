# WebViewLabs Studio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual, Vercel-ready WebViewLabs studio site with an interactive live demo and a secure Supabase contact path.

**Architecture:** A Vite React TypeScript single-page site uses typed locale content, focused components, CSS custom properties for the visual system, and a browser-safe Supabase client. The contact form falls back to a local demo confirmation when public Supabase environment variables are not configured.

**Tech Stack:** Vite, React, TypeScript, `@supabase/supabase-js`, CSS modules via one global stylesheet, lucide-free inline SVG icons.

**Spec:** `docs/superpowers/specs/2026-08-22-webviewlabs-studio-design.md`

## Global Constraints

- Brand name: `webviewlabs`.
- English targets high-end business buyers; Arabic targets local and regional brands with natural localized copy.
- No literal translation and no invented founder credentials beyond the supplied brief and portfolio page.
- Sharp editorial grid, paper/ink/red palette, one cobalt live-demo surface, responsive, accessible, reduced-motion aware.
- Never expose a Supabase service-role or secret key to the browser.

### Task 1: Scaffold the Vite TypeScript app and design system

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/vite-env.d.ts`

- [ ] Add the pinned Vite/React/TypeScript scripts and dependencies.
- [ ] Add the document shell and `main.tsx` entry point.
- [ ] Define CSS variables, font imports, responsive grid primitives, focus styles, reduced-motion rules, and sharp editorial components.
- [ ] Run `npm install` and `npm run build` to establish a clean baseline.

### Task 2: Add typed localized content and page components

**Files:**
- Create: `src/content.ts`
- Create: `src/components/Header.tsx`, `src/components/LiveDemo.tsx`, `src/components/WorkGrid.tsx`, `src/components/Founders.tsx`, `src/components/ContactForm.tsx`
- Modify: `src/App.tsx`, `src/styles.css`

- [ ] Define `Locale`, `Direction`, and typed content objects for EN/AR.
- [ ] Implement the header language switch and direction-aware layout.
- [ ] Implement the live demo as a deterministic client-only interaction with progress and reset states.
- [ ] Render Shakalita as the lead commerce system and Eloobor as the supporting brand platform with external demo/source links.
- [ ] Render separate company and founder stories; use the supplied Youssef LinkedIn and Bejimy portfolio links.
- [ ] Add the contact form with client validation, honeypot, pending state, and explicit outcome messaging.

### Task 3: Connect Supabase with least-privilege schema

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/contact.ts`, `src/types.ts`, `.env.example`, `supabase/migrations/20260822100000_create_contact_submissions.sql`

- [ ] Initialize the browser client only when the two Vite public variables exist.
- [ ] Insert only the validated contact fields and never request returned rows.
- [ ] Create `contact_submissions` with length/check constraints, timestamps, RLS, explicit sequence/table grants, and an anonymous insert policy.
- [ ] Keep select/update/delete unavailable to `anon` and `authenticated`.
- [ ] Run the TypeScript build and, when credentials are available, verify one insert through the configured Supabase project.

### Task 4: Verify the experience in Chrome

**Files:**
- Modify only files needed from Tasks 1–3.

- [ ] Start the Vite dev server on a stable localhost port.
- [ ] Inspect the desktop page with Chrome DevTools snapshot and screenshot.
- [ ] Test the language toggle, live demo progression, contact validation, and anchor navigation.
- [ ] Emulate a mobile viewport and check for overflow, readable RTL layout, and touch targets.
- [ ] Run Lighthouse accessibility/SEO/best-practice audit and fix actionable issues.
- [ ] Run `npm run build` again and update graphify if a graph index exists.
