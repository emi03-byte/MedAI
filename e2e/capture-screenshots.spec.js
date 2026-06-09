import { test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'docs', 'licenta', 'assets', 'screenshots')

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
}

test.describe('Capturi documentație licență', () => {
  test('generează toate capturile UI', async ({ page }) => {
    test.setTimeout(120000)
    await page.setViewportSize({ width: 1440, height: 900 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await shot(page, '01-pagina-principala')

    const copiiBtn = page.getByText('Copii', { exact: false }).first()
    if (await copiiBtn.isVisible()) {
      await copiiBtn.click()
      await page.waitForTimeout(600)
      await shot(page, '02-filtru-varsta-copii')
    }

    const toateBtn = page.getByText('Toate', { exact: true }).first()
    if (await toateBtn.isVisible()) await toateBtn.click()
    await page.waitForTimeout(400)

    const compBtns = ['A', 'B', 'C1']
    for (const c of compBtns) {
      const btn = page.getByText(c, { exact: true }).first()
      if (await btn.isVisible()) {
        await btn.click()
        await page.waitForTimeout(400)
        break
      }
    }
    await shot(page, '03-filtru-compensare')

    const loginBtn = page.getByText('Autentificare', { exact: false }).first()
    if (await loginBtn.isVisible()) {
      await loginBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '04-modal-autentificare')
      const close = page.locator('.new-patient-modal-header button, .close-btn, button:has-text("×")').first()
      if (await close.isVisible()) await close.click()
      else await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }

    const signupLink = page.getByText('Înregistrare', { exact: false }).or(page.getByText('Creează cont', { exact: false })).first()
    if (await signupLink.isVisible()) {
      await signupLink.click()
      await page.waitForTimeout(500)
      await shot(page, '05-modal-inregistrare')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }

    const addMedBtn = page.locator('.medicine-table-add-medicine-btn').first()
    if (await addMedBtn.isVisible()) {
      await addMedBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '10-medicament-personalizat')
      await page.keyboard.press('Escape')
    }

    const chatBtn = page.locator('.chat-button-sidebar, .chat-button').first()
    if (await chatBtn.isVisible()) {
      await chatBtn.click()
      await page.waitForTimeout(600)
      await shot(page, '11-chatbot-deschis')
      await page.keyboard.press('Escape')
    }

    const statsBtn = page.getByText('Statistici', { exact: false }).first()
    if (await statsBtn.isVisible()) {
      await statsBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '14-statistici')
      await page.keyboard.press('Escape')
    }

    const nightBtn = page.locator('[class*="night"], [class*="dark"], button[title*="mod"]').first()
    if (await nightBtn.isVisible()) {
      await nightBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '13-mod-intunecat')
      await nightBtn.click()
    }

    const historyBtn = page.getByText('Istoric', { exact: false }).first()
    if (await historyBtn.isVisible()) {
      await historyBtn.click()
      await page.waitForTimeout(800)
      await shot(page, '09-istoric-retete')
    }
  })
})
