import { expect, type Page } from '@playwright/test';

export type Category = 'coconut' | 'construction';

/** Sign in through the real screen with the demo code. A new phone number registers a new user. */
export async function signIn(page: Page, category: Category, roleId: string, phone?: string) {
  await page.goto(`/#/${category}/login`);
  await page.getByTestId(`login-role-${roleId}`).click();
  if (phone) await page.locator('input[type="tel"]').fill(phone);
  await page.locator('button[type="submit"]').click(); // send the code
  await page.locator('input[maxlength="6"]').waitFor();
  await page.locator('button[type="submit"]').click(); // verify (the demo code is prefilled)
  await expect(page).toHaveURL(new RegExp(`#/${category}/dashboard$`));
}

export async function signOut(page: Page) {
  await page.getByTestId('account-menu').click();
  await page.getByTestId('logout').click();
  await expect(page).toHaveURL(/#\/$/);
}
