import { useMemo, useState } from 'react'
import { AppNav } from '../components/AppNav'
import { FilterBar } from '../components/FilterBar'
import { StockTable } from '../components/StockTable'
import { useScreener, type FilterRule } from '../hooks/useScreener'

export function Screener() {
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sortBy, setSortBy] = useState('ticker')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useScreener(filters, sortBy, sortDir, page, 50)
  const rows = useMemo(() => data?.data ?? [], [data])
  return (
    <main>
      <AppNav />
      <header className="hero"><p>IDX Stock Screener</p><h1>Find Indonesian stocks by valuation, momentum, and risk signals.</h1></header>
      <FilterBar filters={filters} setFilters={(next) => { setPage(1); setFilters(next) }} />
      {isLoading ? <div className="panel skeleton">Loading screener results…</div> : null}
      {error ? <div className="panel error">{error.message}<button onClick={() => void refetch()}>Retry</button></div> : null}
      <StockTable rows={rows} sortBy={sortBy} sortDir={sortDir} onSort={(column) => { setSortDir(sortBy === column && sortDir === 'asc' ? 'desc' : 'asc'); setSortBy(column) }} />
      <nav className="pager"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} · {data?.total ?? 0} results</span><button disabled={!data || page * data.limit >= data.total} onClick={() => setPage((value) => value + 1)}>Next</button></nav>
    </main>
  )
}
