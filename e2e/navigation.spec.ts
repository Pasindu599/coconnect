import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

test('the home page offers both categories and each opens its own landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('category-card-coconut')).toBeVisible();
  await expect(page.getByTestId('category-card-construction')).toBeVisible();

  await page.getByTestId('category-card-construction').click();
  await expect(page).toHaveURL(/#\/construction$/);
  await expect(page.getByTestId(/^role-card-/)).toHaveCount(4);
  await expect(page.getByTestId('navbar-category')).toBeVisible();

  await page.getByTestId('navbar-category').click(); // back to the picker
  await page.getByTestId('category-card-coconut').click();
  await expect(page).toHaveURL(/#\/coconut$/);
  await expect(page.getByTestId(/^role-card-/)).toHaveCount(3);
});

test('a role card goes to sign-in with that role selected', async ({ page }) => {
  await page.goto('/#/construction');
  await page.getByTestId('role-card-subcontractor').getByRole('button').click();
  await expect(page).toHaveURL(/#\/construction\/login$/);
  await expect(page.getByTestId('login-role-subcontractor')).toHaveAttribute('aria-pressed', 'true');
});

test('deep links and the back button work', async ({ page }) => {
  await page.goto('/#/construction/login');
  await expect(page.getByTestId('login-category')).toHaveText('Construction');

  await page.goto('/#/coconut');
  await expect(page.getByTestId('role-cards')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('login-category')).toHaveText('Construction');
});

test('the old #/login link still works', async ({ page }) => {
  await page.goto('/#/login');
  await expect(page.getByTestId('login-category')).toBeVisible();
});

test('an unknown address falls back to the home page', async ({ page }) => {
  await page.goto('/#/mining/dashboard');
  await expect(page.getByTestId('category-card-coconut')).toBeVisible();
});

test('a protected page asks you to sign in', async ({ page }) => {
  await page.goto('/#/construction/dashboard');
  await expect(page.getByTestId('login-category')).toBeVisible();
});

test('the interface switches language', async ({ page }) => {
  await page.goto('/');
  await page.getByText('සිංහල (SI)').click();
  await expect(page.getByText('What do you need help with?')).toHaveCount(0);
  await page.getByText('English (EN)').click();
  await expect(page.getByText('What do you need help with?')).toBeVisible();
});

test('one person can hold a role in each category and switch between them', async ({ page }) => {
  await signIn(page, 'construction', 'client');
  await expect(page.getByText('Client Operations Hub')).toBeVisible();

  await page.goto('/#/coconut/dashboard');
  await expect(page.getByTestId('join-category')).toBeVisible();
  await page.getByTestId('join-role-owner').click();
  await expect(page.getByText('Landowner Operations Hub')).toBeVisible();

  await page.goto('/#/construction/dashboard');
  await expect(page.getByText('Client Operations Hub')).toBeVisible();
});

test('construction data never shows up in the coconut dashboard, and the reverse', async ({ page }) => {
  await signIn(page, 'coconut', 'owner');
  await expect(page.getByText('Coconut Harvesting & Bunch Lowering').first()).toBeVisible();
  await expect(page.getByText('Foundation & Masonry Work')).toHaveCount(0);
});
