import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projects = [
  { slug: 'hiredraftai', url: 'https://hiredraftai.com/', origin: 'hiredraftai.com', expected: /HireDraftAI/i },
  { slug: 'auto-pulse', url: 'https://german-auto-pulse.vercel.app/', origin: 'german-auto-pulse.vercel.app', expected: /Auto Pulse|Automotive|Vehicle|EV/i },
  { slug: 'germany-power-pulse', url: 'https://hjsarker.github.io/germany-power-pulse/', origin: 'hjsarker.github.io', expected: /Power Pulse|electricity|SMARD|Energy/i },
  { slug: 'collective-ai-tools', url: 'https://collectiveai.tools/', origin: 'collectiveai.tools', expected: /Collective|AI Tools|Explore/i },
];
const dir = resolve('assets/projects');
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
let saved = 0;
const failed = [];
for (const project of projects) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    console.log('Capturing:', project.slug, project.url);
    const response = await page.goto(project.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!response || response.status() >= 400) throw new Error('HTTP ' + (response?.status() ?? 'no response'));
    const landingUrl = new URL(page.url());
    if (landingUrl.hostname !== project.origin && !landingUrl.hostname.endsWith('.' + project.origin)) {
      throw new Error('Unexpected redirect to ' + landingUrl.hostname);
    }
    await page.waitForTimeout(3500);
    await page.evaluate(() => { window.scrollTo(0, 0); });
    const title = await page.title();
    const text = (await page.locator('body').innerText({ timeout: 8000 })).slice(0, 6000);
    if (/Vercel Authentication|Access Denied|Checking your browser|Just a moment|Application error/i.test(title + ' ' + text.slice(0, 500))) {
      throw new Error('Protected or error page: ' + title);
    }
    if (!project.expected.test(title + ' ' + text)) {
      throw new Error('Expected project content not found: ' + title + ' / ' + text.slice(0, 110));
    }
    // Real browser capture from each project's public URL, without reproducing or generating the UI.
    const capture = await page.screenshot({ type: 'png', animations: 'disabled', fullPage: false });
    const output = resolve(dir, project.slug + '.webp');
    const result = await sharp(capture).resize({ width: 1200 }).webp({ quality: 82, effort: 5 }).toBuffer();
    await writeFile(output, result);
    console.log('Saved', output, result.length, 'bytes, title:', title);
    saved++;
  } catch (error) {
    failed.push({ project: project.slug, error: String(error) });
    console.error('FAILED', project.slug, error);
  } finally {
    await context.close();
  }
}
await browser.close();
console.log('Screenshots saved:', saved, 'failed:', JSON.stringify(failed));
if (saved === 0) process.exitCode = 1;
