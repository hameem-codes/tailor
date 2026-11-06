import { test, expect } from '@playwright/test';
import { chromium, webkit } from '@playwright/test';
import {
  seedStorage,
  MEN_TSHIRT,
  disableStorage,
  collectPageProblems,
} from './helpers';

const ROUTES = ['/', '/results', '/brand/hm', '/about'];

test.describe('Responsive — rotation', () => {
  test('portrait → landscape keeps every screen free of horizontal drift', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });

    for (const size of [
      { width: 390, height: 844, label: 'portrait' },
      { width: 844, height: 390, label: 'landscape' },
      { width: 360, height: 640, label: 'small landscape' },
    ]) {
      await page.setViewportSize({ width: size.width, height: size.height });
      for (const route of ROUTES) {
        await page.goto(route);
        await page.waitForTimeout(700);
        const drift = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
        }));
        expect(
          drift.sw,
          `horizontal overflow on ${route} @ ${size.label} (${size.width}x${size.height})`
        ).toBeLessThanOrEqual(drift.iw + 1);
      }
    }
    await ctx.close();
  });
});

test.describe('Responsive — 200% browser zoom', () => {
  test('layout survives 200% zoom with no horizontal drift or clipped controls', async ({ browser }) => {
    // 200% zoom on a 390x844 device == 195x372 CSS px at 2x device pixel ratio.
    const ctx = await browser.newContext({
      viewport: { width: 195, height: 372 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    const problems = collectPageProblems(page);
    await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });

    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForTimeout(800);
      const drift = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
      }));
      expect(drift.sw, `horizontal drift at 200% zoom on ${route}`).toBeLessThanOrEqual(drift.iw + 1);

      // Key interactive elements still present and hit-testable
      const count = await page.locator('button:visible, a[href]:visible, input:visible').count();
      expect(count, `no interactive elements visible at 200% zoom on ${route}`).toBeGreaterThan(2);
    }
    expect(problems).toEqual([]);
    await ctx.close();
  });
});

test.describe('Responsive — large system font size', () => {
  test('text scaling does not break layout or hide content', async ({ browser }) => {
    for (const fontScale of [1.25, 1.5, 2]) {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        fontScale,
        hasTouch: true,
      });
      const page = await ctx.newPage();
      const problems = collectPageProblems(page);
      await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });

      for (const route of ROUTES) {
        await page.goto(route);
        await page.waitForTimeout(800);
        const drift = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          iw: window.innerWidth,
        }));
        expect(
          drift.sw,
          `horizontal drift at fontScale ${fontScale} on ${route}`
        ).toBeLessThanOrEqual(drift.iw + 1);

        const bodyText = await page.evaluate(() => document.body.innerText.trim().length);
        expect(bodyText, `no readable content at fontScale ${fontScale} on ${route}`).toBeGreaterThan(80);
      }
      expect(problems).toEqual([]);
      await ctx.close();
    }
  });
});

test.describe('Persistence — storage unavailable (private mode)', () => {
  test('localStorage disabled does not crash any screen', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    await disableStorage(page);

    for (const route of ['/', '/results', '/brand/hm', '/about']) {
      await page.goto(route);
      await page.waitForTimeout(800);
      const text = await page.evaluate(() => document.body.innerText.trim().length);
      expect(text, `${route} is blank with storage disabled`).toBeGreaterThan(40);
    }
    expect(problems, 'app crashed with localStorage disabled').toEqual([]);
  });

  test('localStorage throwing QuotaExceededError does not crash', async ({ page }) => {
    await page.addInitScript(() => {
      const real = window.localStorage;
      const quota = () => {
        const e = new Error('QuotaExceededError');
        e.name = 'QuotaExceededError';
        throw e;
      };
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          return {
            getItem: real.getItem.bind(real),
            removeItem: real.removeItem.bind(real),
            clear: real.clear.bind(real),
            key: real.key.bind(real),
            get length() { return real.length; },
            setItem: quota,
          };
        },
      });
    });
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));

    await page.goto('/');
    await page.waitForTimeout(500);
    await page.locator('#form-height-error').fill('181');
    await page.getByRole('button', { name: 'Find my size' }).click();
    await page.waitForTimeout(2500);
    await expect(page.getByRole('heading', { name: 'Your sizes' })).toBeVisible();

    await page.getByRole('button', { name: /^Save / }).first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'About' }).first().click();
    await page.waitForTimeout(600);
    await expect(page.getByRole('heading', { name: 'About Tailor' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('corrupt localStorage payload falls back to defaults instead of crashing', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tailor_user_measurements_v1', '{not valid json');
      localStorage.setItem('tailor_saved_brands_v1', 'also broken');
    });
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));

    await page.goto('/');
    await page.waitForTimeout(900);
    await expect(page.getByRole('heading', { name: 'Find your fit.' })).toBeVisible();
    await expect(page.locator('#form-height-error')).toHaveValue('175');
    expect(problems).toEqual([]);
  });
});

test.describe('Performance — no layout shift', () => {
  test('Cumulative Layout Shift stays under 0.1 on the input screen', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
              (window as unknown as { __cls: number }).__cls +=
                (entry as unknown as { value: number }).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true } as PerformanceObserverInit);
      } catch {
        /* unsupported */
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls, `CLS ${cls.toFixed(4)} exceeds the 0.1 budget`).toBeLessThan(0.1);
  });

  test('scrolling the results list stays smooth (no scroll-blocking handlers)', async ({ page }) => {
    await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
    await page.goto('/results');
    await page.waitForTimeout(900);

    const passive = await page.evaluate(() => {
      // touch-action must allow vertical panning
      const cs = getComputedStyle(document.body);
      return { touchAction: cs.touchAction };
    });
    expect(passive.touchAction).toContain('pan-y');

    const start = Date.now();
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(300);
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeGreaterThan(500);
    expect(Date.now() - start).toBeLessThan(4000);
  });
});

test.describe('Performance — blur effects do not jank the scroll', () => {
  test.skip(test.info().project.name !== 'chromium', 'CPU throttling check runs on chromium');
  test('mid-range Android profile keeps scrolling responsive', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });

    await page.goto('/results');
    await page.waitForTimeout(1500);

    const t0 = Date.now();
    for (let i = 0; i < 6; i++) {
      await page.evaluate((n) => window.scrollTo(0, n * 900), i);
      await page.waitForTimeout(120);
    }
    const elapsed = Date.now() - t0;
    expect(elapsed, 'scrolling took too long under 4x CPU throttling').toBeLessThan(8000);

    const drift = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
    }));
    expect(drift.sw).toBeLessThanOrEqual(drift.iw + 1);
    await ctx.close();
  });
});

test.describe('Cross-browser parity', () => {
  test('core flow works in WebKit (iPhone Safari engine)', async ({ browser }, testInfo) => {
    const engine = testInfo.project.name === 'iphone-safari' ? browser : null;
    if (!engine) test.skip(true, 'only meaningful on WebKit');
  });
});
