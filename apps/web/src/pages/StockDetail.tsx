import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CandleChart } from '../components/CandleChart'
import { FundamentalPanel } from '../components/FundamentalPanel'
import { apiClient } from '../lib/apiClient'
import type { Candle, StockRow } from '../types'

export function StockDetail() {
  const { ticker = '' } = useParams()
  const [timeframe, setTimeframe] = useState('1M')
  const [showMa20, setShowMa20] = useState(true)
  const [showMa50, setShowMa50] = useState(false)
  const [showBollinger, setShowBollinger] = useState(false)
  const stock = useQuery({ queryKey: ['stock', ticker], queryFn: async () => (await apiClient.get<StockRow>(`/stocks/${ticker}`)).data })
  const candles = useQuery({ queryKey: ['candles', ticker, timeframe], queryFn: async () => (await apiClient.get<{ data: Candle[] }>(`/stocks/${ticker}/candles`, { params: { timeframe } })).data.data })
  if (stock.isLoading || candles.isLoading) return <main><div className="panel skeleton">Loading stock detail…</div></main>
  if (stock.error || candles.error || !stock.data || !candles.data) return <main><div className="panel error">Unable to load stock detail.</div></main>
  return (
    <main>
      <Link to="/" className="back">← Back to screener</Link>
      <header className="stock-header"><div><p>{stock.data.sector}</p><h1>{stock.data.ticker} · {stock.data.name}</h1></div><strong>Rp {new Intl.NumberFormat('id-ID').format(stock.data.price)}</strong></header>
      <section className="panel controls">{['1W', '1M', '3M', '6M', '1Y'].map((item) => <button className={timeframe === item ? 'active' : ''} key={item} onClick={() => setTimeframe(item)}>{item}</button>)}<label><input type="checkbox" checked={showMa20} onChange={(event) => setShowMa20(event.target.checked)} /> MA20</label><label><input type="checkbox" checked={showMa50} onChange={(event) => setShowMa50(event.target.checked)} /> MA50</label><label><input type="checkbox" checked={showBollinger} onChange={(event) => setShowBollinger(event.target.checked)} /> Bollinger</label></section>
      <section className="panel"><CandleChart candles={candles.data} showMa20={showMa20} showMa50={showMa50} showBollinger={showBollinger} /></section>
      <section className="detail-grid"><div className="panel"><h2>Technical snapshot</h2><p>RSI: <strong className={(stock.data.rsi ?? 50) <= 30 ? 'positive' : (stock.data.rsi ?? 50) >= 70 ? 'negative' : ''}>{stock.data.rsi?.toFixed(1)}</strong></p><p>MACD: {stock.data.macd?.toFixed(2)} / signal {stock.data.macdSignal?.toFixed(2)}</p><button disabled>Login to add watchlist</button></div><FundamentalPanel stock={stock.data} /></section>
    </main>
  )
}
