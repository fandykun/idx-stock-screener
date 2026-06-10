import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { apiClient } from '../lib/apiClient'
import type { StockRow } from '../types'

interface WatchlistItem extends StockRow { addedAt: string }

export function Watchlist() {
  const queryClient = useQueryClient()
  const [ticker, setTicker] = useState('BBCA')
  const { data, isLoading, error } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => (await apiClient.get<{ data: WatchlistItem[] }>('/watchlist')).data.data,
  })
  const addMutation = useMutation({
    mutationFn: async (nextTicker: string) => (await apiClient.post<WatchlistItem>(`/watchlist/${nextTicker}`)).data,
    onSuccess: async () => { setTicker(''); await queryClient.invalidateQueries({ queryKey: ['watchlist'] }) },
  })
  const removeMutation = useMutation({
    mutationFn: async (nextTicker: string) => { await apiClient.delete(`/watchlist/${nextTicker}`) },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['watchlist'] }) },
  })

  return (
    <main>
      <AppNav />
      <header className="hero"><p>Watchlist</p><h1>Track the IDX names you care about first.</h1></header>
      <section className="panel stack">
        <form className="inline-form" onSubmit={(event) => { event.preventDefault(); if (ticker.trim()) addMutation.mutate(ticker.trim().toUpperCase()) }}>
          <input value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} placeholder="Ticker, e.g. BBCA" />
          <button className="primary" disabled={addMutation.isPending}>Add stock</button>
        </form>
        {addMutation.error ? <p className="error">{addMutation.error.message}</p> : null}
        {isLoading ? <p className="skeleton">Loading watchlist…</p> : null}
        {error ? <p className="error">{error.message}</p> : null}
        <div className="cards-grid">
          {(data ?? []).map((item) => (
            <article className="mini-card" key={item.ticker}>
              <Link to={`/stock/${item.ticker}`}><strong>{item.ticker}</strong><span>{item.name}</span></Link>
              <p>{item.sector}</p>
              <div><strong>{item.price.toLocaleString('id-ID')}</strong><span className={item.change1d >= 0 ? 'positive' : 'negative'}>{item.change1d.toFixed(2)}%</span></div>
              <button onClick={() => removeMutation.mutate(item.ticker)} disabled={removeMutation.isPending}>Remove</button>
            </article>
          ))}
        </div>
        {!isLoading && (data?.length ?? 0) === 0 ? <p className="empty">No stocks in your watchlist yet.</p> : null}
      </section>
    </main>
  )
}
