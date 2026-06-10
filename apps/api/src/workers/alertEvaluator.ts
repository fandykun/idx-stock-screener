import { getStock } from '../data/demoData.js'
import { listAllAlerts, markAlertChecked, markAlertFired, type AlertRecord } from '../data/personalStore.js'
import { getStockSnapshot } from '../lib/screenerEngine.js'

export interface TelegramAlertJob {
  userId: string
  ticker: string
  alertId: string
  message: string
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

export function evaluateAlertsOnce(now = new Date()): TelegramAlertJob[] {
  const jobs: TelegramAlertJob[] = []
  for (const alert of listAllAlerts()) {
    if (!alert.active) continue
    const currentValue = getCurrentValue(alert)
    markAlertChecked(alert.id, now)
    if (currentValue === null) continue
    if (!conditionMatches(currentValue, alert.operator, alert.threshold)) continue
    if (alert.lastFired && now.getTime() - new Date(alert.lastFired).getTime() <= FOUR_HOURS_MS) continue
    markAlertFired(alert.id, now)
    jobs.push({
      userId: alert.userId,
      ticker: alert.ticker,
      alertId: alert.id,
      message: buildAlertMessage(alert, currentValue),
    })
  }
  return jobs
}

function getCurrentValue(alert: AlertRecord): number | null {
  const stock = getStock(alert.ticker)
  if (!stock) return null
  const snapshot = getStockSnapshot(stock)
  switch (alert.metric) {
    case 'price': return snapshot.price
    case 'rsi': return snapshot.rsi
    case 'pe': return snapshot.pe
    case 'roe': return snapshot.roe
    case 'ma_crossover': return snapshot.sma20 !== null && snapshot.sma50 !== null ? snapshot.sma20 - snapshot.sma50 : null
    default: return null
  }
}

function conditionMatches(currentValue: number, operator: AlertRecord['operator'], threshold: number): boolean {
  switch (operator) {
    case 'lt': return currentValue < threshold
    case 'lte': return currentValue <= threshold
    case 'gt': return currentValue > threshold
    case 'gte': return currentValue >= threshold
    case 'cross_above': return currentValue > threshold
    case 'cross_below': return currentValue < threshold
  }
}

function buildAlertMessage(alert: AlertRecord, currentValue: number): string {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173'
  return [
    `Alert triggered — ${alert.ticker}`,
    '',
    `Rule: ${alert.metric} ${alert.operator} ${alert.threshold}`,
    `Current value: ${currentValue.toFixed(2)}`,
    '',
    `View chart: ${baseUrl}/stock/${alert.ticker}`,
  ].join('\n')
}
