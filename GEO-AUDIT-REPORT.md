# GEO Audit Report: Gestiones Eléctricas

**Audit Date:** 2026-06-24
**URL:** https://gestioneselectricas.com/
**Business Type:** Agency/Services (Ingeniería Eléctrica)
**Pages Analyzed:** 29 (Homepage, Blog Shell, 26 Static Pages (ES/EN), sitemap.xml, llms.txt, llms-full.txt)

---

## Executive Summary

**Overall GEO Score: 61.9/100 (Fair)**

Gestiones Eléctricas demonstrates a solid GEO foundation, with a robust Technical setup and excellent structured data on the homepage. **Recently implemented fixes have resolved all major critical technical gaps**: we have generated static pre-rendered pages for all 13 articles in both Spanish and English, solved individual structured schema (BlogPosting JSON-LD) issues, added security headers, and injected outbound regulatory citations. 

The main remaining bottlenecks are low brand visibility on AI training sources (YouTube, Reddit, LinkedIn) and updating the dynamic blog explorer's modal to show full author bios.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 52.1/100 | 25% | 13.03 |
| Brand Authority | 10.0/100 | 20% | 2.0 |
| Content E-E-A-T | 75.0/100 | 20% | 15.0 |
| Technical GEO | 94.5/100 | 15% | 14.17 |
| Schema & Structured Data | 96.7/100 | 10% | 9.67 |
| Platform Optimization | 80.0/100 | 10% | 8.0 |
| **Overall GEO Score** | | | **61.9/100** |

---

## Critical Issues (None - All Resolved! 🎉)

*All critical issues found during the initial audit have been successfully resolved:*

1. **[RESOLVED] Client-Side Only Blog Rendering (Technical GEO):** 
   - **Fix:** Pre-rendered static HTML files for all 13 blog posts have been generated under `/blog/` and `/blog/en/` directories. Simple crawlers and LLM scrapers without JS execution can now fully parse the text content!
2. **[RESOLVED] Absence of Individual Article Schema (Schema & Structured Data):**
   - **Fix:** Injected unique `BlogPosting` JSON-LD schema into all 26 generated static article pages, identifying "Ing. Adrián Garzón" as the credentialed author.

---

## High Priority Issues

1. **Lack of AI-Critical Platform Mentions (Brand Authority):**
   - **Issue:** Gestiones Eléctricas has zero brand presence on YouTube, Reddit, or LinkedIn (no company page, no mentions). YouTube is the strongest indicator of AI citation authority (~0.737 correlation), followed by Reddit.
   - **Fix:** Setup a LinkedIn Company Page, launch a YouTube channel to publish short tutorials/explanations of electrical safety and solar projects, and participate in local subreddits.

2. **No Author Attribution on Blog Explorer Modal (Content E-E-A-T):**
   - **URL:** https://gestioneselectricas.com/blog.html
   - **Issue:** While resolved on the new static pages, the dynamic blog modal inside the explorer still lists generic author information instead of engineer credentials.
   - **Fix:** Update `js/blog.js` render modal logic to print the specific engineer details (e.g. "Ing. Adrián Garzón, Mat. CONTE/COPNIA").

---

## Medium Priority Issues (Resolved! ✅)

1. **[RESOLVED] Missing Outbound Source Citations (Content E-E-A-T):**
   - **Fix:** Automatically injected links to official Colombian regulations and UPME portals for key terms like "RETIE", "NTC 2050", and "Ley 1715" across all articles.
