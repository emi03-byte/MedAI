import { test, expect } from '@playwright/test'

test.describe('Chatbot AI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('butonul chat este vizibil pe pagina principală', async ({ page }) => {
    const chatBtn = page.locator('.chat-button-sidebar, .chat-button').first()
    await expect(chatBtn).toBeVisible({ timeout: 10000 })
  })

  test('deschide modalul chat la click', async ({ page }) => {
    const chatBtn = page.locator('.chat-button-sidebar, .chat-button').first()
    await chatBtn.click()
    await page.waitForTimeout(600)
    const modal = page.locator('.chat-modal, [class*="chat-modal"], .chat-container').first()
    await expect(modal.or(page.locator('textarea, input[placeholder*="mesaj"]')).first()).toBeVisible({ timeout: 5000 })
  })

  test('afișează mesaj de bun venit sau cerere autentificare', async ({ page }) => {
    await page.locator('.chat-button').first().click()
    await page.waitForTimeout(600)
    const body = await page.textContent('body')
    const hasWelcome = body.includes('CNAS') || body.includes('Autentificare') || body.includes('simptome')
    expect(hasWelcome).toBeTruthy()
  })
})
