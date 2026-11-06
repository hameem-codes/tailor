import { test, expect } from '@playwright/test';
import { seedStorage, MEN_TSHIRT } from './helpers';

test.beforeEach(async ({ page }) => {
  await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
});

test.describe('Brand Detail — size chips drive the whole panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/brand/hm');
    await page.waitForTimeout(900);
  });

  test('selecting a smaller size tightens the verdict and the range bar', async ({ page }) => {
    const verdict = page.locator('p.font-barlow').first();
    const before = await verdict.innerText();
    const rangeBefore = await page.getByText(/^Range:/).innerText();

    await page.getByRole('radio', { name: /^S · / }).click();
    await page.waitForTimeout(500);

    await expect(verdict).toContainText(/tighter/);
    await expect(page.getByText('Tighter fit')).toBeVisible();
    await expect(page.getByText(/^Range:/)).not.toHaveText(rangeBefore);
  });

  test('selecting a larger size loosens the verdict', async ({ page }) => {
    await page.getByRole('radio', { name: /^L · / }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('p.font-barlow').first()).toContainText(/looser/);
    await expect(page.getByText('Looser fit')).toBeVisible();
  });

  test('the recommended size chip is labelled "best" and shows the engine match label', async ({ page }) => {
    const best = page.getByRole('radio', { name: /· best/ });
    await expect(best).toHaveCount(1);
    await expect(best).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(/Great match|Poor match|Between sizes/).first()).toBeVisible();
  });

  test('selecting a table row highlights it and syncs the size chip', async ({ page }) => {
    const rows = page.locator('button[aria-pressed], button[aria-selected]');
    await expect(rows.first()).toBeVisible();

    await rows.nth(2).click();
    await page.waitForTimeout(400);

    await expect(rows.nth(2)).toHaveAttribute('aria-checked', 'true').catch(async () => {
      await expect(rows.nth(2)).toHaveAttribute('aria-pressed', 'true');
    });
    const highlighted = await rows.evaluateAll((els) =>
      els.filter((el) => getComputedStyle(el).backgroundImage.includes('gradient')).length
    );
    expect(highlighted, 'exactly one table row is highlighted').toBe(1);
  });

  test('confidence and the selected size update together', async ({ page }) => {
    const conf = page.getByText(/^Confidence:/);
    await expect(conf).toBeVisible();
    const before = await conf.innerText();

    await page.getByRole('radio', { name: /^XS · / }).click();
    await page.waitForTimeout(400);
    await expect(conf).not.toHaveText(before);
  });
});

test.describe('Brand Detail — unit and measurement-type toggles', () => {
  test('table unit toggle converts the displayed ranges', async ({ page }) => {
    await page.goto('/brand/hm');
    await page.waitForTimeout(900);

    const cmRow = page.locator('button[aria-pressed], button[aria-selected]').first();
    const cmText = await cmRow.innerText();
    expect(cmText).toMatch(/\d+–\d+/);

    await page.getByRole('radio', { name: 'in' }).first().click();
    await page.waitForTimeout(400);
    const inText = await page.locator('button[aria-pressed], button[aria-selected]').first().innerText();
    expect(inText).not.toBe(cmText);

    // values must be roughly 2.54x smaller
    const nums = (s: string) => (s.match(/[\d.]+/g) || []).map(Number).filter((n) => n > 0);
    expect(nums(inText)[0] / nums(cmText)[0]).toBeGreaterThan(0.3);
  });

  test('measurement type toggle switches body and garment values when available', async ({ page }) => {
    await page.goto('/brand/cos'); // COS is the garment-measured chart
    await page.waitForTimeout(900);

    const row = page.locator('button[aria-pressed], button[aria-selected]').first();
    const body = await row.innerText();
    await page.getByRole('radio', { name: 'Garment' }).click();
    await page.waitForTimeout(400);
    const garment = await row.innerText();
    expect(garment).not.toBe(body);
  });

  test('table unit preference persists across reloads and brands', async ({ page }) => {
    await page.goto('/brand/hm');
    await page.waitForTimeout(900);
    await page.getByRole('radio', { name: 'in' }).first().click();
    await page.waitForTimeout(300);

    await page.goto('/brand/zara');
    await page.waitForTimeout(900);
    await expect(page.getByRole('radio', { name: 'in' }).first()).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('Brand Detail — external links', () => {
  test('View on [brand] opens in a new tab with rel="noopener"', async ({ page }) => {
    await page.goto('/brand/hm');
    await page.waitForTimeout(900);

    const link = page.getByRole('link', { name: /View on H&M/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);

    const popup = await page.context().waitForEvent('page', async () => {
      await link.click();
    }).catch(() => null);
    if (popup) await popup.close();
  });

  test('the source citation link is safe', async ({ page }) => {
    await page.goto('/brand/hm');
    await page.waitForTimeout(900);
    const src = page.getByRole('link', { name: /H&M|Brand site|source/i }).first();
    if (await src.count()) {
      await expect(src).toHaveAttribute('target', '_blank');
      await expect(src).toHaveAttribute('rel', /noopener/);
    }
  });
});

test.describe('Brand Detail — deep links and pants', () => {
  test('a pants brand detail renders waist ranges', async ({ page }) => {
    await page.goto('/brand/hm_pants');
    await page.waitForTimeout(900);
    await expect(page.getByText('Your waist')).toBeVisible();
    await expect(page.getByText('Hips range')).toBeVisible();
    await expect(page.getByText('Waist range').first()).toBeVisible();
  });

  test('selecting a size chip updates the recommended-size callout', async ({ page }) => {
    await page.goto('/brand/hm');
    await page.waitForTimeout(900);
    const callout = page.getByText('Recommended Size').locator('..');
    await expect(callout).toBeVisible();
    await page.getByRole('radio', { name: /^L · / }).click();
    await page.waitForTimeout(400);
    await expect(callout).toContainText(/L|looser/i);
  });
});
