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

export function renderMarkdownToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  const htmlLines: string[] = []
  let inTable = false
  let tableHeaderParsed = false
  let inList = false
  let listType: 'ul' | 'ol' = 'ul'

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    // Handle Table
    if (line.startsWith('|') && line.endsWith('|')) {
      if (inList) {
        htmlLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
      }

      if (!inTable) {
        htmlLines.push('<table class="doc-table">')
        inTable = true
        tableHeaderParsed = false
      }

      // Check if separator row (| :--- | :---: |)
      if (line.replace(/[:\-\s|]/g, '') === '') {
        tableHeaderParsed = true
        continue
      }

      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => formatInline(c.trim()))

      if (!tableHeaderParsed) {
        htmlLines.push('<thead><tr>')
        cells.forEach((cell) => htmlLines.push(`<th>${cell}</th>`))
        htmlLines.push('</tr></thead><tbody>')
      } else {
        htmlLines.push('<tr>')
        cells.forEach((cell) => htmlLines.push(`<td>${cell}</td>`))
        htmlLines.push('</tr>')
      }
      continue
    } else if (inTable) {
      htmlLines.push('</tbody></table>')
      inTable = false
      tableHeaderParsed = false
    }

    // Handle Lists
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        if (inList) htmlLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        htmlLines.push('<ul class="doc-list">')
        inList = true
        listType = 'ul'
      }
      const itemContent = formatInline(line.slice(2))
      htmlLines.push(`<li>${itemContent}</li>`)
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      if (!inList || listType !== 'ol') {
        if (inList) htmlLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        htmlLines.push('<ol class="doc-list">')
        inList = true
        listType = 'ol'
      }
      const itemContent = formatInline(line.replace(/^\d+\.\s/, ''))
      htmlLines.push(`<li>${itemContent}</li>`)
      continue
    }

    if (inList) {
      htmlLines.push(listType === 'ul' ? '</ul>' : '</ol>')
      inList = false
    }

    // Empty line
    if (!line) {
      continue
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      htmlLines.push('<hr class="doc-rule" />')
      continue
    }

    // Headings
    if (line.startsWith('# ')) {
      htmlLines.push(`<h1 class="doc-h1">${formatInline(line.slice(2))}</h1>`)
      continue
    }
    if (line.startsWith('## ')) {
      htmlLines.push(`<h2 class="doc-h2">${formatInline(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('### ')) {
      htmlLines.push(`<h3 class="doc-h3">${formatInline(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith('#### ')) {
      htmlLines.push(`<h4 class="doc-h4">${formatInline(line.slice(5))}</h4>`)
      continue
    }

    // Regular paragraph
    htmlLines.push(`<p class="doc-p">${formatInline(line)}</p>`)
  }

  if (inTable) htmlLines.push('</tbody></table>')
  if (inList) htmlLines.push(listType === 'ul' ? '</ul>' : '</ol>')

  return htmlLines.join('\n')
}

function formatInline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[\s?\]/g, '<span class="checkbox-box">☐</span>')
    .replace(/\[x\]/gi, '<span class="checkbox-box checked">☑</span>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function generatePrintableDocumentHtml(
  title: string,
  docKey: DocumentKey,
  markdownContent: string,
  client: ClientInfo
): string {
  const renderedHtml = renderMarkdownToHtml(markdownContent)
  const isArabic = /[\u0600-\u06FF]/.test(markdownContent)

  return `<!DOCTYPE html>
<html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · webviewlabs (${client.company})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 12mm 12mm 12mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 24px;
      background-color: #f2efe8;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #171717;
      line-height: 1.6;
    }
    .doc-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #171717;
      box-shadow: 8px 8px 0px #171717;
      overflow: hidden;
    }
    .doc-header {
      background: #171717;
      color: #f2efe8;
      padding: 28px 36px;
      border-bottom: 4px solid #b52d20;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .doc-brand {
      display: inline-block;
      background: #f2efe8;
      color: #171717;
      font-family: 'DM Mono', monospace;
      font-weight: 700;
      font-size: 13px;
      padding: 6px 12px;
      letter-spacing: -0.04em;
      margin-bottom: 6px;
    }
    .doc-tagline {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      color: #aaa69d;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0;
    }
    .doc-ref-box {
      text-align: right;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      color: #aaa69d;
      line-height: 1.5;
    }
    .doc-ref-highlight {
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
    }
    .doc-body {
      padding: 40px 48px;
      background: #ffffff;
    }
    .client-badge-box {
      background: #f8f6f2;
      border: 1px solid #c5c0b5;
      padding: 16px 22px;
      margin: 0 0 28px 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 14px;
    }
    .client-badge-item label {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
      color: #5d5a54;
      display: block;
      margin-bottom: 2px;
    }
    .client-badge-item strong {
      font-weight: 700;
      font-size: 14px;
      color: #171717;
    }
    .doc-h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      color: #171717;
      margin: 0 0 16px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #171717;
    }
    .doc-h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #171717;
      margin: 28px 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #e8e3d9;
    }
    .doc-h3 {
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #b52d20;
      margin: 20px 0 8px 0;
      font-weight: 700;
    }
    .doc-p {
      font-size: 14px;
      color: #2b2b2b;
      margin: 0 0 10px 0;
      line-height: 1.7;
    }
    .doc-rule {
      border: 0;
      height: 1px;
      background: #e8e3d9;
      margin: 24px 0;
    }
    .doc-list {
      margin: 0 0 16px 0;
      padding-left: 20px;
      font-size: 14px;
      color: #2b2b2b;
    }
    .doc-list li {
      margin-bottom: 6px;
      line-height: 1.6;
    }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 13px;
    }
    .doc-table th {
      background: #171717;
      color: #f2efe8;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 14px;
      text-align: left;
      border: 1px solid #171717;
    }
    .doc-table td {
      padding: 12px 14px;
      border: 1px solid #e8e3d9;
      background: #fcfbfa;
      color: #171717;
    }
    .doc-table tbody tr:last-child td {
      background: #f2efe8;
      font-weight: 700;
      border-bottom: 2px solid #171717;
    }
    code {
      font-family: 'DM Mono', monospace;
      background: #e8e3d9;
      padding: 2px 6px;
      font-size: 12px;
    }
    .checkbox-box {
      font-family: monospace;
      font-size: 14px;
      margin-right: 6px;
      color: #b52d20;
    }
    .doc-footer {
      background: #171717;
      color: #aaa69d;
      padding: 22px 36px;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      text-align: center;
      line-height: 1.6;
      border-top: 3px solid #b52d20;
    }
    .doc-footer a {
      color: #f2efe8;
      text-decoration: none;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 36px;
      padding-top: 24px;
      border-top: 2px solid #171717;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
    }
    .signature-line {
      border-bottom: 1px solid #171717;
      height: 40px;
      margin-bottom: 6px;
    }

    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
      }
      .doc-container {
        border: 1px solid #171717 !important;
        box-shadow: none !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    
    <!-- Top Studio Header -->
    <div class="doc-header">
      <div>
        <div class="doc-brand">WV / webviewlabs</div>
        <p class="doc-tagline">Digital Studio for Ambitious Brands · Cairo / Everywhere</p>
      </div>
      <div class="doc-ref-box">
        <div class="doc-ref-highlight">${title}</div>
        <div>Document Ref: WV-${client.id}-${docKey.toUpperCase()}</div>
        <div>Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
      </div>
    </div>

    <!-- Body -->
    <div class="doc-body">
      <!-- Client Information Box -->
      <div class="client-badge-box">
        <div class="client-badge-item">
          <label>Client Name</label>
          <strong>${client.name}</strong>
        </div>
        <div class="client-badge-item">
          <label>Company / Brand</label>
          <strong style="color: #b52d20;">${client.company}</strong>
        </div>
        <div class="client-badge-item">
          <label>Phone</label>
          <strong>${client.phone}</strong>
        </div>
        <div class="client-badge-item">
          <label>Email</label>
          <strong>${client.email || 'Not provided'}</strong>
        </div>
      </div>

      <!-- Rendered Markdown Body -->
      <div class="markdown-content">
        ${renderedHtml}
      </div>
    </div>

    <!-- Studio Footer -->
    <div class="doc-footer">
      <div style="font-weight: bold; color: #f2efe8; margin-bottom: 4px;">webviewlabs · Digital products with a point of view.</div>
      <div>Cairo, Egypt · <a href="https://webviewlabs.vercel.app">webviewlabs.vercel.app</a> · <a href="mailto:hello@webviewlabs.com">hello@webviewlabs.com</a></div>
    </div>

  </div>

  <script>
    window.onload = function() {
      // Auto trigger print when opened in isolated popup
      if (window.location.search.includes('autoprint=true')) {
        setTimeout(function() { window.print(); }, 400);
      }
    };
  </script>
</body>
</html>`
}

