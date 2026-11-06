import { chromium, webkit, devices } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:5199';
const slug = process.env.SLUG || 'before';
const BROWSER = (process.env.BROWSER || 'chromium').toLowerCase();

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 740 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const ROUTES = [
  { name: 'input', path: '/' },
  { name: 'loading', path: '/loading' },
  { name: 'results', path: '/results' },
  { name: 'brand-detail', path: '/brand/hm' },
  { name: 'brand-detail-pants', path: '/brand/hm_pants' },
  { name: 'brand-not-found', path: '/brand/does-not-exist' },
  { name: 'about', path: '/about' },
];

// ---------- helpers ----------
function launchOpts() {
  return BROWSER === 'webkit'
    ? {}
    : { channel: 'chromium' };
}

async function makeContext(browser, vp, device) {
  return browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    ...(device ? { ...device } : {}),
    hasTouch: vp.width < 1024,
    isMobile: false,
    storageState: {
      cookies: [],
      origins: [{
        origin: (process.env.BASE_URL || 'http://localhost:5199').replace(/\/$/, ''),
        localStorage: [
          { name: 'tailor_user_measurements_v1', value: JSON.stringify({ gender: 'men', category: 't-shirt', unit: 'metric', height: 180, weight: 78, chest: 100, waist: 86, fitPreference: 'regular' }) },
          { name: 'tailor_searched', value: 'true' },
        ],
      }],
    },
  });
}

