import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AppNav } from '../components/AppNav'
import { apiClient } from '../lib/apiClient'

type AlertType = 'TECHNICAL' | 'FUNDAMENTAL'
type AlertMetric = 'price' | 'rsi' | 'ma_crossover' | 'pe' | 'roe'
type AlertOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'cross_above' | 'cross_below'

interface AlertRecord {
  id: string
  ticker: string
  type: AlertType
  metric: AlertMetric
  operator: AlertOperator
  threshold: number
  active: boolean
  lastCheckedAt: string | null
  lastFired: string | null
  createdAt: string
}

export function Alerts() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ ticker: 'BBCA', type: 'TECHNICAL' as AlertType, metric: 'rsi' as AlertMetric, operator: 'lt' as AlertOperator, threshold: 30 })
  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await apiClient.get<{ data: AlertRecord[] }>('/alerts')).data.data,
  })
  const createMutation = useMutation({
    mutationFn: async () => (await apiClient.post<AlertRecord>('/alerts', form)).data,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['alerts'] }) },
  })
  const toggleMutation = useMutation({
    mutationFn: async (alert: AlertRecord) => (await apiClient.patch<AlertRecord>(`/alerts/${alert.id}`, { active: !alert.active })).data,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['alerts'] }) },
  })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/alerts/${id}`) },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['alerts'] }) },
  })

  return (
    <main>
      <AppNav />
      <header className="hero"><p>Alerts</p><h1>Create signals for price, RSI, moving averages, and valuation thresholds.</h1></header>
      <section className="panel stack">
        <form className="alert-form" onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}>
          <input value={form.ticker} onChange={(event) => setForm({ ...form, ticker: event.target.value.toUpperCase() })} placeholder="Ticker" />
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AlertType })}><option>TECHNICAL</option><option>FUNDAMENTAL</option></select>
          <select value={form.metric} onChange={(event) => setForm({ ...form, metric: event.target.value as AlertMetric })}><option value="price">Price</option><option value="rsi">RSI</option><option value="ma_crossover">MA spread</option><option value="pe">P/E</option><option value="roe">ROE</option></select>
          <select value={form.operator} onChange={(event) => setForm({ ...form, operator: event.target.value as AlertOperator })}><option value="lt">&lt;</option><option value="lte">≤</option><option value="gt">&gt;</option><option value="gte">≥</option><option value="cross_above">Cross above</option><option value="cross_below">Cross below</option></select>
          <input type="number" value={form.threshold} onChange={(event) => setForm({ ...form, threshold: Number(event.target.value) })} />
          <button className="primary" disabled={createMutation.isPending}>Create alert</button>
        </form>
        {createMutation.error ? <p className="error">{createMutation.error.message}</p> : null}
        {isLoading ? <p className="skeleton">Loading alerts…</p> : null}
        {error ? <p className="error">{error.message}</p> : null}
        <div className="cards-grid">
          {(data ?? []).map((alert) => (
            <article className="mini-card" key={alert.id}>
              <strong>{alert.ticker}</strong>
              <span>{alert.type.toLowerCase()} · {alert.metric} {alert.operator} {alert.threshold}</span>
              <p>Status: {alert.active ? 'Active' : 'Paused'} · Last fired: {alert.lastFired ? new Date(alert.lastFired).toLocaleString() : 'Never'}</p>
              <div className="button-row"><button onClick={() => toggleMutation.mutate(alert)}>{alert.active ? 'Pause' : 'Resume'}</button><button onClick={() => deleteMutation.mutate(alert.id)}>Delete</button></div>
            </article>
          ))}
        </div>
        {!isLoading && (data?.length ?? 0) === 0 ? <p className="empty">No alerts yet.</p> : null}
      </section>
    </main>
  )
}