export async function downloadDocumentAsPdfFile(
  title: string,
  docKey: DocumentKey,
  content: string,
  client: ClientInfo,
  filename: string
): Promise<void> {
  // Ensure html2pdf library is dynamically available
  if (!(window as any).html2pdf) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[src*="html2pdf"]')
      if (existing) {
        if ((window as any).html2pdf) {
          resolve()
          return
        }
        existing.addEventListener('load', () => resolve())
        return
      }
      const script = document.createElement('script')
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load html2pdf'))
      document.head.appendChild(script)
    })
  }

  // Generate complete styled printable HTML
  const fullHtml = generatePrintableDocumentHtml(title, docKey, content, client)

  // Create temporary container positioned at (0,0) with z-index behind the page
  const tempWrapper = document.createElement('div')
  tempWrapper.id = 'pdf-render-temp-wrapper'
  tempWrapper.style.position = 'fixed'
  tempWrapper.style.top = '0px'
  tempWrapper.style.left = '0px'
  tempWrapper.style.width = '794px'
  tempWrapper.style.minHeight = '1000px'
  tempWrapper.style.zIndex = '-9999'
  tempWrapper.style.opacity = '1'
  tempWrapper.style.backgroundColor = '#ffffff'
  tempWrapper.style.pointerEvents = 'none'
  tempWrapper.style.margin = '0'
  tempWrapper.style.padding = '0'

  // Extract body and style from full HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(fullHtml, 'text/html')
  const styles = doc.querySelectorAll('style, link')
  const bodyContent = doc.body.innerHTML

  styles.forEach((s) => tempWrapper.appendChild(s.cloneNode(true)))
  
  const innerDiv = document.createElement('div')
  innerDiv.innerHTML = bodyContent
  tempWrapper.appendChild(innerDiv)

  document.body.appendChild(tempWrapper)

  const opt = {
    margin: [6, 6, 6, 6],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 820,
      backgroundColor: '#ffffff',
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  try {
    // Wait a brief moment for fonts and images to compute layout
    await new Promise((r) => setTimeout(r, 100))
    await (window as any).html2pdf().set(opt).from(tempWrapper).save()
  } finally {
    if (document.body.contains(tempWrapper)) {
      document.body.removeChild(tempWrapper)
    }
  }
}



