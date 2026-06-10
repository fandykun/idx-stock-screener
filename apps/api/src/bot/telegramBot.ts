import { Bot } from 'grammy'

export function createTelegramBot(token: string | undefined): Bot | null {
  if (!token) return null
  const bot = new Bot(token)

  bot.command('start', async (ctx) => {
    const tokenArg = ctx.match.trim()
    await ctx.reply(renderStartMessage(tokenArg || undefined))
  })

  return bot
}

export function renderStartMessage(linkToken: string | undefined): string {
  if (!linkToken) {
    return [
      'IDX Stock Screener alerts are ready.',
      '',
      'Open Settings in the web app, generate a Telegram token, then send /start <token> here to link your account.',
    ].join('\n')
  }

  return [
    'IDX Stock Screener alerts are ready.',
    '',
    'Your Telegram account link request was received. Return to Settings to confirm alert delivery status.',
  ].join('\n')
}
