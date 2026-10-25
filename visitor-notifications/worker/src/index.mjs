/** Cloudflare Worker: location-enriched, consent-gated email notification forwarding. */
const ALLOWED_ORIGIN = 'https://hjsarker.github.io';
const allowedFields = new Set(['consent', 'page', 'referrer', 'policyVersion']);
const recent = new Map(); // best effort per-isolate, complemented by Apps Script CacheService

function reply(status, data, origin) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  if (origin === ALLOWED_ORIGIN) {
    headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function redactHost(value) {
  if (!value || typeof value !== 'string') return '';
  const host = value.trim().toLowerCase().slice(0, 100);
  return /^[a-z0-9.-]{1,100}$/.test(host) ? host : '';
}

async function hash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    if (request.method === 'GET' && url.pathname === '/health') {
      return reply(200, { online: true, configured: Boolean(env.GAS_WEBAPP_URL && env.DELIVERY_TOKEN) }, origin);
    }
    if (url.pathname !== '/v1/visit') return reply(404, { error: 'not_found' }, origin);
    if (origin !== ALLOWED_ORIGIN) return reply(403, { error: 'origin_not_allowed' }, origin);
    if (request.method === 'OPTIONS') { const h = reply(200, {}, origin).headers; return new Response(null, {status: 204, headers: h}); }
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' }, origin);
    if (env.TRACKING_ENABLED !== 'true' || !env.GAS_WEBAPP_URL || !env.DELIVERY_TOKEN || !env.HASH_SALT) {
      return reply(503, { error: 'not_configured' }, origin);
    }
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415, { error: 'content_type' }, origin);
    if (Number(request.headers.get('Content-Length') || 0) > 1500) return reply(413, { error: 'too_large' }, origin);
    let data;
    try { data = await request.json(); } catch (_) { return reply(400, { error: 'invalid_json' }, origin); }
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(k => !allowedFields.has(k))) {
      return reply(400, { error: 'invalid_body' }, origin);
    }
    if (JSON.stringify(data).length > 1500 || data.consent !== true || data.policyVersion !== '2026-10-25') {
      return reply(400, { error: 'consent_required' }, origin);
    }
    if (typeof data.page !== 'string' || !data.page.startsWith('/portfolio') || data.page.length > 140) {
      return reply(400, { error: 'page_invalid' }, origin);
    }
    const ua = (request.headers.get('User-Agent') || '').slice(0, 170);
    if (/bot|crawler|spider|headless|lighthouse|preview|facebookexternalhit|linkedinbot/i.test(ua)) {
      return reply(200, { ok: true, ignored: 'automation' }, origin);
    }
    const ip = (request.headers.get('CF-Connecting-IP') || '').slice(0, 48);
    const cf = request.cf || {};
    const record = {
      time: new Date().toISOString(),
      ip: ip || 'unavailable',
      city: typeof cf.city === 'string' ? cf.city.slice(0, 90) : 'unavailable',
      region: typeof cf.region === 'string' ? cf.region.slice(0, 90) : '',
      country: typeof cf.country === 'string' ? cf.country.slice(0, 10) : 'unavailable',
      asn: Number(cf.asn || 0),
      network: typeof cf.asOrganization === 'string' ? cf.asOrganization.slice(0, 140) : 'unavailable',
      source: redactHost(data.referrer),
      page: data.page,
      browser: ua,
      permission: data.policyVersion
    };
    // Temporarily deduplicate same IP/browser across 20 minutes; no personal identifier is persisted.
    const fingerprint = await hash(`${env.HASH_SALT}:${ip}:${ua}:${Math.floor(Date.now() / 1200000)}`);
    if (recent.get(fingerprint) > Date.now()) return reply(200, { ok: true, duplicate: true }, origin);
    if (recent.size > 500) for (const [key, expiry] of recent) if (expiry <= Date.now()) recent.delete(key);
    recent.set(fingerprint, Date.now() + 1200000);
    try {
      const endpoint = new URL(env.GAS_WEBAPP_URL);
      if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' || !endpoint.pathname.endsWith('/exec')) {
        return reply(503, { error: 'backend_invalid' }, origin);
      }
      const response = await fetch(endpoint.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: JSON.stringify({ token: env.DELIVERY_TOKEN, record }),
        redirect: 'follow'
      });
      if (!response.ok) throw new Error('Delivery rejected');
      const result = await response.text();
      if (!result.includes('"ok":true')) throw new Error('Unexpected delivery response');
      return reply(200, { ok: true }, origin);
    } catch (_) {
      recent.delete(fingerprint);
      return reply(502, { error: 'delivery_unavailable' }, origin);
    }
  }
};
