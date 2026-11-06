import { test, expect } from '@playwright/test';
import { seedStorage, MEN_TSHIRT, MEASUREMENTS_KEY } from './helpers';

test.describe('Input screen — chips and selectors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('gender chips update the selection and stay in one radiogroup', async ({ page }) => {
    const group = page.getByRole('radiogroup', { name: 'Gender selection' });
    await expect(group).toBeVisible();
    await expect(group.getByRole('radio')).toHaveCount(3);

    await group.getByRole('radio', { name: 'women' }).click();
    await expect(group.getByRole('radio', { name: 'women' })).toHaveAttribute('aria-checked', 'true');
    await expect(group.getByRole('radio', { name: 'men' })).toHaveAttribute('aria-checked', 'false');

    await group.getByRole('radio', { name: 'unisex' }).click();
    await expect(group.getByRole('radio', { name: 'unisex' })).toHaveAttribute('aria-checked', 'true');
  });

  test('garment chips select exactly one category', async ({ page }) => {
    const group = page.getByRole('radiogroup', { name: 'Clothing category selection' });
    await expect(group.getByRole('radio')).toHaveCount(4);

    for (const label of ['T-shirt', 'Shirt', 'Pants', 'Jacket']) {
      await group.getByRole('radio', { name: label, exact: true }).click();
      await expect(group.getByRole('radio', { name: label, exact: true })).toHaveAttribute('aria-checked', 'true');
      const checked = await group.getByRole('radio', { checked: true }).count();
      expect(checked, `exactly one garment chip selected for ${label}`).toBe(1);
    }
  });

  test('hips input appears only for Pants', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add' }).click();
    await expect(page.locator('#chest-val')).toBeVisible();
    await expect(page.locator('#waist-val')).toBeVisible();
    await expect(page.locator('#hips-val')).toHaveCount(0);

    await page.getByRole('radiogroup', { name: 'Clothing category selection' })
      .getByRole('radio', { name: 'Pants' }).click();
    await expect(page.locator('#hips-val')).toBeVisible();
    await expect(page.locator('#chest-val')).toHaveCount(0);
  });

  test('chest and waist expand and collapse', async ({ page }) => {
    const toggle = page.getByRole('button', { name: '+ Add' });
    await expect(page.locator('#chest-val')).toHaveCount(0);

    await toggle.click();
    await expect(page.locator('#chest-val')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveText('Hide');

    await toggle.click();
    await expect(page.locator('#chest-val')).toHaveCount(0);
    await expect(toggle).toHaveText('+ Add');
  });

  test('fit chips and descriptions match the selected fit', async ({ page }) => {
    const fits: Array<[string, RegExp]> = [
      ['Snug', /form-fitting/],
      ['Regular', /true to size/],
      ['Loose', /relaxed drape/],
    ];
    for (const [label, desc] of fits) {
      await page.getByRole('radio', { name: label }).click();
      await expect(page.getByRole('radio', { name: label })).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByText(desc)).toBeVisible();
    }
  });
});

test.describe('Unit toggle converts values in both directions', () => {
  test('metric → imperial → metric round-trips height and weight', async ({ page }) => {
    await page.goto('/');
    await seedStorage(page, { ...MEN_TSHIRT, height: 180, weight: 80 });
    await page.reload();
    await page.waitForTimeout(400);

    const heightInput = page.locator('#form-height-error');
    const weightInput = page.locator('#form-weight-error');

    await expect(heightInput).toHaveValue('180');
    await expect(weightInput).toHaveValue('80');

    // 180 cm -> 70.9 in ; 80 kg -> 176 lb
    await page.getByRole('radio', { name: 'in · lb' }).click();
    await expect(heightInput).toHaveValue('70.9');
    await expect(weightInput).toHaveValue('176');

    // back to metric
    await page.getByRole('radio', { name: 'cm · kg' }).click();
    await expect(heightInput).toHaveValue('180');
    await expect(weightInput).toHaveValue('80');
  });

  test('stepping in imperial mode changes the stored metric value by the right amount', async ({ page }) => {
    await seedStorage(page, { ...MEN_TSHIRT, height: 180, weight: 80, unit: 'imperial' });
    await page.goto('/');
    await page.waitForTimeout(400);

    const heightInput = page.locator('#form-height-error');
    await expect(heightInput).toHaveValue('70.9');
    await page.getByRole('button', { name: 'Increase Height' }).click();
    await expect(heightInput).toHaveValue('72.4'); // +1 inch = 181.6 cm

    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), MEASUREMENTS_KEY);
    expect(stored.height).toBeCloseTo(181.6, 1);
    expect(stored.unit).toBe('imperial');
  });

  test('round trip is lossless within 0.1 unit', async ({ page }) => {
    await seedStorage(page, { ...MEN_TSHIRT, height: 183, weight: 77, unit: 'metric' });
    await page.goto('/');
    await page.waitForTimeout(300);
    await page.getByRole('radio', { name: 'in · lb' }).click();
    await page.getByRole('radio', { name: 'cm · kg' }).click();
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), MEASUREMENTS_KEY);
    expect(Math.abs(stored.height - 183)).toBeLessThanOrEqual(0.6);
    expect(Math.abs(stored.weight - 77)).toBeLessThanOrEqual(0.6);
  });
});

