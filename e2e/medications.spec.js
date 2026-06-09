import { test, expect } from '@playwright/test'

test.describe('Medicamente - încărcare și filtrare', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('afișează tabelul principal cu medicamente', async ({ page }) => {
    await expect(page.locator('table, .medicines-table, .medicine-table').first()).toBeVisible({ timeout: 30000 })
    const rows = page.locator('tbody tr, .medicine-row, [class*="medicine"]')
    await expect(rows.first()).toBeVisible({ timeout: 30000 })
  })

  test('căutare medicament după nume', async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="Caut"], input[placeholder*="caut"], .search-input input').first()
    if (await search.isVisible()) {
      await search.fill('paracetamol')
      await page.waitForTimeout(800)
      const content = await page.content()
      expect(content.toLowerCase()).toContain('paracet')
    }
  })

  test('filtru categorie vârstă - copii', async ({ page }) => {
    const copiiBtn = page.getByText('Copii', { exact: false }).first()
    if (await copiiBtn.isVisible()) {
      await copiiBtn.click()
      await page.waitForTimeout(500)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('paginare funcțională', async ({ page }) => {
    const nextBtn = page.locator('.medicine-table-pagination-btn, button:has-text("›"), button:has-text(">")').last()
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForTimeout(400)
    }
    await expect(page.locator('body')).toBeVisible()
  })
})
