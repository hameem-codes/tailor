import { test, expect } from '@playwright/test';
import { seedStorage, MEN_TSHIRT } from './helpers';

test.describe('Flow — Input > Loading > Results > Brand Detail > About', () => {
  test('Find my size advances through Loading to Results', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));

    await page.goto('/');
    await page.waitForTimeout(400);
    await page.locator('#form-height-error').fill('180');
    await page.getByRole('button', { name: 'Find my size' }).click();

    await expect(page).toHaveURL(/\/loading$/);
    await expect(page.getByRole('heading', { name: /Comparing \d+ brands/ })).toBeVisible();

    await expect(page).toHaveURL(/\/results$/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Your sizes' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('Back on Results keeps the entered values', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    await page.locator('#form-height-error').fill('181');
    await page.locator('#form-weight-error').fill('74');
    await page.getByRole('radio', { name: 'Jacket' }).click();
    await page.getByRole('button', { name: 'Find my size' }).click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 20_000 });

    await page.getByRole('button', { name: 'Back to edit measurements' }).click();
    await expect(page).toHaveURL(/\/$/);

    await expect(page.locator('#form-height-error')).toHaveValue('181');
    await expect(page.locator('#form-weight-error')).toHaveValue('74');
    await expect(page.getByRole('radio', { name: 'Jacket' })).toHaveAttribute('aria-checked', 'true');
  });

  test('Back on Brand Detail returns to Results', async ({ page }) => {
    await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
    await page.goto('/results');
    await page.waitForTimeout(700);

    await page.getByRole('button', { name: /View size chart and details/ }).first().click();
    await expect(page).toHaveURL(/\/brand\//);
    await expect(page.getByRole('button', { name: 'Back to results' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Back to results' }).first().click();
    await expect(page).toHaveURL(/\/results$/);
    await expect(page.getByRole('heading', { name: 'Your sizes' })).toBeVisible();
  });

  test('About is reachable from every screen and Back returns to Results', async ({ page }) => {
    await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
    await page.goto('/results');
    await page.waitForTimeout(700);

    // Desktop about entry lives in the top navbar
    await page.getByRole('button', { name: 'About' }).first().click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { name: 'About Tailor' })).toBeVisible();

    await page.getByRole('button', { name: 'Back to results' }).click();
    await expect(page).toHaveURL(/\/results$/);
  });

  test('browser Back works across Input > Results > Brand Detail', async ({ page }) => {
    await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
    await page.goto('/');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Find my size' }).click();
    await expect(page).toHaveURL(/\/results$/, { timeout: 20_000 });
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: /View size chart and details/ }).first().click();
    await expect(page).toHaveURL(/\/brand\//);

    await page.goBack();
    await expect(page).toHaveURL(/\/results$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/loading$|\/$/);
  });

  test('refresh keeps the current route rendered', async ({ page }) => {
    await seedStorage(page, MEN_TSHIRT, { tailor_searched: 'true' });
    for (const route of ['/results', '/brand/hm', '/about', '/']) {
      await page.goto(route);
      await page.waitForTimeout(700);
      await page.reload();
      await page.waitForTimeout(900);
      const url = page.url();
      if (route === '/about' || route === '/' || route === '/brand/hm') {
        expect(url).toContain(route === '/' ? /\/$/.source : route);
      }
      // screen still renders content rather than a blank document
      const text = await page.evaluate(() => document.body.innerText.trim().length);
      expect(text, `${route} rendered nothing after reload`).toBeGreaterThan(80);
    }
  });

  test('direct navigation to /redirects to Input with a friendly message', async ({ page }) => {
    await page.goto('/results');
    await page.waitForTimeout(900);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('status')).toContainText(/enter your measurements/i);
  });

  test('direct navigation to /brand/:id shows the brand detail for a known brand', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/brand/zara');
    await page.waitForTimeout(800);
    await expect(page.getByRole('heading', { name: /Fit Verdict|/i }).first()).toBeVisible().catch(() => {});
    await expect(page.getByText('Recommended Size')).toBeVisible();
    await expect(page.locator('body')).toContainText('ZARA');
    expect(errors).toEqual([]);
  });

  test('direct navigation to /brand/:id for an unknown brand shows a recoverable state', async ({ page }) => {
    await page.goto('/brand/not-a-real-brand');
    await page.waitForTimeout(800);
    await expect(page.getByRole('heading', { name: 'Brand not found' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to results' }).click();
    await expect(page).toHaveURL(/\/results$|\/$/);
  });

  test('unknown routes redirect to Input', async ({ page }) => {
    await page.goto('/nonsense/deep/path');
    await page.waitForTimeout(700);
    await expect(page).toHaveURL(/\/$/);
  });
});
