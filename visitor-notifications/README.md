# Free visitor email notifications for hjsarker.github.io/portfolio

The visitor notification system is **implemented but OFF by default**. It is intentionally not connected to Cloudflare or Gmail until the site owner completes account-specific authorization, checks the privacy notice and explicitly turns it on.

Architecture:

```text
Visitor opt-in -> tracker.js -> Cloudflare Worker -> Google Apps Script -> hjsarker@gmail.com
                  (once/session)  (geo/IP/ASN)     (authenticated email)
```

## What it collects (only after affirmative opt-in)

- Visit time in German time
- Connecting IP address; country, approximate city and region if Cloudflare supplies them
- ASN and network organization (often an ISP, not an employer)
- User-agent and referring website hostname if available
- Page path (not full query string)

No names or exact GPS coordinates can be inferred. Anonymous visits that decline consent are not notified. A visitor who declines can still browse everything. Browser blockers, crawlers and VPNs may reduce accuracy.

## 1. Create the Google Apps Script recipient (one time)

1. Sign in as **hjsarker@gmail.com**, open https://script.google.com/home/projects/create and create a project named `Portfolio Visit Alerts`.
2. Replace its `Code.gs` with `google-apps-script/Code.gs` from this repository.
3. Open **Project Settings → Script Properties** and set:
   - `PORTFOLIO_RECIPIENT_EMAIL` = `hjsarker@gmail.com`
   - `PORTFOLIO_SHARED_TOKEN` = a newly generated random secret of at least 32 characters. Generate locally with `openssl rand -hex 32`. **Never commit or send the secret in a chat.**
4. Run the `authorizeAndSendTest` function once in the Apps Script editor, and approve the Google authorization for the app to send mail. Check that the test reaches Gmail.
5. Click **Deploy → New deployment → Web app**; choose **Execute as: Me** and **Who has access: Anyone**. Use the `/exec` URL, not `/dev`.
6. Keep the URL and secret privately: the Worker must know the URL and the identical token; the browser must never know either one.

## 2. Set up the free Cloudflare Worker

1. Create or sign in to a free Cloudflare account.
2. Install Node.js, then in this repository's `visitor-notifications/worker` directory run `npx wrangler login` and `npx wrangler deploy`.
3. Add the secrets (each command prompts for its value; never paste secrets into `wrangler.toml`):

   ```bash
   npx wrangler secret put GAS_WEBAPP_URL
   npx wrangler secret put DELIVERY_TOKEN
   npx wrangler secret put HASH_SALT
   ```

   - `GAS_WEBAPP_URL`: your deployed Apps Script `/exec` URL
   - `DELIVERY_TOKEN`: exactly the same secret as `PORTFOLIO_SHARED_TOKEN`
   - `HASH_SALT`: a separate random value from `openssl rand -hex 32`
4. If a secret update does not redeploy automatically, run `npx wrangler deploy` again.
5. Check `https://YOUR-WORKER.workers.dev/health` responds with `{"online":true,"configured":true}`. That endpoint does not submit a visit.
6. The Worker intentionally only accepts browser requests with `Origin: https://hjsarker.github.io`. It reads IP and geography from Cloudflare, never from browser JSON. Its source, not its secrets, is committed publicly.

**Important:** The Worker secret token protects the Gmail receiver, but the public notification endpoint can still receive spoofed requests from non-browser clients. Treat notifications as hints, not verified identities. Apps Script deduplicates by IP+user agent for 20 minutes and caps emails at 80/day, within Google's quota.

## 3. Review privacy and activate

1. Read and finalize `privacy.html` for your actual processing, retention and international-transfer circumstances. Review German/EU GDPR and TDDDG requirements, and whether a legal imprint is needed.
2. In the root `tracker-config.js`, set:

   ```javascript
   enabled: true,
   endpoint: "https://YOUR-WORKER.workers.dev/v1/visit",
   ```

3. Commit `tracker-config.js` to GitHub `main`; GitHub Pages redeploys automatically.
4. In an incognito browser, open https://hjsarker.github.io/portfolio/ and accept the analytics prompt to test. An email should arrive at hjsarker@gmail.com. Choosing “No, thanks” must not trigger a request.
5. To exclude your own browser, visit `https://hjsarker.github.io/portfolio/?portfolio_owner=1` **in that browser** once after activation. The page removes the query parameter and disables analytics locally. Repeat on other browsers or devices you use. Do not share this opt-out URL publicly.

## Turning it OFF

- Immediately: set `enabled: false` in root `tracker-config.js`, commit and wait for Pages to redeploy.
- At the server: set `TRACKING_ENABLED = "false"` in `worker/wrangler.toml`, redeploy the Worker.
- You can revoke individual browser consent using “Privacy choices” in the page footer.

## Limits and caveats

- Cloudflare Workers Free currently includes 100,000 requests/day, Google Apps Script personal quotas allow up to 100 email recipients/day. The app caps notifications at 80/day to leave margin. Limits and free service terms may change.
- This is not reliable bot detection, a CRM or evidence of a particular person/company visit. The network ASN may only identify Deutsche Telekom, Vodafone, or a cloud/VPN provider.
- Cloudflare often knows approximate city, but not always. It cannot guarantee a precise city or real employer.
- IP addresses in Gmail are personal data. Set and follow a real retention/deletion process (suggested max 30 days). Do not publicly expose alerts or share them casually.
- Owner exclusion relies on browser localStorage. Clearing storage, private mode or using a different browser requires setting it again.
- GitHub Pages static hosting does not give access to raw access logs. Only explicitly consenting visitors can trigger this optional notification flow.

## Test locally

```bash
node --test visitor-notifications/worker/test/worker.test.mjs
```

Do **not** insert fake secrets, deployed Google URLs, or IP addresses in this repository. The Google project and Cloudflare account require the owner's explicit login and authorization; simply merging code cannot activate them.