test.describe('Height and weight steppers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
  });

  test('decrease button disables at the low limit and increase at the high limit', async ({ page }) => {
    const height = page.locator('#form-height-error');
    await height.fill('10');
    await page.waitForTimeout(150);
    await expect(page.getByRole('button', { name: 'Decrease Height' })).toBeDisabled();

    await height.fill('260');
    await page.waitForTimeout(150);
    await expect(page.getByRole('button', { name: 'Increase Height' })).toBeDisabled();
  });

  test('hold-to-repeat accelerates while the button is held', async ({ page }) => {
    const height = page.locator('#form-height-error');
    await height.fill('120');
    await page.waitForTimeout(200);

    const before = Number(await height.inputValue());
    const box = (await page.getByRole('button', { name: 'Increase Height' }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(900);
    await page.mouse.up();
    const after = Number(await height.inputValue());

    // A single click moves exactly 1; holding must move more than that.
    expect(after - before, 'hold-to-repeat should advance more than one step').toBeGreaterThan(1);
  });

  test('typed values are accepted and clamped to the stepper range', async ({ page }) => {
    const weight = page.locator('#form-weight-error');
    await weight.fill('90');
    await page.waitForTimeout(150);
    let stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), MEASUREMENTS_KEY);
    expect(stored.weight).toBe(90);

    await weight.fill('9999');
    await page.waitForTimeout(150);
    stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), MEASUREMENTS_KEY);
    expect(stored.weight).toBe(300); // clamped to max
  });

  test('decimal values are accepted', async ({ page }) => {
    const height = page.locator('#form-height-error');
    await height.fill('175.5');
    await page.waitForTimeout(150);
    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), MEASUREMENTS_KEY);
    expect(stored.height).toBeCloseTo(175.5, 1);
  });

  test('clearing the field does not crash the app', async ({ page }) => {
    const height = page.locator('#form-height-error');
    await height.fill('');
    await page.waitForTimeout(250);
    // App still alive: the submit button and headline are still rendered.
    await expect(page.getByRole('button', { name: 'Find my size' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Find your fit.' })).toBeVisible();
  });
});

test.describe('How to measure modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
  });

  test('opens, traps focus, and closes on Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'How to measure' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'How to measure' });
    await expect(dialog).toBeVisible();

    // focus is inside the dialog
    const inside = await page.evaluate(() =>
      document.querySelector('[role="dialog"]')!.contains(document.activeElement)
    );
    expect(inside, 'focus must move into the dialog').toBe(true);

    // Focus is trapped: tab through the whole dialog and never escape.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(() =>
        document.querySelector('[role="dialog"]')!.contains(document.activeElement)
      );
      expect(stillInside, `focus escaped the dialog after ${i + 1} tabs`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('closes on overlay tap but not on content tap', async ({ page }) => {
    await page.getByRole('button', { name: 'How to measure' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'How to measure' });
    await expect(dialog).toBeVisible();

    await page.mouse.click(8, 8); // top-left corner = overlay only
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'How to measure' }).first().click();
    await expect(dialog).toBeVisible();
    await dialog.getByText('Chest.', { exact: false }).click();
    await expect(dialog).toBeVisible();
  });

  test('shows hips guidance only for Pants', async ({ page }) => {
    await page.getByRole('button', { name: 'How to measure' }).first().click();
    await expect(page.getByRole('dialog', { name: 'How to measure' }).getByText('Hips.')).toHaveCount(0);

    await page.keyboard.press('Escape');
    await page.getByRole('radiogroup', { name: 'Clothing category selection' })
      .getByRole('radio', { name: 'Pants' }).click();
    await page.getByRole('button', { name: 'How to measure' }).first().click();
    await expect(page.getByRole('dialog', { name: 'How to measure' }).getByText('Hips.')).toBeVisible();
  });

  test('locks background scroll while open and restores it on close', async ({ page }) => {
    await page.getByRole('button', { name: 'How to measure' }).first().click();
    await expect(page.getByRole('dialog', { name: 'How to measure' })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  });
});

test.describe('Persistence', () => {
  test('last-entered values are restored after refresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);

    await page.getByRole('radiogroup', { name: 'Gender selection' }).getByRole('radio', { name: 'women' }).click();
    await page.getByRole('radiogroup', { name: 'Clothing category selection' }).getByRole('radio', { name: 'jacket' }).click();
    await page.locator('#form-height-error').fill('172');
    await page.locator('#form-weight-error').fill('63');
    await page.getByRole('radio', { name: 'Loose' }).click();
    await page.getByRole('button', { name: '+ Add' }).click();
    await page.locator('#chest-val').fill('94');
    await page.locator('#waist-val').fill('76');

    await page.reload();
    await page.waitForTimeout(500);

    await expect(page.getByRole('radiogroup', { name: 'Gender selection' }).getByRole('radio', { name: 'women' }))
      .toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('radiogroup', { name: 'Clothing category selection' }).getByRole('radio', { name: 'Jacket' }))
      .toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#form-height-error')).toHaveValue('172');
    await expect(page.locator('#form-weight-error')).toHaveValue('63');
    await expect(page.getByRole('radio', { name: 'Loose' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: '+ Add' }).click();
    await expect(page.locator('#chest-val')).toHaveValue('94');
    await expect(page.locator('#waist-val')).toHaveValue('76');
  });
});
