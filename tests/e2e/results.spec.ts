import { test, expect } from '@playwright/test';
import { seedStorage, MEN_TSHIRT, goToResultsViaUI, SAVED_BRANDS_KEY, TIP_DISMISSED_KEY } from './helpers';

test.beforeEach(async ({ page }) => {
  await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
});

test.describe('Results — sorting', () => {
  test('cycling the sort control changes the order and the label', async ({ page }) => {
    await goToResultsViaUI(page);

    const sort = page.getByRole('button', { name: /^Sort:/ });
    await expect(sort).toHaveText('Best match');

    await sort.click();
    await expect(sort).toHaveText('A–Z');
    const namesAsc = await page.locator('article .font-barlow.uppercase').allInnerTexts();
    const sorted = [...namesAsc].sort((a, b) => a.localeCompare(b));
    expect(namesAsc.map((s) => s.trim())).toEqual(sorted.map((s) => s.trim()));

    await sort.click();
    await expect(sort).toHaveText('Size');
    const sizes = await page.locator('article').evaluateAll((els) =>
      els.map((el) => el.querySelector('.font-barlow.text-5xl, .font-barlow.text-3xl')?.textContent?.trim() ?? '')
    );
    expect(sizes.length).toBeGreaterThan(5);

    await sort.click();
    await expect(sort).toHaveText('Best match');
  });
});

test.describe('Results — filtering', () => {
  test('All / Global / Local change the visible set', async ({ page }) => {
    await goToResultsViaUI(page);

    const allCount = await page.locator('article').count();
    expect(allCount).toBeGreaterThan(3);

    await page.getByRole('radio', { name: 'Global' }).click();
    await page.waitForTimeout(400);
    const globalCount = await page.locator('article').count();
    expect(globalCount).toBeGreaterThan(0);
    expect(globalCount).toBeLessThan(allCount);

    await page.getByRole('radio', { name: 'Local' }).click();
    await page.waitForTimeout(400);
    const localCount = await page.locator('article').count();
    expect(localCount).toBeGreaterThan(0);
    expect(localCount).toBeLessThan(allCount);

    await page.getByRole('radio', { name: 'All' }).click();
    await page.waitForTimeout(400);
    expect(await page.locator('article').count()).toBe(allCount);
  });

  test('the filter icon menu also filters by region and closes after choosing', async ({ page }) => {
    await goToResultsViaUI(page);
    const before = await page.locator('article').count();

    await page.getByRole('button', { name: 'Filter by brand region' }).click();
    await page.getByRole('button', { name: 'local only' }).click();
    await page.waitForTimeout(400);

    expect(await page.locator('article').count()).toBeLessThan(before);
    await expect(page.getByRole('button', { name: 'local only' })).toBeHidden();
  });
});