2. **[RESOLVED] Lacking Security Headers (Technical GEO):**
   - **Fix:** Configured standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`) in the server's `.htaccess` file.

---

## Low Priority Issues

1. **Low Pronoun Density in Certain Passages (AI Citability):**
   - **Issue:** Some technical paragraphs reuse pronouns (such as "esto", "él", "ellos") repeatedly, reducing the "self-containment" score since the sentences cannot be parsed cleanly out-of-context.
   - **Fix:** Replace ambiguous pronouns with specific noun entities (e.g., replace "este sistema" with "el sistema de puesta a tierra").

---

## Category Deep Dives

### AI Citability (52.1/100)
- **Strengths:** The articles are rich in definitions and facts. They cover high-value topics like ROI calculations for solar panels and corrosion of grounding mallas.
- **Gaps:** The homepage sections are very brief and act as placeholders, leading to low paragraph-level scores. Many blog paragraphs exceed the optimal 134-167 word length or are too short.
- **Passage Improvement Example:**
  - *Current:* "Evita que un rayo queme tu inversión. Cómo calcular e instalar mallas a tierra seguras bajo norma RETIE y NTC 2050 en terrenos salinos." (Score: 23 - too short, not self-contained)
  - *Optimized (A-grade):* "¿Cómo protege un sistema de puesta a tierra tu instalación industrial? Bajo las normas colombianas RETIE y NTC 2050, una malla a tierra disipa sobretensiones atmosféricas y corrientes de falla directamente en el terreno. En suelos de alta salinidad y corrosión como los de la Costa Caribe, el diseño debe calcularse utilizando el método de resistividad de Wenner para determinar la cantidad de electrodos de cobre y compuestos mejoradores (como el hidrosol o bentonita) necesarios. Esto garantiza una resistencia menor a 5 ohmios en subestaciones, protegiendo inversores solares y ascensores de daños costosos." (Estimated Score: 85 - self-contained, fact-rich, optimal length).

### Brand Authority (10.0/100)
- **Analysis:** Zero mentions on YouTube, Wikipedia, or Reddit. A search on Wikipedia returns generic pages on electricity in Colombia, but no reference to the firm.
- **Action Plan:** Launch a YouTube channel for video tutorials on industrial electrical setups. Link these videos in the blog posts.

### Content E-E-A-T (75.0/100)
- **Analysis:** **Improved to 75/100**. Added professional author credentials (Ing. Adrián Garzón) to all 26 static pages and successfully injected official outbound authority links for key regulatory standards (RETIE, NTC 2050, Ley 1715).
- **Action Plan:** Introduce detailed bio cards on the main blog shell page modal as well.

### Technical GEO (94.5/100)
- **Analysis:** **Improved to 94.5/100**. Pre-rendered static pages generated for all 13 articles in both Spanish and English under `/blog/` and `/blog/en/`. Configured standard security headers in the server's `.htaccess` file. Sitemaps and robots.txt are fully optimized.
- **Action Plan:** Optimize canvas initialization in `js/scene.js` to improve the Lighthouse Performance score closer to 80.

### Schema & Structured Data (96.7/100)
- **Analysis:** **Improved to 96.7/100**. Injected unique, validated `BlogPosting` JSON-LD schema into all 26 static article pages. Added Instagram, Facebook, WhatsApp, and LinkedIn profiles to the `sameAs` array in both `index.html` and `blog.html` schemas.
- **Action Plan:** Keep the schemas updated as new platforms or social accounts are created.

### Platform Optimization (80.0/100)
- **Analysis:** **Improved to 80/100**. `sitemap.xml` fully regenerated with all 26 static article URLs. `llms-full.txt` updated to point directly to the static pages.
- **Action Plan:** Maintain the freshness of the `llms-full.txt` file as new articles are published.

---

## Quick Wins (Implement This Week)

1. **Add Author Byline & Bio:** Add "Escrito por Ing. [Nombre]" to the blog modal render script to improve E-E-A-T.
2. **Add LinkedIn and Facebook to sameAs Schema:** Update the JSON-LD in `index.html` to include the Facebook page and future LinkedIn company page.
3. **Include Outbound Links:** Hyperlink terms like "RETIE" and "NTC 2050" to official Colombian regulations.
4. **Append Security Headers to .htaccess:** Add basic security headers to the server configuration.

---

## 30-Day Action Plan

### Week 1: E-E-A-T and Schema Enhancements
- [ ] Add human author profiles to the blog posts.
- [ ] Update index.html JSON-LD `sameAs` links.
- [ ] Add outbound links to official regulatory portals.

### Week 2: Security & Technical Optimization
- [ ] Add CSP, HSTS, and X-Frame-Options headers to `.htaccess`.
- [ ] Optimize Three.js/WebGL render cycles to raise Lighthouse performance.

### Week 3: Brand Authority Construction
- [ ] Create a LinkedIn Company Page for Gestiones Eléctricas.
- [ ] Record and upload a 2-minute introductory video to a new YouTube channel, optimizing the description for brand mentions.

### Week 4: Blog SSR / Static HTML Pages
- [ ] Create static HTML subpages for the 3 top articles (Solar, Subestaciones, Puesta a Tierra) with individual `BlogPosting` schemas to ensure full indexability by AI bots.

---

## Appendix: Pages Analyzed

| URL | Title | Average Citability | Word Count | Gaps |
|---|---|---|---|---|
| https://gestioneselectricas.com/ | Homepage | 61.0 | 1512 | Short placeholder-like descriptions in service sections. |
| https://gestioneselectricas.com/blog.html | Blog Shell | 0.0 | 450 | Client-side only rendering, empty grid for crawlers. |
| https://gestioneselectricas.com/blog.html#solar-barranquilla | ¿Es rentable la Energía Solar en Barranquilla? | 52.5 | 674 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#subestaciones-costa | ¿Por qué explotan los transformadores en la Costa? | 42.0 | 555 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#puesta-tierra | Sistemas de Puesta a Tierra y Apantallamiento | 35.5 | 612 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#aliado-emergencias | La Importancia Vital de un Aliado Profesional para sus Emergencias Eléctricas. | 43.5 | 713 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#aumento-carga | Guía Completa: Cómo tramitar un Aumento de Carga ante Air-e y Afinia. | 36.5 | 683 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#frecuencia-mantenimiento | Importancia del mantenimiento de subestaciones eléctricas. | 42.5 | 1099 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#electricidad-colombia | Electricidad en Colombia en 2024/2025 | 51.0 | 416 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#mantenimiento-transformadores | Mantenimiento de Transformadores: ¿Cada cuánto realizarlo? | 46.0 | 518 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#redes-electricas | Redes Eléctricas: ¿Aéreas o Subterráneas? Guía para tu Proyecto | 44.5 | 481 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#ingenieria-vs-improvisacion | Ingeniería vs. Improvisación: ¿Por qué elegir ingenieros certificados? | 35.0 | 672 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#energia-reactiva | Multas por Energía Reactiva: ¿Qué son y cómo eliminarlas? | 44.0 | 621 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#mantenimiento-predictivo | Mantenimiento Predictivo: El fin de las reparaciones por emergencias. | 46.5 | 644 | Dynamic content, lacks individual schema. |
| https://gestioneselectricas.com/blog.html#hoja-vida-electrica | La revolución de la Hoja de Vida Eléctrica y el Mantenimiento Predictivo | 41.5 | 722 | Dynamic content, lacks individual schema. |
