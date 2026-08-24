export type DocumentKey =
  | 'proposal'
  | 'creative_brief'
  | 'contract'
  | 'sow'
  | 'nda'
  | 'deposit_invoice'
  | 'access_form'
  | 'content_checklist'
  | 'final_invoice'

export type DocumentPhase = 'pitch' | 'legal' | 'onboarding' | 'wrapup'

export type DocumentDefinition = {
  key: DocumentKey
  phase: DocumentPhase
  phaseTitle: string
  phaseNumber: string
  title: string
  titleAr: string
  description: string
  getDefaultContent: (client: ClientInfo) => string
}

export type ClientInfo = {
  id: number
  name: string
  company: string
  phone: string
  email?: string | null
  brief: string
  budget?: string
  created_at: string
}

export const documentDefinitions: DocumentDefinition[] = [
  // Phase 1: The Pitch
  {
    key: 'proposal',
    phase: 'pitch',
    phaseNumber: '01',
    phaseTitle: 'Phase 1: The Pitch (Before Agreement)',
    title: 'Project Proposal',
    titleAr: 'عرض المشروع الفني والمالي',
    description: 'Pitching your solution, architecture, scope options, timeline, and pricing tiers.',
    getDefaultContent: (client) => `# PROJECT PROPOSAL · webviewlabs
Document ID: WV-PROP-${client.id} · Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}

## 1. Client & Project Overview
* Client Name: ${client.name}
* Company / Brand: ${client.company}
* Phone: ${client.phone}
* Email: ${client.email || 'Not provided'}
* Target Scope: ${client.brief}
* Estimated Budget Range: ${client.budget || 'Not specified'}

---

## 2. Executive Summary & Studio Perspective
webviewlabs proposes building a high-performance, bilingual digital product tailored to ${client.company}. Our engineering combines bespoke modern design, fast full-stack architecture, and search-optimized structure to turn visitors into repeat customers.

---

## 3. Scope of Work & Deliverables
* UI/UX Engineering: Modern editorial design system with full English & Arabic (RTL) support.
* Performance & SEO: Serverless edge deployment, sub-second load times, OpenGraph and JSON-LD schema.
* Integrations: Automated email notifications (Resend), SMS delivery (Twilio), database storage (Supabase).
* Administration: Dedicated Studio CMS / Admin dashboard for real-time lead and order management.

---

## 4. Proposed Timeline & Milestones
* Week 1: Strategy, Wireframing & Creative Direction.
* Week 2: High-fidelity Design & Frontend Architecture.
* Week 3: Backend, Database Schema & Third-party API Integrations.
* Week 4: Final QA, Performance Audits, Domain Pointing & Go-Live Launch.

---

## 5. Investment & Commercial Options
* Option A (Essential): High-conversion single-page experience · $1,500 - $2,500
* Option B (Standard Studio Lead): Full bilingual commerce/brand platform + Admin CMS · $3,500 - $5,000
* Option C (Enterprise Custom): Bespoke SaaS/app with multi-role permissions & automation · $6,000+

* Payment Terms: 50% Initial Deposit upon signing, 50% Final balance upon project completion.

---
Prepared by:
Youssef Mohamed · CEO & Software Engineer · webviewlabs
Bejimy Milad · CTO & Full-Stack Engineer · webviewlabs
hello@webviewlabs.com · https://webviewlabs.vercel.app`,
  },
  {
    key: 'creative_brief',
    phase: 'pitch',
    phaseNumber: '01',
    phaseTitle: 'Phase 1: The Pitch (Before Agreement)',
    title: 'Website Creative Brief',
    titleAr: 'ملف التوجه الإبداعي للموقع',
    description: "Capturing design preferences, brand mood, and project goals alongside the proposal.",
    getDefaultContent: (client) => `# WEBSITE CREATIVE BRIEF · webviewlabs
Document ID: WV-BRIEF-${client.id} · Client: ${client.company}

## 1. Brand Core & Target Market
* Brand Name: ${client.company}
* Primary Client Contact: ${client.name} (${client.phone})
* Target Audience: Discerning consumers & B2B clients seeking premium, dependable service.
* Core Value Proposition: Why customers choose ${client.company} over alternatives.

---

## 2. Design Direction & Aesthetic Tones
* Aesthetic Personality: [ ] Minimalist / Editorial  [ ] Bold & Dynamic  [ ] Luxury / High-end  [ ] Clean Tech
* Primary Color Palette: Studio Paper (#f2efe8), Ink Black (#171717), Signature Brand Accents.
* Typography: Dual-script harmony (Latin serif/sans-serif + Arabic Noto Kufi/Cairo).

---

## 3. Functional Requirements
* Multi-Language: English (LTR) & Arabic (RTL) seamless toggle.
* Primary Call to Action: Direct WhatsApp / Lead Form / Commerce Storefront.
* User Flow: Clean landing -> Clear proof metrics -> Social validation -> Direct action.

---

## 4. Client Notes & References
Initial Brief Summary: "${client.brief}"`,
  },

  // Phase 2: The Legalities
  {
    key: 'contract',
    phase: 'legal',
    phaseNumber: '02',
    phaseTitle: 'Phase 2: The Legalities (To Lock in the Project)',
    title: 'Web Design Contract / MSA',
    titleAr: 'عقد تصميم وبرمجة وتطوير الموقع',
    description: 'Establishes legal boundaries, deliverables, ownership, confidentiality, and payment terms.',
    getDefaultContent: (client) => `# MASTER SERVICES AGREEMENT & WEB CONTRACT
Agreement Reference: WV-MSA-${client.id} · Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}

PARTIES:
1. "The Studio": webviewlabs (Cairo, Egypt), represented by Founders Youssef Mohamed & Bejimy Milad.
2. "The Client": ${client.company}, represented by ${client.name} (${client.email || client.phone}).

---

## 1. Scope of Engagement
The Studio agrees to provide web design, frontend/backend engineering, and deployment services for ${client.company} as outlined in the Statement of Work (SOW).

## 2. Fees & Payment Terms
* Total Agreed Project Fee: ${client.budget || '$3,500'} USD
* Initial Deposit: 50% payable upon execution of this contract. No development work will commence prior to receipt of deposit.
* Final Balance: 50% payable upon final project milestone approval, prior to DNS launch and code repository transfer.

## 3. Intellectual Property & Ownership
Upon receipt of full and final payment, The Studio assigns to The Client all rights, title, and interest in the custom graphics, copy, and code specifically created for this project.

## 4. Revisions & Changes
The project includes two (2) consolidated rounds of feedback and revisions per milestone. Additional features beyond the SOW will be billed at an agreed hourly or milestone rate.

## 5. Confidentiality & Non-Disclosure
Both parties agree to hold all proprietary trade secrets, business data, and customer info in strict confidence.

## 6. Governing Law
This Agreement is governed by and construed in accordance with the laws of the Arab Republic of Egypt.

---

SIGNATURES:

For webviewlabs (The Studio):                    For ${client.company} (The Client):
Signature: ______________________               Signature: ______________________
Name: Youssef Mohamed / Bejimy Milad            Name: ${client.name}
Date: ${new Date().toLocaleDateString()}                          Date: _________________________`,
  },
  {
    key: 'sow',
    phase: 'legal',
    phaseNumber: '02',
    phaseTitle: 'Phase 2: The Legalities (To Lock in the Project)',
    title: 'Statement of Work (SOW)',
    titleAr: 'بيان نطاق العمل التفصيلي',
    description: 'Attached directly to the contract to define exact pages, features, and milestones.',
    getDefaultContent: (client) => `# STATEMENT OF WORK (SOW)
Attachment to Agreement: WV-MSA-${client.id} · Client: ${client.company}

## 1. Detailed Page & Feature Breakdown
* [1] Home Experience: High-impact masthead, interactive product/service showcase, bilingual copy.
* [2] About / Brand Story: Company philosophy, founders/team, mission metrics.
* [3] Service / Product Catalog: Structured cards, filtering, detailed spec modals.
* [4] Direct Lead / Contact Flow: WhatsApp instant connect, form validation, email & SMS automation.
* [5] Internal Admin / Leads Dashboard: Real-time lead review, status pipeline, and document generation.

## 2. Technical Stack & Architecture
* Frontend: React / TypeScript / Vite / Tailored CSS tokens.
* Backend & Storage: Supabase PostgreSQL, Edge Functions, Row-Level Security.
* Communications: Resend API for transactional email, Twilio API for SMS notifications.
* Hosting & CDN: Vercel Edge Global Network.

## 3. Milestones & Delivery Schedule
* Milestone 1 (Week 1): Architecture & Design Approval.
* Milestone 2 (Week 2): Core Frontend & Interactive Prototype.
* Milestone 3 (Week 3): Backend, Database & Workflow Integrations.
* Milestone 4 (Week 4): Client Acceptance & Live Production Launch.`,
  },
  {
    key: 'nda',
    phase: 'legal',
    phaseNumber: '02',
    phaseTitle: 'Phase 2: The Legalities (To Lock in the Project)',
    title: 'Non-Disclosure Agreement (NDA)',
    titleAr: 'اتفاقية عدم الإفصاح والسرية',
    description: 'Signed concurrently with the contract to protect proprietary business and code assets.',
    getDefaultContent: (client) => `# MUTUAL NON-DISCLOSURE AGREEMENT
Agreement Reference: WV-NDA-${client.id} · Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}

BETWEEN:
webviewlabs ("Disclosing / Receiving Party") AND ${client.company} / ${client.name} ("Disclosing / Receiving Party").

1. Purpose: To evaluate, design, build, and deploy digital products and software solutions.
2. Confidential Information: All technical data, source code, designs, customer databases, business models, and strategic documentation shared by either party.
3. Term: The confidentiality obligations shall remain in effect for a period of two (2) years from the date hereof.

Signatures:
webviewlabs: ___________________________       ${client.company}: ___________________________`,
  },

  // Phase 3: The Financials & Onboarding
  {
    key: 'deposit_invoice',
    phase: 'onboarding',
    phaseNumber: '03',
    phaseTitle: 'Phase 3: The Financials & Onboarding (Before Work Starts)',
    title: 'Initial Deposit Invoice (50%)',
    titleAr: 'فاتورة الدفعة الأولى (٥٠٪)',
    description: 'Sent right after the contract is signed; work starts immediately upon clearance.',
    getDefaultContent: (client) => `# INVOICE · INITIAL DEPOSIT (50%)
Invoice No: WV-INV-${client.id}-01 · Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
Payment Terms: Due upon receipt / Kickoff Milestone

BILL TO:
Client: ${client.name}
Company: ${client.company}
Phone: ${client.phone}
Email: ${client.email || 'N/A'}

FROM:
Studio: webviewlabs
Cairo, Egypt
hello@webviewlabs.com · https://webviewlabs.vercel.app

---

## Line Items
| Description | Qty | Rate | Amount |
| :--- | :---: | :---: | :---: |
| Initial 50% Project Deposit — ${client.company} Digital Platform (Design, Architecture & Development Kickoff) | 1 | $1,750.00 | $1,750.00 |

* Total Project Value: $3,500.00 USD
* Initial Deposit (50%): $1,750.00 USD
* **TOTAL AMOUNT DUE NOW: $1,750.00 USD**
* Remaining Balance: $1,750.00 USD (Billed upon project completion before live handover)

---

## Payment Instructions
1. InstaPay (Egypt EGP): username / phone @webviewlabs
2. Bank Wire / Transfer: Bank Misr / CIB (Account details available upon request)
3. Online Card / Stripe: Invoice link provided via email

*Note: Work commences immediately upon confirmation of this initial deposit.*`,
  },
  {
    key: 'access_form',
    phase: 'onboarding',
    phaseNumber: '03',
    phaseTitle: 'Phase 3: The Financials & Onboarding (Before Work Starts)',
    title: 'Access & Credentials Form',
    titleAr: 'نموذج بيانات الوصول والاستضافة',
    description: 'Securely collect domain, hosting, DNS, and tool logins during onboarding.',
    getDefaultContent: (client) => `# ACCESS & CREDENTIALS INTAKE FORM
Project: ${client.company} · Document ID: WV-ACCESS-${client.id}

Please securely provide access credentials for the following platforms to allow webviewlabs to configure your environment:

1. Domain Registrar (e.g. GoDaddy, Namecheap, Cloudflare)
* Provider: _________________________
* Username / Email: _________________
* Password / Delegate Access: _______

2. Hosting & Cloud Provider (if existing)
* Platform: _________________________
* URL / Login: ______________________

3. Third-party Integrations
* Email / Newsletter (e.g. Google Workspace, Brevo): _________________
* Payment Gateway (e.g. Stripe, Paymob, Fawry): ____________________
* Analytics (e.g. Google Analytics 4, Meta Pixel): ___________________

*Privacy Note: All credentials shared are encrypted and used solely for the technical execution of this project.*`,
  },
  {
    key: 'content_checklist',
    phase: 'onboarding',
    phaseNumber: '03',
    phaseTitle: 'Phase 3: The Financials & Onboarding (Before Work Starts)',
    title: 'Content Collection Checklist',
    titleAr: 'قائمة جمع المحتوى والأصول الرقمية',
    description: 'Guides the client in gathering copy, vector logos, photos, and assets while you prep the setup.',
    getDefaultContent: (client) => `# CONTENT COLLECTION CHECKLIST
Project: ${client.company} · Studio: webviewlabs

Please prepare and upload the following brand assets to our shared Google Drive / workspace:

* [ ] 1. Vector Logos: SVG, AI, or High-res Transparent PNG (Dark & Light variations).
* [ ] 2. Brand Guidelines: Primary brand colors, font rules, logo usage rules (if available).
* [ ] 3. High-Resolution Photography: Product photos, facility shots, founder portraits (Uncompressed).
* [ ] 4. Bilingual Copywriting: Company bio, service descriptions in Arabic and English.
* [ ] 5. Social & Legal Links: WhatsApp business number, Instagram, LinkedIn, Privacy Policy terms.

*Deadline for Phase 1 Content Submission: Within 5 business days of deposit clearance.*`,
  },

  // Phase 4: Project Wrap-Up
  {
    key: 'final_invoice',
    phase: 'wrapup',
    phaseNumber: '04',
    phaseTitle: 'Phase 4: Project Wrap-Up (At the End)',
    title: 'Final Invoice (Remaining 50%)',
    titleAr: 'فاتورة التسليم النهائي (٥٠٪)',
    description: 'Sent after client approval but before transferring ownership or launching the website live.',
    getDefaultContent: (client) => `# FINAL INVOICE · COMPLETION & HANDOVER (50%)
Invoice No: WV-INV-${client.id}-02 · Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
Payment Terms: Due upon delivery / Prior to DNS Transfer & Live Deployment

BILL TO:
Client: ${client.name}
Company: ${client.company}
Phone: ${client.phone}
Email: ${client.email || 'N/A'}

FROM:
Studio: webviewlabs
Cairo, Egypt
hello@webviewlabs.com · https://webviewlabs.vercel.app

---

## Line Items
| Description | Qty | Rate | Amount |
| :--- | :---: | :---: | :---: |
| Final 50% Project Milestone Balance — ${client.company} Web Platform Complete Delivery & QA Approval | 1 | $1,750.00 | $1,750.00 |

* Total Project Value: $3,500.00 USD
* Less: Initial Deposit Paid (WV-INV-${client.id}-01): -$1,750.00 USD
* **FINAL AMOUNT DUE FOR LAUNCH: $1,750.00 USD**

---

## Handover Inclusions Upon Payment
1. Custom Domain DNS propagation & SSL configuration.
2. Full code repository & Supabase database admin transfer.
3. 30 days of post-launch technical warranty & monitoring.

---
Thank you for building with webviewlabs.
Youssef Mohamed & Bejimy Milad · Founders, webviewlabs`,
  },
]
