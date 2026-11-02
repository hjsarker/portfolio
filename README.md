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

## Virtual Hillol recruiter chatbot

The portfolio includes **Virtual Hillol**, a first-person professional career assistant **in transparent preview mode**, using a reviewed, public-only career knowledge base at `data/virtual-hillol-knowledge.json`. The user provided a master career-profile JSON, a current two-page CV, an AI-specific profile update and a direct clarification about their current student residence permit.

The public knowledge was curated to include:
- all six employers and responsibilities, with evidence and boundaries;
- IT support, infrastructure, Power BI, SQL, reporting, Databricks, migration/governance and independent applied-AI project work;
- completed education and credentials, with the M.Sc. still ongoing and AZ-900/ITIL learning items not misrepresented as formal exam passes;
- six portfolio projects and their ownership limitations;
- truthful first-person residence-permit wording: student status, ZAB bachelor comparability, user-reported foreigners-authority guidance, potential employment-permit application on a suitable contract, and a non-guaranteed approximate Dortmund processing estimate.

**Security and privacy:** The complete original JSON/CV/summary are *not* checked into this repository. The published knowledge JSON is deliberately scrubbed of the user's home address, date of birth, religion, certificate and registration identifiers, family information, and confidential employer architecture. Be aware: the curated knowledge file is **public** on GitHub Pages; it is not a private server database.

The UI uses `virtual-hillol.js`, with styling in `design.css` and a floating chat launcher in `index.html`. It supports prepared interview questions and a **deterministic, rule-based** preliminary job-description comparison, but it is **not an AI model** and cannot answer arbitrary questions reliably. Messages stay in the visitor's browser tab and are neither uploaded nor retained by this preview. The project is not collecting recruiters' names or CVs.

**Vercel backend installed:** The source is in `virtual-hillol-api/`. The Vercel project `virtual-hillol-api` is deployed in the user's **hjsarker's projects** workspace and exposes `https://virtual-hillol-api-xi.vercel.app/api/health` and `/api/chat`. The root URL has a small status homepage. The frontend checks the health endpoint and activates live AI automatically if an OpenRouter credential is configured. Until then it stays in clearly labeled prepared-answer preview mode.

**Remaining user step:** In the Vercel project settings, add a *sensitive* or *encrypted* Production environment variable called `OPENROUTER_API_KEY` and deploy the production project again. Never commit or share that key. The server uses OpenRouter's verified `openai/gpt-6-luna` model. It caps messages, response tokens and content lengths, enforces narrow CORS, and does best-effort per-instance throttling; the user's $2/month OpenRouter guardrail is still the primary spend limit. Once configured, live conversations and pasted job descriptions are transmitted to Vercel and OpenRouter. Never paste confidential material into the chat.

**Deployment:** This Vercel project is Git-linked to `hjsarker/portfolio`, production branch `main`, root directory `virtual-hillol-api`. Vercel deploys backend updates when the repository changes. The earlier API-only deployment in a different Vercel workspace is not used by the portfolio.

The preview and frontend integration are checked in desktop/mobile browser QA via `tests/experience-smoke.cjs`, and backend request handling is tested with `node --test virtual-hillol-api/tests/*.test.cjs`.

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