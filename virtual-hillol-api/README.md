# Virtual Hillol API

Small serverless backend for the existing [GitHub Pages portfolio](https://hillol.de/). The browser UI stays on GitHub Pages. This directory is the Vercel project root.

## Endpoints

- `GET /api/health` returns `mode: "awaiting_key"` until OpenRouter is configured, otherwise `mode: "live"`.
- `POST /api/chat` accepts `{"messages":[{"role":"user","content":"..."}]}` from the exact GitHub Pages origin. Returns `{"reply":"...", "mode":"live"}` when configured.

The verified model is `openai/gpt-6-luna`, OpenRouter's official slug. Output capped at 650 tokens per request. Conversation length is bounded. CORS accepts the portfolio origins `https://hillol.de` and `https://www.hillol.de`, the previous `https://hjsarker.github.io` origin for compatibility, and localhost for QA. Rate limiting is best effort *per serverless instance*, and **is not a hard quota**. Client-supplied Origin headers can be forged; this service is public.

## Current project

Workspace: **hjsarker's projects**. Project: **virtual-hillol-api**. Production domain: `https://virtual-hillol-api-xi.vercel.app`. Git repository: `hjsarker/portfolio`, main branch; Root Directory: `virtual-hillol-api`. Vercel Authentication was disabled for this project's public API, which still rejects unsupported browser origins. The root webpage is only a status page; the actual assistant lives on GitHub Pages.

## Setup

Create a Vercel project with the GitHub repo `hjsarker/portfolio` and **Root Directory** `virtual-hillol-api`.

In Vercel dashboard go to the project > Settings > Environment Variables. Add **OPENROUTER_API_KEY** as an encrypted/sensitive variable for Production (and Preview if desired). Don't paste the key into chat, GitHub, the repository, a Vercel build command or the public frontend.

**After adding the environment variable, redeploy the latest production deployment** so the Vercel function receives it. Check `/api/health`; it should show `mode: "live"`. The portfolio automatically switches to live AI mode when the health check is ready.

This repository never stores the private original CV or master JSON in the backend. It retrieves only the existing **public, sanitized career facts** from `https://hillol.de/data/virtual-hillol-knowledge.json`. That document is public and may be cached for up to 10 minutes per function instance.

## Cost and privacy

This project is intended to run within Vercel Hobby's included free usage limits for a personal, noncommercial portfolio. Hobby is **not** appropriate for commercial SaaS usage. The user controls the independent **$2/month OpenRouter key guardrail**. Vercel itself does not enforce that OpenRouter budget.

Chat content (including pasted job descriptions) is transmitted to Vercel and OpenRouter in live mode. Avoid pasting private documents or confidential job information. The server does not deliberately persist raw chat messages or user IPs to a database. Vercel/OpenRouter may process operational request information under their policies.

No hard claim that the assistant is perfect: it may make mistakes, especially about immigration. The career facts are a vetted reference, but only the responsible foreigner's authority decides residence permit matters.

## Developer test

`node --test tests/*.test.cjs`

## Security notes

- Never expose `OPENROUTER_API_KEY` through GitHub Pages source, client JavaScript, public URLs or error messages.
- The public API is protected by request size limits, response token limits, a narrow CORS policy and per-instance throttling. It **can still be reached by nonbrowser clients**; keep the $2 OpenRouter guardrail active.
- No fallback to higher-cost models.
- Set reasonable Vercel project protection/WAF where available.
- Avoid sending pasted job descriptions that contain sensitive personal information.

