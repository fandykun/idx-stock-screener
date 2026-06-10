import { z } from 'zod'

export const AlertTypeSchema = z.enum(['TECHNICAL', 'FUNDAMENTAL'])
export const AlertMetricSchema = z.enum(['price', 'rsi', 'ma_crossover', 'pe', 'roe'])
export const AlertOperatorSchema = z.enum(['lt', 'lte', 'gt', 'gte', 'cross_above', 'cross_below'])

export const AlertCreateSchema = z.object({
  ticker: z.string().min(2).max(8).transform((value) => value.toUpperCase()),
  type: AlertTypeSchema,
  metric: AlertMetricSchema,
  operator: AlertOperatorSchema,
  threshold: z.coerce.number().finite(),
})

export const AlertPatchSchema = z.object({
  active: z.boolean(),
})

export type AlertCreateInput = z.infer<typeof AlertCreateSchema>
export type AlertPatchInput = z.infer<typeof AlertPatchSchema>
