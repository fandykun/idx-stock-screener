import { Link } from 'react-router-dom'
import type { StockRow } from '../types'

interface Props {
  rows: StockRow[]
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSort: (column: string) => void
}

const columns = ['ticker', 'price', 'change1d', 'rsi', 'pe', 'marketCap', 'sector']

export function StockTable({ rows, sortBy, sortDir, onSort }: Props) {
  return (
    <div className="table-wrap panel">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}><button type="button" onClick={() => onSort(column)}>{column}{sortBy === column ? ` ${sortDir === 'asc' ? '↑' : '↓'}` : ''}</button></th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ticker}>
              <td><Link to={`/stock/${row.ticker}`}><strong>{row.ticker}</strong><span>{row.name}</span></Link></td>
              <td>{formatCurrency(row.price)}</td>
              <td className={row.change1d >= 0 ? 'positive' : 'negative'}>{row.change1d.toFixed(2)}%</td>
              <td>{row.rsi?.toFixed(1) ?? '—'}</td>
              <td>{row.pe.toFixed(1)}</td>
              <td>{formatMarketCap(row.marketCap)}</td>
              <td>{row.sector}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <div className="empty">No stocks match the current filters.</div> : null}
    </div>
  )
}

function formatCurrency(value: number): string { return new Intl.NumberFormat('id-ID').format(value) }
function formatMarketCap(value: number): string { return `${(value / 1_000_000_000_000).toFixed(1)}T` }
