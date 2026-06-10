export function isIdxMarketHours(date = new Date()): boolean {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  const day = wib.getUTCDay()
  if (day < 1 || day > 5) return false
  const hour = wib.getUTCHours() + wib.getUTCMinutes() / 60
  return hour >= 9 && hour < 16.5
}
