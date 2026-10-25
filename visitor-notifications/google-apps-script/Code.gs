/**
 * Deploy as a Web app:
 * - Execute as: Me
 * - Access: Anyone (backend requires DELIVERY_TOKEN in POST body).
 * Script properties: PORTFOLIO_SHARED_TOKEN, PORTFOLIO_RECIPIENT_EMAIL.
 */
function doGet() {
  return ContentService.createTextOutput('Portfolio notification receiver');
}

function doPost(e) {
  function json(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
  var settings = PropertiesService.getScriptProperties();
  var secret = settings.getProperty('PORTFOLIO_SHARED_TOKEN');
  var to = settings.getProperty('PORTFOLIO_RECIPIENT_EMAIL');
  if (!secret || secret.length < 32 || !to) return json({ ok: false });
  var data;
  try { data = JSON.parse((e && e.postData && e.postData.contents) || ''); }
  catch (_) { return json({ ok: false }); }
  if (!data || typeof data.token !== 'string' || data.token !== secret) return json({ ok: false });
  var r = data.record;
  if (!r || typeof r !== 'object' || r.permission !== '2026-10-25') return json({ ok: false });
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (_) { return json({ ok: false }); }
  try {
    var cache = CacheService.getScriptCache();
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, secret + String(r.ip) + ':' + String(r.browser));
    var key = 'visit_' + Utilities.base64EncodeWebSafe(digest).slice(0, 36);
    if (cache.get(key)) return json({ ok: true, duplicate: true });
    if (MailApp.getRemainingDailyQuota() < 1) return json({ ok: false, quota: true });
    // Cap independently at 80 alerts/day to leave room for other personal Apps Script mail.
    var day = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyyMMdd');
    var countKey = 'alert_count_' + day;
    var count = Number(settings.getProperty(countKey) || 0);
    if (count >= 80) return json({ ok: false, quota: true });
    var when = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd MMM yyyy, HH:mm:ss (Europe/Berlin)');
    function clean(value, max) { return String(value == null ? 'Unknown' : value).replace(/[\r\n\x00-\x1f]/g, ' ').slice(0, max); }
    var body = [
      'A visitor opted in to a notification on your public portfolio.',
      '',
      'Time: ' + when,
      'IP address: ' + clean(r.ip, 60),
      'Approximate city: ' + clean(r.city, 100),
      'Region: ' + clean(r.region, 100),
      'Country: ' + clean(r.country, 20),
      'Network organisation: ' + clean(r.network, 160),
      'ASN: ' + clean(r.asn, 15),
      'Referring website: ' + clean(r.source, 120),
      'Page: ' + clean(r.page, 150),
      'Browser: ' + clean(r.browser, 180),
      '',
      'This information is approximate. A network organisation is not evidence of the visitor\'s employer.',
      'Handle full IP addresses as personal information. Retain these alerts only as needed.'
    ].join('\n');
    MailApp.sendEmail(to, 'Portfolio visitor (opted in) · ' + clean(r.country, 20), body);
    settings.setProperty(countKey, String(count + 1));
    cache.put(key, '1', 1200);
    return json({ ok: true });
  } catch (_) {
    return json({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

// After entering the Script Properties, run this function once in the editor to authorize MailApp.
// It sends a setup confirmation to the address in PORTFOLIO_RECIPIENT_EMAIL.
function authorizeAndSendTest() {
  var p = PropertiesService.getScriptProperties();
  var to = p.getProperty('PORTFOLIO_RECIPIENT_EMAIL');
  if (!to || !(p.getProperty('PORTFOLIO_SHARED_TOKEN') || '').length) throw new Error('Set Script Properties first');
  MailApp.sendEmail(to, 'Portfolio visit notifications: setup test',
    'Your Google Apps Script can send notifications. The site will remain disabled until you configure the Worker endpoint and enable it in tracker-config.js.');
}
