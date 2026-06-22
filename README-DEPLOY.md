# Gestiones Eléctricas — Sitio web (estático)

Sitio estático (HTML + CSS + JS + assets, scroll 3D con Three.js/GSAP). No requiere build.

## Deploy
- **Cualquier host estático:** servir la raíz del repo (`index.html`).
- **Vercel:** New Project → Framework Preset **Other** → Build command: *(vacío)* → Output Directory: `.` (raíz). Sin variables de entorno.
- **Netlify:** Publish directory = `.`, sin build command.

Incluye `robots.txt` y `sitemap.xml`. Rutas relativas (`assets/`, `css/`, `js/`).