// Contrast ratio from two rgb strings
function parseRGB(str) {
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}
function lum({ r, g, b }) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function bgLum(el) {
  let node = el;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const c = parseRGB(cs.backgroundColor);
    if (c && c.a > 0.5) return lum(c);
    node = node.parentElement;
  }
  return lum(parseRGB(getComputedStyle(document.body).backgroundColor) || { r: 10, g: 10, b: 11 });
}
function contrast(fg, bg) {
  const l1 = lum(fg), l2 = bg;
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

// ---------- audit one page ----------
async function auditPage(page, routeName, vpName, results) {
  const consoleIssues = [];
  const netFailures = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleIssues.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => consoleIssues.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => {
    const t = r.failure()?.errorText || '';
    if (t.includes('ERR_ABORTED')) return; // navigation artefacts
    netFailures.push(`${r.url()} ${t}`);
  });

  await page.goto(`${BASE}${ROUTES.find(r => r.name === routeName).path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  });
  // /loading auto-advances after ~1.15s; audit it early
  await page.waitForTimeout(routeName === 'loading' ? 500 : 900);

  // horizontal drift
  const drift = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (drift.scrollWidth > drift.innerWidth + 1) {
    results.push({
      id: `drift-${routeName}-${vpName}`, screen: routeName, viewport: vpName,
      issue: `Horizontal overflow: scrollWidth ${drift.scrollWidth} > innerWidth ${drift.innerWidth}`,
      severity: 'P1',
    });
  }

  // axe
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  for (const v of axe.violations) {
    const nodes = v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ');
    results.push({
      id: `axe-${v.id}`, screen: routeName, viewport: vpName,
      issue: `${v.impact || 'unknown'} (${v.id}): ${v.help} — ${nodes}`,
      severity: v.impact === 'critical' || v.impact === 'serious' ? 'P1' : 'P2',
    });
  }

  // touch targets
  const small = await page.evaluate(() => {
    const out = [];
    const els = document.querySelectorAll(
      'button, a[href], input, select, [role="radio"], [role="checkbox"], [role="tab"]'
    );
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (r.width < 44 - 0.5 || r.height < 44 - 0.5) {
        out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 28)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return out;
  });
  if (small.length) {
    results.push({
      id: `touch-target-${routeName}-${vpName}`, screen: routeName, viewport: vpName,
      issue: `${small.length} interactive element(s) under 44x44px: ${small.slice(0, 8).join(' ; ')}`,
      severity: 'P1',
    });
  }

  // contrast on text nodes
  const lowContrast = await page.evaluate((parseRGBsrc) => {
    // re-injected helpers
    function parseRGB(str) {
      const m = str.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map((s) => parseFloat(s.trim()));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    function lum(c) {
      const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }
    function effectiveBg(el) {
      let node = el;
      let acc = null;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        const c = parseRGB(cs.backgroundColor);
        if (c && c.a > 0) {
          if (!acc) acc = c;
          else acc = { r: acc.r * (1 - c.a) + c.r * c.a, g: acc.g * (1 - c.a) + c.g * c.a, b: acc.b * (1 - c.a) + c.b * c.a, a: 1 };
          if (c.a >= 0.999) break;
        }
        node = node.parentElement;
      }
      if (!acc) acc = parseRGB(getComputedStyle(document.body).backgroundColor) || { r: 10, g: 10, b: 11, a: 1 };
      return acc;
    }
    function ratio(fg, bg) {
      const l1 = lum(fg), l2 = lum(bg);
      const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (a + 0.05) / (b + 0.05);
    }
    function fgOf(el) {
      const cs = getComputedStyle(el);
      let c = parseRGB(cs.color);
      if (!c) return null;
      if (c.a >= 1) return c;
      const bg = effectiveBg(el);
      return { r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a), a: 1 };
    }
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim();
      if (!t || t.length < 2) continue;
      const el = n.parentElement;
      if (!el || seen.has(el)) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.1) continue;
      // Skip opt-in groups whose active label is painted by a sibling "pill" overlay
      // (transparent background over an adjacent absolutely-positioned element).
      // axe-core evaluates these correctly and is the authority for them.
      if (el.closest('[role="radiogroup"] > button, [role="tablist"] > button')) continue;
      if (cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent') {
        let anc = el.parentElement, covered = false;
        while (anc && anc !== document.body) {
          const acs = getComputedStyle(anc);
          if (acs.backgroundColor !== 'rgba(0, 0, 0, 0)' && acs.backgroundColor !== 'transparent') { covered = true; break; }
          anc = anc.parentElement;
        }
        if (!covered) continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      const fg = fgOf(el);
      if (!fg) continue;
      const bg = effectiveBg(el);
      const cr = ratio(fg, bg);
      const size = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight, 10) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      if (cr < need) {
        out.push(`"${t.slice(0, 26)}" ${cr.toFixed(2)}:1 (need ${need}, ${size}px${bold ? ' bold' : ''})`);
      }
    }
    return out;
  }, null);

  if (lowContrast.length) {
    results.push({
      id: `contrast-${routeName}-${vpName}`, screen: routeName, viewport: vpName,
      issue: `${lowContrast.length} text node(s) below WCAG AA: ${lowContrast.slice(0, 6).join(' ; ')}`,
      severity: 'P1',
    });
  }

  if (consoleIssues.length) {
    results.push({
      id: `console-${routeName}-${vpName}`, screen: routeName, viewport: vpName,
      issue: `${consoleIssues.length} console error/warning(s): ${[...new Set(consoleIssues)].slice(0, 4).join(' ; ')}`,
      severity: 'P2',
    });
  }
  if (netFailures.length) {
    results.push({
      id: `network-${routeName}-${vpName}`, screen: routeName, viewport: vpName,
      issue: `${netFailures.length} failed request(s): ${netFailures.slice(0, 4).join(' ; ')}`,
      severity: 'P2',
    });
  }
}

// ---------- CLS measurement ----------
async function measureCLS(page, results, vpName, routeName) {
  await page.addInitScript(() => {
    window.__cls = 0;
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
  });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  const cls = await page.evaluate(() => window.__cls);
  if (cls > 0.1) {
    results.push({
      id: `cls-${routeName}-${vpName}`, screen: routeName, viewport: vpName,
      issue: `Cumulative Layout Shift ${cls.toFixed(3)} exceeds 0.1 (target: no layout shift)`,
      severity: 'P2',
    });
  }
  return cls;
}

// ---------- main ----------
const results = [];
const axeSummary = {};
let browser;

// Full route sweep only at a representative set of viewports (keeps runtime sane);
// every viewport still gets the critical screens.
const FULL_SWEEP_VPS = ['mobile-360', 'tablet-768', 'desktop-1440'];
const REDUCED_ROUTES = ['input', 'results', 'brand-detail'];

if (BROWSER === 'webkit') {
  browser = await webkit.launch();
} else {
  browser = await chromium.launch(launchOpts());
}

// 1. viewport sweep (axe, drift, touch, contrast, console, network)
for (const vp of VIEWPORTS) {
  const ctx = await makeContext(browser, vp, null);
  const page = await ctx.newPage();
  const routes = FULL_SWEEP_VPS.includes(vp.name) ? ROUTES.map(r => r.name) : REDUCED_ROUTES;
  for (const routeName of routes) {
    await auditPage(page, routeName, vp.name, results);
  }
  await ctx.close();
}

// 2. device emulation: iPhone Safari (WebKit) + Android Chrome
const EMULATIONS = [
  { name: 'iphone-safari-webkit', device: devices['iPhone 13'], engine: 'webkit' },
  { name: 'android-chrome', device: devices['Pixel 7'], engine: 'chromium' },
];
for (const emu of EMULATIONS) {
  let eng = browser;
  if (emu.engine === 'webkit' && BROWSER !== 'webkit') eng = await webkit.launch();
  const ctx = await eng.newContext({
    ...emu.device,
    hasTouch: true,
    isMobile: true,
    storageState: {
      cookies: [],
      origins: [{
        origin: BASE.replace(/\/$/, ''),
        localStorage: [
          { name: 'tailor_user_measurements_v1', value: JSON.stringify({ gender: 'men', category: 't-shirt', unit: 'metric', height: 180, weight: 78, chest: 100, waist: 86, fitPreference: 'regular' }) },
          { name: 'tailor_searched', value: 'true' },
        ],
      }],
    },
  });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    await auditPage(page, route.name, emu.name, results);
  }
  await ctx.close();
}

// 3. CLS on a few viewports
for (const vp of VIEWPORTS.slice(0, 3)) {
  const ctx = await makeContext(browser, vp, null);
  const page = await ctx.newPage();
  const cls = await measureCLS(page, results, vp.name, 'input');
  axeSummary[`cls-${vp.name}`] = Number(cls.toFixed(4));
  await ctx.close();
}

// dedupe by issue signature
const seen = new Set();
const deduped = results.filter((r) => {
  const key = `${r.screen}|${r.issue}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const ctx2 = await browser.newContext();
const page2 = await ctx2.newPage();
await page2.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page2.waitForTimeout(1200);
await page2.screenshot({ path: `${process.env.SHOT_DIR || '.'}/screenshots/${slug}/input.png`, fullPage: true });

await browser.close();

fs.writeFileSync(
  `${process.env.OUT || './audit-' + slug + '.json'}`,
  JSON.stringify({ browser: BROWSER, total: deduped.length, results: deduped, axeSummary }, null, 2)
);

console.log(`AUDIT ${slug} (${BROWSER}): ${deduped.length} findings`);
const bySev = {};
for (const r of deduped) bySev[r.severity] = (bySev[r.severity] || 0) + 1;
console.log(JSON.stringify(bySev));
for (const r of deduped) console.log(`  [${r.severity}] ${r.id} :: ${r.issue.slice(0, 200)}`);

process.exit(0);
