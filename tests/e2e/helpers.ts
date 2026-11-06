import { Page, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

export const MEASUREMENTS_KEY = 'tailor_user_measurements_v1';
export const SAVED_BRANDS_KEY = 'tailor_saved_brands_v1';
export const TIP_DISMISSED_KEY = 'tailor_tip_dismissed_v1';
export const SEARCHED_KEY = 'tailor_searched';

export const MEN_TSHIRT = {
  gender: 'men',
  category: 't-shirt',
  unit: 'metric',
  height: 180,
  weight: 78,
  chest: 100,
  waist: 86,
  fitPreference: 'regular',
};

export const WOMEN_PANTS = {
  gender: 'women',
  category: 'pants',
  unit: 'metric',
  height: 168,
  weight: 62,
  chest: 92,
  waist: 74,
  hips: 100,
  fitPreference: 'regular',
};

/** Seed localStorage so guarded routes (/results, /brand/:id) render their content. */
export async function seedStorage(page: Page, measurements: object = MEN_TSHIRT, extra: Record<string, string> = {}) {
  await page.addInitScript(
    ({ mKey, mVal, extraEntries }) => {
      try {
        localStorage.setItem(mKey, mVal);
        for (const [k, v] of Object.entries(extraEntries)) {
          if (v === '__REMOVE__') localStorage.removeItem(k);
          else localStorage.setItem(k, v);
        }
      } catch {
        /* storage disabled: app must still boot */
      }
    },
    { mKey: MEASUREMENTS_KEY, mVal: JSON.stringify(measurements), extraEntries: extra }
  );
}

/** Block all storage writes (simulates Safari private mode / disabled localStorage). */
export async function disableStorage(page: Page) {
  await page.addInitScript(() => {
    const boom = () => {
      const e = new Error('Storage is disabled');
      e.name = 'SecurityError';
      throw e;
    };
    try {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          return {
            getItem: boom,
            setItem: boom,
            removeItem: boom,
            clear: boom,
            key: boom,
            length: 0,
          };
        },
      });
    } catch {
      /* ignore */
    }
  });
}

/** Fail on any console error/warning/pageerror, or non-aborted network failure. */
export function collectPageProblems(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      problems.push(`console.${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    const text = req.failure()?.errorText ?? '';
    // ERR_ABORTED is navigation teardown noise (fonts/favicon cancelled by route change),
    // not an application failure.
    if (!text.includes('ERR_ABORTED')) {
      problems.push(`network: ${req.url()} ${text}`);
    }
  });
  return problems;
}

/** Run axe-core; assert zero serious/critical violations. */
export async function runAxe(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();

  const blocking = results.violations.filter((v) =>
    ['critical', 'serious'].includes(v.impact ?? '')
  );
  const detail = blocking
    .map((v) => `${v.impact} [${v.id}] ${v.help} -> ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join(' | ')}`)
    .join('\n');
  expect(blocking, `axe serious/critical violations on ${label}:\n${detail}`).toEqual([]);

  // Expose the full list for reporting purposes.
  return results.violations;
}

export interface TouchViolation {
  selector: string;
  label: string;
  width: number;
  height: number;
}

/** Every visible interactive element must be at least 44x44 CSS px. */
export async function findUndersizedTargets(page: Page): Promise<TouchViolation[]> {
  return page.evaluate(() => {
    const out: Array<{ selector: string; label: string; width: number; height: number }> = [];
    const nodes = document.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [role="radio"], [role="checkbox"], [role="tab"], [role="switch"]'
    );
    for (const el of Array.from(nodes)) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue; // not rendered
      if (r.width >= 43.5 && r.height >= 43.5) continue;
      const label = (el.getAttribute('aria-label') || el.textContent || el.id || '').trim().slice(0, 40);
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.')}` : '';
      out.push({
        selector: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}`,
        label,
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
      });
    }
    return out;
  });
}

/** WCAG AA contrast for every rendered text node, using axe's own engine as authority. */
export async function findContrastFailures(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .include('body')
    .analyze();
  const cc = results.violations.find((v) => v.id === 'color-contrast');
  if (!cc) return [];
  return cc.nodes.map((n) => `${n.target.join(' ')} — ${n.failureSummary ?? ''}`);
}

/** Keyboard-focusable elements must show a visible focus ring. */
export async function findElementsWithoutFocusRing(page: Page) {
  const handles = await page.locator('button:visible, a[href]:visible, input:visible, [role="radio"]:visible').all();
  const bad: string[] = [];
  for (const h of handles.slice(0, 40)) {
    await h.evaluate((el: HTMLElement) => (el as HTMLElement).focus());
    const info = await h.evaluate((el: HTMLElement) => {
      const cs = getComputedStyle(el);
      const hasOutline =
        (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0) ||
        (cs.boxShadow !== 'none' && cs.boxShadow.includes('rgb'));
      return { hasOutline, tag: el.tagName.toLowerCase(), label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30) };
    });
    if (!info.hasOutline) bad.push(`${info.tag} "${info.label}"`);
  }
  return bad;
}

/** Detect elements clipped by their own container (overflow hidden + smaller than content). */
export async function findClippedElements(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const nodes = document.querySelectorAll<HTMLElement>('main *, main');
    for (const el of Array.from(nodes)) {
      const cs = getComputedStyle(el);
      if (cs.overflow === 'visible') continue;
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX === 'hidden') {
        // horizontal clipping without a way to scroll
        if (!el.closest('.overflow-x-auto, .overflow-x-scroll, [class*="overflow-x"]')) {
          out.push(`${el.tagName.toLowerCase()} sw=${el.scrollWidth} cw=${el.clientWidth}`);
        }
      }
      if (el.scrollHeight > el.clientHeight + 2 && cs.overflowY === 'hidden') {
        if (!el.closest('.overflow-y-auto, .max-h-')) {
          out.push(`${el.tagName.toLowerCase()} sh=${el.scrollHeight} ch=${el.clientHeight}`);
        }
      }
    }
    return out.slice(0, 10);
  });
}

/** Overlap detection for sibling cards/sections at a coarse level. */
export async function findOverlappingSections(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const cards = Array.from(document.querySelectorAll<HTMLElement>('article, section, .glass-card'));
    const rects = cards.map((c) => ({ el: c, r: c.getBoundingClientRect() })).filter((x) => x.r.width > 4 && x.r.height > 4);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].r;
        const b = rects[j].r;
        if (rects[i].el.contains(rects[j].el) || rects[j].el.contains(rects[i].el)) continue;
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 6 && oy > 6) {
          out.push(
            `${rects[i].el.tagName.toLowerCase()}[${i}] overlaps ${rects[j].el.tagName.toLowerCase()}[${j}] by ${Math.round(ox)}x${Math.round(oy)}`
          );
        }
      }
    }
    return out.slice(0, 6);
  });
}

/** Navigate to /results via the real UI so the session flag is set authentically. */
export async function goToResultsViaUI(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Find my size' }).click();
  await expect(page).toHaveURL(/\/results$/, { timeout: 15_000 });
  await page.waitForTimeout(400);
}
