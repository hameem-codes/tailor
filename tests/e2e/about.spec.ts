import { test, expect } from '@playwright/test';
import { seedStorage, MEN_TSHIRT } from './helpers';

test.beforeEach(async ({ page }) => {
  await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
  await page.goto('/about');
  await page.waitForTimeout(800);
});

test.describe('About — accordions', () => {
  test('only one accordion is open at a time', async ({ page }) => {
    const buttons = page.locator('button[id^="accordion-btn-"]');
    await expect(buttons).toHaveCount(3);

    await buttons.nth(0).click();
    await page.waitForTimeout(400);
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'false');
    await expect(buttons.nth(2)).toHaveAttribute('aria-expanded', 'false');

    await buttons.nth(1).click();
    await page.waitForTimeout(400);
    await expect(buttons.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'true');

    // collapsing the open one leaves none open
    await buttons.nth(1).click();
    await page.waitForTimeout(400);
    for (let i = 0; i < 3; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('closed accordion content is hidden from assistive tech', async ({ page }) => {
    const buttons = page.locator('button[id^="accordion-btn-"]');
    const panel1 = page.locator('#accordion-panel-differ');

    await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'false');
    // hidden or inert: not exposed to the accessibility tree
    const exposed = await panel1.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && !el.hasAttribute('hidden') && !el.hasAttribute('inert');
    });
    expect(exposed, 'collapsed accordion content must be removed from the a11y tree').toBe(false);

    await buttons.nth(1).click();
    await page.waitForTimeout(400);
    await expect(panel1).toBeVisible();
    await expect(panel1).toContainText(/Medium at ZARA/);
  });

  test('accordion buttons are at least 44px tall', async ({ page }) => {
    const boxes = await page.locator('button[id^="accordion-btn-"]').evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().height)
    );
    for (const h of boxes) expect(h).toBeGreaterThanOrEqual(43.5);
  });
});

test.describe('About — feedback chips', () => {
  test('selecting a feedback chip confirms and persists it locally', async ({ page }) => {
    const chip = page.getByRole('button', { name: 'Fit well' });
    await chip.click();
    await expect(page.getByText(/Thanks for the feedback/)).toBeVisible();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('tailor_feedback_v1') || '[]'));
    expect(stored.length).toBe(1);
    expect(stored[0].sentiment).toBe('well');

    await page.getByRole('button', { name: 'Too tight' }).click();
    const stored2 = await page.evaluate(() => JSON.parse(localStorage.getItem('tailor_feedback_v1') || '[]'));
    expect(stored2.length).toBe(2);
  });

  test('feedback chips are all >= 44px and reachable by keyboard', async ({ page }) => {
    const chips = page.locator('button', { hasText: /Fit well|Too tight|Too loose/ });
    const boxes = await chips.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    expect(boxes.length).toBe(3);
    for (const b of boxes) {
      expect(b.width).toBeGreaterThanOrEqual(43.5);
      expect(b.height).toBeGreaterThanOrEqual(43.5);
    }
  });
});

test.describe('About — Back button', () => {
  test('Back to results returns to the results screen', async ({ page }) => {
    await page.getByRole('button', { name: 'Back to results' }).click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Your sizes' })).toBeVisible();
  });

  test('the header back button works too', async ({ page }) => {
    await page.getByRole('button', { name: 'Go back' }).click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 15_000 });
  });
});
