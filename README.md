# Hillol Sarker Jogesh | Professional Portfolio

**Live site:** [hillol.de](https://hillol.de/)

A recruiter-facing portfolio covering IT operations, application support, business intelligence, data quality and practical software projects. Built as a static, responsive website and published through GitHub Pages.

## Explore the site

The homepage leads with a shorter introduction and four selected projects. Visitors can reveal the other three projects, filter by professional area, inspect work experience or open technical case studies without first leaving the portfolio.

**Technical case studies**

- [OpsLens: incident analytics, SQL and SLA reporting](https://hillol.de/projects/opslens/)
- [Germany Power Pulse: hourly energy data and completeness checks](https://hillol.de/projects/germany-power-pulse/)
- HRC Technologies interactive walkthrough, available from the Experience section of the homepage. It uses sanitized illustrations and does not publish employer records.

**Seven featured public projects**

Germany Power Pulse, Auto Pulse, OpsLens, HireDraftAI, BahnPulse, Cosmic Atlas and AI: The Long Road to Now. The collaboration section lists Collective AI Tools separately. The portfolio does not include private product source code.

## Implementation

- `index.html` and `design.css`: Single-page main portfolio and interactive project filters.
- `case-study.css` and `projects/*/index.html`: Dedicated accessible, source-grounded technical case studies.
- `assets/previews/`: Locally hosted screenshots from publicly accessible project pages. The OpsLens screenshot comes from its published repository documentation.
- `assets/portrait.webp`: Portrait used in the header and enlarged-image dialog.
- `virtual-hillol.js` and `data/virtual-hillol-knowledge.json`: Optional recruiter chatbot UI and reviewed public career information.
- `experience-explorer.js`: Interactive, sanitized HRC work walkthrough.
- `scripts/capture-project-previews.cjs`: Reproducible screenshot and social-card generation.
- `share-card.html` and `assets/social/portfolio-share.jpg`: Social sharing preview built from the approved portrait and authored positioning.
- `sitemap.xml`, `robots.txt`, `CNAME`: Search and custom domain settings.

The website does not publish a generic CV, because CVs are tailored to individual applications.

## Run locally

Serve the repository root over HTTP, rather than opening `index.html` as a local file:

```bash
python3 -m http.server 8765
```

Open `http://localhost:8765/`. The project uses plain HTML, CSS and JavaScript, with no frontend build pipeline.

## Tests and deployment

GitHub Pages publishes from `main` at [hillol.de](https://hillol.de/). The original GitHub Pages URL remains part of the site's redirect configuration.

- [Portfolio browser tests](https://github.com/hjsarker/portfolio/actions/workflows/experience-qa.yml) cover responsive behavior, real project assets, project filters, navigation, the HRC walkthrough, the photo dialog and Virtual Hillol invitation behavior.
- [Screenshot capture workflow](https://github.com/hjsarker/portfolio/actions/workflows/capture-previews.yml) generates locally hosted previews from publicly accessible applications and the social card from the approved portrait.

The repository's visitor notification tracker is **disabled by default**. Chat functionality may use an external API when explicitly configured; avoid sharing private or employer-confidential information in a public demonstration.

## Content boundaries

Employment descriptions must remain consistent with documented work history. Technical claims in case studies link to public implementation files or methodology documentation. OpsLens uses synthetic records; no employer incident data is published. External project screenshots represent a capture at one point in time and are not guaranteed to show the latest application state.

---

For recruiter enquiries: [LinkedIn](https://www.linkedin.com/in/hjsarker/) · [Email](mailto:hjsarker@gmail.com) · [Portfolio](https://hillol.de/)
