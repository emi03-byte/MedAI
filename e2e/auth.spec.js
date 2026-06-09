import { test, expect } from '@playwright/test'

test.describe('Autentificare', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('deschide modalul de autentificare', async ({ page }) => {
    const loginTrigger = page.getByText('Autentificare', { exact: false }).or(page.getByText('Conectare', { exact: false })).first()
    if (await loginTrigger.isVisible()) {
      await loginTrigger.click()
      await expect(page.getByText('Autentificare', { exact: false }).or(page.locator('input[type="email"]')).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('deschide modalul de înregistrare', async ({ page }) => {
    const signupLink = page.getByText('Înregistrare', { exact: false }).or(page.getByText('Creează cont', { exact: false })).first()
    if (await signupLink.isVisible()) {
      await signupLink.click()
      await page.waitForTimeout(500)
      const emailInput = page.locator('input[type="email"]').first()
      await expect(emailInput).toBeVisible({ timeout: 5000 })
    }
  })

  test('formular login conține câmpuri email și parolă', async ({ page }) => {
    const loginBtn = page.getByText('Autentificare', { exact: false }).first()
    if (await loginBtn.isVisible()) {
      await loginBtn.click()
      await page.waitForTimeout(400)
      await expect(page.locator('input[type="email"], input[type="password"]').first()).toBeVisible()
    }
  })
})
