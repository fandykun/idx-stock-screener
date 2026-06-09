import type { StockRow } from '../types'

export function FundamentalPanel({ stock }: { stock: StockRow }) {
  const items = [
    ['P/E', stock.pe.toFixed(1)], ['P/BV', stock.pbv.toFixed(2)], ['ROE', `${(stock.roe * 100).toFixed(1)}%`],
    ['DER', stock.der.toFixed(2)], ['EPS', stock.eps.toFixed(0)], ['Market cap', `${(stock.marketCap / 1_000_000_000_000).toFixed(1)}T`],
  ]
  return <section className="panel grid-panel">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
}
