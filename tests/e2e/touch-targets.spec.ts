import { test, expect } from '@playwright/test';
import {
  seedStorage,
  MEN_TSHIRT,
  findUndersizedTargets,
  findElementsWithoutFocusRing,
} from './helpers';

const SCREENS = [
  { name: 'Input', path: '/' },
  { name: 'Results', path: '/results' },
  { name: 'Brand detail', path: '/brand/hm' },
  { name: 'About', path: '/about' },
];

const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test.describe(`touch targets & focus rings @ ${vp.name}`, () => {
    test.skip(test.info().project.name !== 'chromium', 'desktop viewport matrix');
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const screen of SCREENS) {
      test(`${screen.name} — all interactive elements ≥44x44 with visible focus ring`, async ({ page }) => {
        await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
        await page.goto(screen.path);
        await page.waitForTimeout(900);

        const undersized = await findUndersizedTargets(page);
        expect(
          undersized,
          `${screen.name} @ ${vp.name} has ${undersized.length} element(s) under 44x44:\n` +
            undersized.map((u) => `  ${u.selector} "${u.label}" ${u.width}x${u.height}`).join('\n')
        ).toEqual([]);

        const noRing = await findElementsWithoutFocusRing(page);
        expect(
          noRing,
          `${screen.name} @ ${vp.name} has focusable elements without a visible focus ring:\n` +
            noRing.map((s) => `  ${s}`).join('\n')
        ).toEqual([]);
      });
    }
  });
}

test.describe('keyboard reachability', () => {
  test('every control on Input is reachable by Tab with a visible focus ring', async ({ page }) => {
    await page.goto('/');
    const focusables = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, [role="radio"]')
      ).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }).length
    );
    expect(focusables).toBeGreaterThan(8);

    const visited = new Set<string>();
    for (let i = 0; i < focusables + 4; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const cs = getComputedStyle(el);
        const ring =
          (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0) ||
          cs.boxShadow.includes('rgb');
        return {
          key: `${el.tagName.toLowerCase()}:${el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 20) || ''}`,
          ring,
        };
      });
      if (!info) continue;
      visited.add(info.key);
      expect(
        info.ring,
        `focused element "${info.key}" has no visible focus ring`
      ).toBe(true);
    }
    expect(visited.size).toBeGreaterThan(6);
  });
});
