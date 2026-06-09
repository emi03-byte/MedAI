import { test, expect } from '@playwright/test'

async function openChat(page) {
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('openChatBot')))
  await page.waitForTimeout(800)
}

test.describe('Chatbot AI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('componenta chat există în DOM', async ({ page }) => {
    const chatBtn = page.locator('.chat-button, .chat-button-sidebar').first()
    await expect(chatBtn).toBeAttached({ timeout: 15000 })
  })

  test('deschide modalul chat prin event openChatBot', async ({ page }) => {
    await openChat(page)
    const modal = page.locator('.chat-modal, [class*="chat-modal"], .chat-overlay, .chat-messages').first()
    const visible = await modal.isVisible().catch(() => false)
    const body = await page.textContent('body')
    const textOk = body.includes('CNAS') || body.includes('Autentificare') || body.includes('simptome') || body.includes('Bună')
    expect(visible || textOk).toBeTruthy()
  })

  test('afișează mesaj de bun venit sau cerere autentificare', async ({ page }) => {
    await openChat(page)
    const body = await page.textContent('body')
    const hasWelcome = body.includes('CNAS') || body.includes('Autentificare') || body.includes('simptome') || body.includes('aprobare')
    expect(hasWelcome).toBeTruthy()
  })
})
