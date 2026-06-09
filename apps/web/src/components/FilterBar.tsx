import type { FilterRule } from '../hooks/useScreener'

const metrics = ['rsi', 'pe', 'pbv', 'roe', 'der', 'sector', 'market_cap', 'price', 'volume_surge']
const operators = ['lt', 'lte', 'gt', 'gte', 'eq']

interface Props {
  filters: FilterRule[]
  setFilters: (filters: FilterRule[]) => void
}

export function FilterBar({ filters, setFilters }: Props) {
  return (
    <section className="panel filter-bar">
      <div className="section-title">Filter rules</div>
      {filters.map((filter, index) => (
        <div className="filter-row" key={`${filter.metric}-${index}`}>
          <select value={filter.metric} onChange={(event) => update(index, { ...filter, metric: event.target.value })}>{metrics.map((metric) => <option key={metric}>{metric}</option>)}</select>
          <select value={filter.operator} onChange={(event) => update(index, { ...filter, operator: event.target.value })}>{operators.map((operator) => <option key={operator}>{operator}</option>)}</select>
          <input value={String(filter.value)} onChange={(event) => update(index, { ...filter, value: parseValue(event.target.value, filter.metric) })} />
          <button type="button" onClick={() => setFilters(filters.filter((_, filterIndex) => filterIndex !== index))}>Remove</button>
        </div>
      ))}
      <button type="button" className="primary" onClick={() => setFilters([...filters, { metric: 'rsi', operator: 'lt', value: 30 }])}>Add rule</button>
    </section>
  )

  function update(index: number, next: FilterRule): void {
    setFilters(filters.map((filter, filterIndex) => filterIndex === index ? next : filter))
  }
}

function parseValue(value: string, metric: string): number | string {
  if (metric === 'sector' || metric === 'market_cap') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}
