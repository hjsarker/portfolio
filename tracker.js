/* Opt-in-only visitor email notifications. Never contacts an analytics service before consent. */
(() => {
  "use strict";
  const cfg = window.PORTFOLIO_TRACKER_CONFIG;
  if (!cfg || !cfg.enabled || !/^https:\/\/[^/]+\/v1\/visit$/.test(cfg.endpoint)) return;
  const KEY = "hjsarker_portfolio_visitor_consent";
  const OWNER = "hjsarker_portfolio_owner_exclusion";
  const SESSION = "hjsarker_portfolio_session_notified";
  const privacyUrl = cfg.privacyUrl || "./privacy.html";

  function safeGet(store, key) { try { return store.getItem(key); } catch (_) { return null; } }
  function safeSet(store, key, value) { try { store.setItem(key, value); return true; } catch (_) { return false; } }
  function excluded() { return safeGet(localStorage, OWNER) === "true" || navigator.globalPrivacyControl === true; }
  const query = new URLSearchParams(location.search);
  if (query.get("portfolio_owner") === "1") {
    safeSet(localStorage, OWNER, "true");
    query.delete("portfolio_owner");
    const next = location.pathname + (query.toString() ? "?" + query : "") + location.hash;
    history.replaceState(null, "", next);
    return;
  }
  if (excluded()) return;

  async function sendVisit() {
    if (safeGet(sessionStorage, SESSION) === cfg.policyVersion) return;
    let referrer = "";
    try { referrer = document.referrer ? new URL(document.referrer).hostname.slice(0, 100) : ""; } catch (_) {}
    try {
      const response = await fetch(cfg.endpoint, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          page: location.pathname.slice(0, 140),
          referrer: referrer,
          policyVersion: cfg.policyVersion
        })
      });
      if (response.ok) safeSet(sessionStorage, SESSION, cfg.policyVersion);
    } catch (_) { /* Notifications are best-effort; never break the portfolio. */ }
  }

  function saveChoice(allow) {
    safeSet(localStorage, KEY, JSON.stringify({allow, version: cfg.policyVersion, at: new Date().toISOString()}));
    document.getElementById("portfolio-consent-banner")?.remove();
    if (allow) sendVisit();
  }

  function makeBanner() {
    document.getElementById("portfolio-consent-banner")?.remove();
    const region = document.createElement("section");
    region.id = "portfolio-consent-banner";
    region.className = "portfolio-consent-banner";
    region.setAttribute("aria-label", "Optional visitor notification settings");
    region.innerHTML = `<h3>Privacy preferences</h3>
      <p>May I notify the portfolio owner about this visit? If you agree, your IP address, approximate location, network organisation, browser and referral source may be sent via Cloudflare and Google email. This is optional.</p>
      <p class="portfolio-consent-more"><a href="${privacyUrl}">Read the privacy notice</a></p>
      <div class="portfolio-consent-actions"><button type="button" data-choice="no">No, thanks</button><button type="button" data-choice="yes">Allow visit notification</button></div>`;
    region.querySelector('[data-choice="no"]').addEventListener("click", () => saveChoice(false));
    region.querySelector('[data-choice="yes"]').addEventListener("click", () => saveChoice(true));
    document.body.appendChild(region);
  }

  window.PortfolioVisitorTracking = Object.freeze({
    openPreferences: makeBanner,
    revoke: () => saveChoice(false)
  });
  const choicesButton = document.getElementById("portfolio-privacy-choices");
  if (choicesButton) {
    choicesButton.hidden = false;
    choicesButton.addEventListener("click", makeBanner);
  }
  const saved = safeGet(localStorage, KEY);
  if (saved) {
    try {
      const choice = JSON.parse(saved);
      if (choice.version === cfg.policyVersion && choice.allow === true) { sendVisit(); return; }
      if (choice.version === cfg.policyVersion && choice.allow === false) return;
    } catch (_) { /* show choices below */ }
  }
  makeBanner();
})();
