import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import type { PageResponse, StockRow } from '../types'

export interface FilterRule {
  metric: string
  operator: string
  value: number | string | string[] | [number, number]
}

export function useScreener(filters: FilterRule[], sortBy: string, sortDir: 'asc' | 'desc', page: number, limit: number) {
  return useQuery({
    queryKey: ['screener', filters, sortBy, sortDir, page, limit],
    queryFn: async () => {
      const response = await apiClient.get<PageResponse<StockRow>>('/screener', { params: { filters: JSON.stringify(filters), sortBy, sortDir, page, limit } })
      return response.data
    },
  })
}
