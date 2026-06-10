import { useMutation } from '@tanstack/react-query'
import { AppNav } from '../components/AppNav'
import { apiClient } from '../lib/apiClient'

interface TelegramTokenResponse { token: string; command: string }

export function Settings() {
  const tokenMutation = useMutation({
    mutationFn: async () => (await apiClient.post<TelegramTokenResponse>('/settings/telegram-token')).data,
  })

  return (
    <main>
      <AppNav />
      <header className="hero"><p>Settings</p><h1>Link Telegram alerts and control personal screener features.</h1></header>
      <section className="panel stack">
        <div>
          <h2>Telegram alert delivery</h2>
          <p className="empty">Generate a short-lived link token, then send the command to the Telegram bot. The API stores demo state in memory until the database-backed account phase.</p>
        </div>
        <button className="primary" onClick={() => tokenMutation.mutate()} disabled={tokenMutation.isPending}>Generate Telegram token</button>
        {tokenMutation.error ? <p className="error">{tokenMutation.error.message}</p> : null}
        {tokenMutation.data ? <pre className="token-box">{tokenMutation.data.command}</pre> : null}
      </section>
    </main>
  )
}
