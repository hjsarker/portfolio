# Hillol Sarker Jogesh | Professional portfolio

A responsive, static portfolio showcasing experience in IT operations, application support, business intelligence, data quality, process governance, and six selected live projects, including the interactive 3D Solar System explorer **Cosmic Atlas**.

## Live website

**https://hjsarker.github.io/portfolio/**

The site includes a custom HTML Canvas particle network that drifts and responds to mouse movement, with mobile and reduced-motion accommodations.

## Featured interactive 3D project

**[Cosmic Atlas](https://hjsarker.github.io/cosmic-atlas/)** is an independent Three.js/WebGL Solar System explorer with cinematic planet navigation, attributed planetary textures, NASA/JPL orbital data, an ESA Gaia sky background, and HYG catalog stars. The [public GitHub source](https://github.com/hjsarker/cosmic-atlas) includes scientific-data attribution and automated browser tests.

The project is the second featured card in the portfolio's Work section and is included in the new **3D & interactive** filter. The section now includes six live projects.

## Interactive work experience

The **Experience** timeline retains all six employment entries, but shows **Explore my work** links only for the current RWE role, TK Elevator and HRC Technologies Limited. HRC includes a working interactive case study:

- A simplified, selectable conceptual environment for telecom billing, Red Hat application services, Sun/Solaris context, Oracle/Microsoft SQL investigation, and CDR checks.
- A dedicated interactive **Workplace IT** view featuring employee onboarding and offboarding, desktop/laptop support, LAN and Wi-Fi, IT equipment inventory, printers, meeting rooms and user support.
- A clear division between the author's local network/endpoint administration and billing application support, versus specialist-owned Solaris hosting, database platform administration and core network infrastructure.
- Two reconstructed troubleshooting walkthroughs with selectable diagnosis and verification stages: a telecom billing discrepancy and an office wired/Wi-Fi connectivity problem.

RWE and TK Elevator have clearly labeled **PREVIEW** placeholders. Vaillant Group, E.ON Digital Technology and YES Private Ltd. retain their ordinary timeline descriptions without interactive buttons. No unverified architecture or case studies are presented.

The interactive data and page behavior are in `experience-explorer.js`. Styles are in `design.css`, and the corresponding trigger buttons and dialog markup are in `index.html`. To develop a new employer walkthrough, replace its preview with a verified, sanitized explanation of the user's work rather than adding speculative system diagrams.

The HRC diagram is a conceptual educational reconstruction, **not** a verified internal production topology or a company-authorized publication. Do not add real hostnames, IP addresses, passwords, client billing data, privileged configurations, or unapproved internal architecture details.

Interactive UI checks are in `tests/experience-smoke.cjs` and run through `.github/workflows/experience-qa.yml`.

## Contents

- `index.html`: Portfolio content, interactive JavaScript, project links and SEO metadata, with base styles.
- `design.css`: Apple-inspired black, silver and white visual design, including the responsive layout.
- Project cards request screenshots from WordPress.com's public mShots service for the actual linked websites; a branded fallback appears if a thumbnail cannot load. Previews may be cached or temporarily unavailable.\n- `favicon.svg`: Website icon.
- `robots.txt` and `sitemap.xml`: Search engine discovery.
- `.nojekyll`: Serves site content directly without Jekyll processing.

No backend, external build tools, trackers, or hosting service beyond GitHub Pages are required.

## Publishing

Open **Settings → Pages**, set **Build and deployment → Source: Deploy from a branch**, select **main** and **/(root)**, then save.

Your published URL should be **https://hjsarker.github.io/portfolio/**. Publishing can take a few minutes. Until Pages is enabled, the repository's files exist but the website may not be reachable.

## Updating content

Portfolio content is in `index.html`, and the visual theme is in `design.css`. To add another public project, add a card using the existing `.project-card` structure. Only link published live demos. The displayed project count, numbering, category filters, and stylesheet cache key should be kept in sync.

Professional experience and education are based on the approved master profile. Project descriptions and URLs are based on public repository documentation. The project visuals are illustrative and are not screenshots or actual live dashboard data.

Collective AI Tools is labeled as an open-source collaboration, not an individually owned product.

## Notes

- This page does not include private HireDraftAI source code. Its repository link points to a public case study.
- Particle motion responds to reduced-motion settings.
- Contact is handled with ordinary email and LinkedIn links, without collecting visitor data.
\n## Optional visitor email notifications\n\nSource and setup instructions: [`visitor-notifications/README.md`](visitor-notifications/README.md). The visitor notifications are **OFF by default** and require personal setup in Google Apps Script and Cloudflare before activation. Consent is required before a personal-data notification request.\n