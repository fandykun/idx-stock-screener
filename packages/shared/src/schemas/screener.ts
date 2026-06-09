import { z } from 'zod'

export const ScreenerMetricSchema = z.enum([
  'ticker',
  'price',
  'change1d',
  'rsi',
  'sma20',
  'sma50',
  'ma_crossover',
  'macd',
  'volume_surge',
  'pe',
  'pbv',
  'roe',
  'der',
  'market_cap',
  'sector',
])
export const ScreenerOperatorSchema = z.enum(['lt', 'lte', 'gt', 'gte', 'eq', 'between', 'in', 'cross_above', 'cross_below'])

export const ScreenerFilterSchema = z.object({
  metric: ScreenerMetricSchema,
  operator: ScreenerOperatorSchema,
  value: z.union([z.number(), z.string(), z.array(z.string()), z.tuple([z.number(), z.number()])]),
})

export const SortDirectionSchema = z.enum(['asc', 'desc']).default('asc')
export const SortBySchema = z.enum(['ticker', 'price', 'change1d', 'rsi', 'pe', 'pbv', 'roe', 'market_cap', 'volume', 'sector']).default('ticker')
export const TimeframeSchema = z.enum(['1W', '1M', '3M', '6M', '1Y']).default('1M')

export const ScreenerQuerySchema = z.object({
  filters: z.string().optional().transform((raw, context) => {
    if (!raw) return []
    try {
      return z.array(ScreenerFilterSchema).parse(JSON.parse(raw))
    } catch (error) {
      context.addIssue({ code: 'custom', message: error instanceof Error ? error.message : 'Invalid filters JSON' })
      return z.NEVER
    }
  }),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
  sortBy: SortBySchema,
  sortDir: SortDirectionSchema,
})

export type ScreenerMetric = z.infer<typeof ScreenerMetricSchema>
export type ScreenerOperator = z.infer<typeof ScreenerOperatorSchema>
export type ScreenerFilter = z.infer<typeof ScreenerFilterSchema>
export type ScreenerQuery = z.infer<typeof ScreenerQuerySchema>
