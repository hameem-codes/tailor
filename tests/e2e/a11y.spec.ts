import { test, expect } from '@playwright/test';
import {
  seedStorage,
  MEN_TSHIRT,
  runAxe,
  findUndersizedTargets,
  findClippedElements,
  collectPageProblems,
} from './helpers';

const ROUTES = [
  { name: 'Input', path: '/' },
  { name: 'Loading', path: '/loading' },
  { name: 'Results', path: '/results' },
  { name: 'Brand detail', path: '/brand/hm' },
  { name: 'Brand detail (pants)', path: '/brand/hm_pants' },
  { name: 'Brand not found', path: '/brand/does-not-exist' },
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

const projectName = test.info().project.name;
const sweepViewports = projectName === 'chromium';

for (const vp of VIEWPORTS) {
  test.describe(`a11y @ ${vp.name}`, () => {
    // Only the desktop Chromium project walks the viewport matrix; device emulation
    // projects already pin their own device viewport.
    test.skip(!sweepViewports, 'device project uses its own viewport');
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of ROUTES) {
      test(`${route.name} — axe 0 serious/critical, no console noise, no drift`, async ({ page }) => {
        const problems = collectPageProblems(page);
        await seedStorage(page, MEN_TSHIRT, { [ 'tailor_searched' ]: 'true' });
        await page.goto(route.path);
        await page.waitForTimeout(route.path === '/loading' ? 450 : 900);

        // 1. axe-core: zero serious/critical
        await runAxe(page, `${route.name} @ ${vp.name}`);

        // 2. no console errors/warnings
        expect(problems, `console/network noise on ${route.name} @ ${vp.name}`).toEqual([]);

        // 3. no horizontal drift
        const drift = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(
          drift.scrollWidth,
          `horizontal overflow on ${route.name} @ ${vp.name}`
        ).toBeLessThanOrEqual(drift.innerWidth + 1);

        // 4. no clipped content
        const clipped = await findClippedElements(page);
        expect(clipped, `clipped elements on ${route.name} @ ${vp.name}`).toEqual([]);
      });
    }
  });
}

// Device emulation: iPhone Safari (WebKit) + Android Chrome (chromium project)
test.describe('a11y @ device emulation', () => {
  test('iPhone Safari — every screen passes axe', async ({ page }, testInfo) => {
    for (const route of ROUTES) {
      const problems = collectPageProblems(page);
      await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
      await page.goto(route.path);
      await page.waitForTimeout(route.path === '/loading' ? 450 : 900);
      await runAxe(page, `${route.name} @ ${testInfo.project.name}`);
      expect(problems, `console noise on ${route.name} @ ${testInfo.project.name}`).toEqual([]);
    }
  });

  test('Android Chrome — every screen passes axe', async ({ page }, testInfo) => {
    for (const route of ROUTES) {
      const problems = collectPageProblems(page);
      await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
      await page.goto(route.path);
      await page.waitForTimeout(route.path === '/loading' ? 450 : 900);
      await runAxe(page, `${route.name} @ ${testInfo.project.name}`);
      expect(problems, `console noise on ${route.name} @ ${testInfo.project.name}`).toEqual([]);
    }
  });
});
