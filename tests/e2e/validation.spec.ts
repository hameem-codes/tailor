import { test, expect } from '@playwright/test';

const CASES: Array<{ height: string; weight: string; expectError: RegExp | null; label: string }> = [
  { height: '20', weight: '70', expectError: /Height should be between/, label: 'height below range (20 cm)' },
  { height: '300', weight: '70', expectError: /Height should be between/, label: 'height above range (300 cm)' },
  { height: '0', weight: '70', expectError: /Height should be between/, label: 'height zero' },
  { height: '-150', weight: '70', expectError: null, label: 'height negative (clamped by stepper)' },
  { height: '', weight: '70', expectError: /Height should be between/, label: 'height empty' },
  { height: '175', weight: '20', expectError: /Weight should be between/, label: 'weight below range (20 kg)' },
  { height: '175', weight: '400', expectError: /Weight should be between/, label: 'weight above range (400 kg)' },
  { height: '175', weight: '0', expectError: /Weight should be between/, label: 'weight zero' },
  { height: '175', weight: '', expectError: /Weight should be between/, label: 'weight empty' },
  { height: '175.5', weight: '70.25', expectError: null, label: 'decimals' },
];

test.describe('Validation — friendly inline errors, no crash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
  });

  for (const c of CASES) {
    test(`${c.label}`, async ({ page }) => {
      await page.locator('#form-height-error').fill(c.height);
      await page.locator('#form-weight-error').fill(c.weight);
      await page.waitForTimeout(250);

      const hasError = await page.locator('[role="alert"]').count();
      if (c.expectError) {
        await expect(page.locator('[role="alert"]').filter({ hasText: c.expectError }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Find my size' })).toBeDisabled();
        await expect(page.locator('#form-height-error')).toHaveAttribute('aria-invalid', 'true');
      } else {
        expect(hasError, `${c.label} should not show an error`).toBe(0);
        await expect(page.getByRole('button', { name: 'Find my size' })).toBeEnabled();
      }

      // Never a crash: the screen is still rendered and interactive.
      await expect(page.getByRole('heading', { name: 'Find your fit.' })).toBeVisible();
      await page.getByRole('radio', { name: 'Jacket' }).click();
      await expect(page.getByRole('radio', { name: 'Jacket' })).toHaveAttribute('aria-checked', 'true');
    });
  }

  test('non-numeric text in a numeric field does not crash or corrupt state', async ({ page }) => {
    const height = page.locator('#form-height-error');
    await height.fill('');
    await height.type('abc');
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Find your fit.' })).toBeVisible();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('tailor_user_measurements_v1')!));
    expect(typeof stored.height).toBe('number');
    expect(Number.isFinite(stored.height)).toBe(true);
  });

  test('the disabled submit button stays readable', async ({ page }) => {
    await page.locator('#form-height-error').fill('20');
    await page.waitForTimeout(200);
    const btn = page.getByRole('button', { name: 'Find my size' });
    await expect(btn).toBeDisabled();
    const style = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, bg: cs.backgroundColor, opacity: cs.opacity };
    });
    expect(style.color).toBe('rgb(255, 255, 255)');
    // Not fully transparent / not washed out
    expect(parseFloat(style.opacity)).toBeGreaterThan(0.5);
  });

  test('imperial validation messages use inches and pounds', async ({ page }) => {
    await page.getByRole('radio', { name: 'in · lb' }).click();
    await page.locator('#form-height-error').fill('20');
    await page.waitForTimeout(250);
    await expect(page.locator('[role="alert"]').filter({ hasText: /47 and 91 in/ })).toBeVisible();

    await page.locator('#form-height-error').fill('70');
    await page.locator('#form-weight-error').fill('10');
    await page.waitForTimeout(250);
    await expect(page.locator('[role="alert"]').filter({ hasText: /66 and 550 lb/ })).toBeVisible();
  });
});

test.describe('Validation — no browsers errors on rapid interaction', () => {
  test('spamming the steppers and chips never throws', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.waitForTimeout(300);

    for (let i = 0; i < 25; i++) {
      await page.getByRole('radio', { name: 'Pants' }).click({ force: true });
      await page.getByRole('radio', { name: 'Shirt' }).click({ force: true });
      await page.getByRole('button', { name: 'Increase Weight' }).click({ force: true });
      await page.getByRole('button', { name: 'Decrease Weight' }).click({ force: true });
    }
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });
});
