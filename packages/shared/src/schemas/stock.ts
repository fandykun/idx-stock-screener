import { z } from 'zod'
import { TimeframeSchema } from './screener.js'

export const StockParamsSchema = z.object({ ticker: z.string().min(2).max(8).transform((value) => value.toUpperCase()) })
export const CandlesQuerySchema = z.object({ timeframe: TimeframeSchema })

export type StockParams = z.infer<typeof StockParamsSchema>
export type CandlesQuery = z.infer<typeof CandlesQuerySchema>
