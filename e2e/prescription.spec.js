import { test, expect } from '@playwright/test'

test.describe('Flux rețetă', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('panoul de rețetă este vizibil', async ({ page }) => {
    await expect(page.locator('.prescription-panel').first()).toBeVisible({ timeout: 10000 })
  })

  test('buton adăugare medicament personalizat', async ({ page }) => {
    const addBtn = page.locator('.medicine-table-add-medicine-btn, button:has-text("Adaugă")').first()
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(500)
      await expect(page.locator('.new-patient-modal-content, [class*="modal"]').first()).toBeVisible({ timeout: 5000 })
    }
  })
})
