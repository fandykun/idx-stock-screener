export function calculateRSI(closes: readonly number[], period = 14): number | null {
  if (!Number.isInteger(period) || period <= 0 || closes.length < period + 1) return null

  let averageGain = 0
  let averageLoss = 0

  for (let index = 1; index <= period; index += 1) {
    const current = closes[index]
    const previous = closes[index - 1]
    if (current === undefined || previous === undefined) return null
    const change = current - previous
    if (change >= 0) averageGain += change
    else averageLoss += Math.abs(change)
  }

  averageGain /= period
  averageLoss /= period

  for (let index = period + 1; index < closes.length; index += 1) {
    const current = closes[index]
    const previous = closes[index - 1]
    if (current === undefined || previous === undefined) return null
    const change = current - previous
    const gain = Math.max(change, 0)
    const loss = Math.max(-change, 0)
    averageGain = (averageGain * (period - 1) + gain) / period
    averageLoss = (averageLoss * (period - 1) + loss) / period
  }

  if (averageLoss === 0) return averageGain === 0 ? 50 : 100
  if (averageGain === 0) return 0

  const relativeStrength = averageGain / averageLoss
  return 100 - 100 / (1 + relativeStrength)
}
