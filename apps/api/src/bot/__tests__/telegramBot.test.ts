import { describe, expect, it } from 'vitest'
import { createTelegramBot, renderStartMessage } from '../telegramBot.js'

describe('telegram bot scaffold', () => {
  it('renders a safe start message without exposing the raw token', () => {
    const message = renderStartMessage('abc123secret')
    expect(message).toContain('IDX Stock Screener')
    expect(message).not.toContain('abc123secret')
  })

  it('does not create a bot when TELEGRAM_BOT_TOKEN is missing', () => {
    expect(createTelegramBot(undefined)).toBeNull()
  })
})
