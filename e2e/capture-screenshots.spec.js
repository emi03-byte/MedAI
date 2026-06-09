import { test } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'docs', 'licenta', 'assets', 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
}

test.describe('Capturi documentație licență', () => {
  test('generează capturile UI', async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: 1440, height: 900 })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(4000)
    await shot(page, '01-pagina-principala')

    const copiiBtn = page.getByText('Copii', { exact: false }).first()
    if (await copiiBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await copiiBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '02-filtru-varsta-copii')
    }

    await shot(page, '03-filtru-compensare')

    await page.locator('.sidebar-avatar').click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(400)
    await shot(page, '04-meniu-cont')

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('openChatBot')))
    await page.waitForTimeout(800)
    await shot(page, '11-chatbot-deschis')
    await page.keyboard.press('Escape')

    const addMedBtn = page.locator('.medicine-table-add-medicine-btn').first()
    if (await addMedBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addMedBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '10-medicament-personalizat')
      await page.keyboard.press('Escape')
    }

    await page.locator('.sidebar-avatar').click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(300)
    const statsItem = page.getByText('Setări', { exact: false }).first()
    if (await statsItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statsItem.click()
      await page.waitForTimeout(500)
      await shot(page, '14-statistici')
      await page.keyboard.press('Escape')
    }
  })
})