test.describe('Results — search', () => {
  test('partial text matches and no-results shows a recoverable empty state', async ({ page }) => {
    await goToResultsViaUI(page);
    const search = page.getByRole('textbox', { name: 'Search brands' });

    await search.fill('zara');
    await page.waitForTimeout(400);
    const cards = page.locator('article');
    expect(await cards.count()).toBeGreaterThan(0);
    for (const t of await cards.allInnerTexts()) {
      expect(t).toMatch(/zara/i);
    }

    // partial fragment
    await search.fill('uni');
    await page.waitForTimeout(400);
    expect(await page.locator('article').count()).toBeGreaterThan(0);

    await search.fill('zzzzzz');
    await page.waitForTimeout(500);
    expect(await page.locator('article').count()).toBe(0);
    await expect(page.getByRole('heading', { name: 'No brands match yet' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.waitForTimeout(400);
    expect(await page.locator('article').count()).toBeGreaterThan(3);
  });
});

test.describe('Results — dismissible tip', () => {
  test('stays dismissed after reload', async ({ page }) => {
    await goToResultsViaUI(page);
    const tip = page.getByRole('region', { name: 'Onboarding tip' });
    await expect(tip).toBeVisible();

    await page.getByRole('button', { name: 'Dismiss tip' }).click();
    await expect(tip).toBeHidden();

    await page.reload();
    await page.waitForTimeout(900);
    await expect(page.getByRole('region', { name: 'Onboarding tip' })).toBeHidden();
    expect(await page.evaluate((k) => localStorage.getItem(k), TIP_DISMISSED_KEY)).toBe('true');
  });
});

test.describe('Results — save heart persists', () => {
  test('saving a brand survives a reload', async ({ page }) => {
    await goToResultsViaUI(page);
    const heart = page.getByRole('button', { name: /^Save / }).first();
    const brandName = (await heart.getAttribute('aria-label'))!.replace('Save ', '');
    await heart.click();
    await expect(page.getByRole('button', { name: `Remove ${brandName} from saved` })).toBeVisible();

    await page.reload();
    await page.waitForTimeout(900);
    await expect(page.getByRole('button', { name: `Remove ${brandName} from saved` }).first()).toBeVisible();

    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), SAVED_BRANDS_KEY);
    expect(saved.length).toBeGreaterThan(0);
  });
});

test.describe('Results — compare', () => {
  test('needs at least 2 brands and caps at 3', async ({ page }) => {
    await goToResultsViaUI(page);

    const compareBtns = page.getByRole('button', { name: /^Compare / });
    await compareBtns.nth(0).click();
    await page.waitForTimeout(200);

    const tray = page.getByRole('region', { name: 'Brand comparison bar' });
    await expect(tray).toBeVisible();
    await expect(tray).toContainText('Compare (1/3)');
    await expect(page.getByRole('button', { name: /Pick 1 more brand/ })).toBeDisabled();

    await compareBtns.nth(1).click();
    await page.waitForTimeout(250);
    await expect(tray).toContainText('Compare (2/3)');
    await expect(page.getByRole('button', { name: /Compare side-by-side/ })).toBeEnabled();

    await compareBtns.nth(2).click();
    await page.waitForTimeout(250);
    await expect(tray).toContainText('Compare (3/3)');

    // A 4th attempt must not exceed the cap of 3.
    await compareBtns.nth(3).click();
    await page.waitForTimeout(250);
    await expect(tray).toContainText('Compare (3/3)');
    const chips = await page.getByRole('button', { name: /^Remove .* from comparison$/ }).count();
    expect(chips).toBeLessThanOrEqual(3);
  });

  test('removing a brand updates the tray count', async ({ page }) => {
    await goToResultsViaUI(page);
    await page.getByRole('button', { name: /^Compare / }).nth(0).click();
    await page.getByRole('button', { name: /^Compare / }).nth(1).click();
    await page.waitForTimeout(250);
    await expect(page.getByRole('region', { name: 'Brand comparison bar' })).toContainText('Compare (2/3)');

    await page.getByRole('button', { name: /^Remove .*$/ }).first().click();
    await page.waitForTimeout(250);
    await expect(page.getByRole('region', { name: 'Brand comparison bar' })).toContainText('Compare (1/3)');
  });

  test('comparison sheet opens and closes and locks background scroll', async ({ page }) => {
    await goToResultsViaUI(page);
    await page.getByRole('button', { name: /^Compare / }).nth(0).click();
    await page.getByRole('button', { name: /^Compare / }).nth(1).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /Compare side-by-side/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Brand Fit Comparison' });
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Comparing 2/3 brands');
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

    // Escape-free close button
    await sheet.getByRole('button', { name: 'Close comparison' }).click();
    await expect(sheet).toBeHidden();
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });

  test('comparison still resolves brands that are filtered out of the visible list', async ({ page }) => {
    await goToResultsViaUI(page);
    await page.getByRole('button', { name: /^Compare / }).nth(0).click();
    await page.getByRole('button', { name: /^Compare / }).nth(1).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('region', { name: 'Brand comparison bar' })).toContainText('Compare (2/3)');

    // Filter the visible list down to a single brand
    await page.getByRole('textbox', { name: 'Search brands' }).fill('zara');
    await page.waitForTimeout(400);
    await expect(page.getByRole('region', { name: 'Brand comparison bar' })).toContainText('Compare (2/3)');

    await page.getByRole('button', { name: /Compare side-by-side/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Brand Fit Comparison' });
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Comparing 2/3 brands');
  });
});

test.describe('Results — saved-only filter', () => {
  test('shows the empty state when nothing is saved', async ({ page }) => {
    await goToResultsViaUI(page);
    await page.getByRole('button', { name: 'Filter by saved brands' }).click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('heading', { name: 'No saved brands yet' })).toBeVisible();
  });

  test('lists only saved brands once some are saved', async ({ page }) => {
    await goToResultsViaUI(page);
    await page.getByRole('button', { name: /^Save / }).first().click();
    await page.getByRole('button', { name: /^Save / }).nth(2).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Filter by saved brands' }).click();
    await page.waitForTimeout(400);
    expect(await page.locator('article').count()).toBe(2);
    await expect(page.locator('h1')).toContainText('2 saved brands');
  });
});
