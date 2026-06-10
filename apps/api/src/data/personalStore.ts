import { randomBytes } from 'node:crypto'
import type { AlertCreateInput, AlertPatchInput } from '@idx-screener/shared'
import { getStock } from './demoData.js'
import { getStockSnapshot, type StockSnapshot } from '../lib/screenerEngine.js'

export interface WatchlistItem extends StockSnapshot {
  addedAt: string
}

export interface AlertRecord extends AlertCreateInput {
  id: string
  userId: string
  active: boolean
  lastCheckedAt: string | null
  lastFired: string | null
  createdAt: string
}

interface UserState {
  watchlist: Set<string>
  alerts: AlertRecord[]
  telegramLinkToken: string | null
}

const users = new Map<string, UserState>()

function getUserState(userId: string): UserState {
  const existing = users.get(userId)
  if (existing) return existing
  const created: UserState = { watchlist: new Set<string>(), alerts: [], telegramLinkToken: null }
  users.set(userId, created)
  return created
}

export function resetPersonalStore(): void {
  users.clear()
}

export function addWatchlistItem(userId: string, ticker: string): WatchlistItem {
  const normalizedTicker = ticker.toUpperCase()
  const stock = getStock(normalizedTicker)
  if (!stock) throw Object.assign(new Error(`Stock ${normalizedTicker} not found`), { statusCode: 404 })
  const state = getUserState(userId)
  if (state.watchlist.has(normalizedTicker)) throw Object.assign(new Error(`${normalizedTicker} is already in the watchlist`), { statusCode: 409 })
  state.watchlist.add(normalizedTicker)
  return { ...getStockSnapshot(stock), addedAt: new Date().toISOString() }
}

export function listWatchlistItems(userId: string): WatchlistItem[] {
  const state = getUserState(userId)
  return [...state.watchlist].map((ticker) => {
    const stock = getStock(ticker)
    if (!stock) throw new Error(`Watchlist contains unknown ticker ${ticker}`)
    return { ...getStockSnapshot(stock), addedAt: new Date().toISOString() }
  })
}

export function removeWatchlistItem(userId: string, ticker: string): void {
  getUserState(userId).watchlist.delete(ticker.toUpperCase())
}

export function createAlert(userId: string, input: AlertCreateInput): AlertRecord {
  const stock = getStock(input.ticker)
  if (!stock) throw Object.assign(new Error(`Stock ${input.ticker} not found`), { statusCode: 404 })
  const alert: AlertRecord = {
    id: randomBytes(8).toString('hex'),
    userId,
    ...input,
    active: true,
    lastCheckedAt: null,
    lastFired: null,
    createdAt: new Date().toISOString(),
  }
  getUserState(userId).alerts.push(alert)
  return alert
}

export function listAlerts(userId: string): AlertRecord[] {
  return [...getUserState(userId).alerts]
}

export function updateAlert(userId: string, alertId: string, patch: AlertPatchInput): AlertRecord {
  const alert = findAlert(alertId)
  if (!alert) throw Object.assign(new Error(`Alert ${alertId} not found`), { statusCode: 404 })
  if (alert.userId !== userId) throw Object.assign(new Error('Alert belongs to another user'), { statusCode: 403 })
  alert.active = patch.active
  return alert
}

export function deleteAlert(userId: string, alertId: string): void {
  const state = getUserState(userId)
  const index = state.alerts.findIndex((alert) => alert.id === alertId)
  if (index === -1) {
    if (findAlert(alertId)) throw Object.assign(new Error('Alert belongs to another user'), { statusCode: 403 })
    throw Object.assign(new Error(`Alert ${alertId} not found`), { statusCode: 404 })
  }
  state.alerts.splice(index, 1)
}

export function generateTelegramToken(userId: string): string {
  const token = randomBytes(16).toString('hex')
  getUserState(userId).telegramLinkToken = token
  return token
}

export function findAlert(alertId: string): AlertRecord | undefined {
  for (const state of users.values()) {
    const alert = state.alerts.find((candidate) => candidate.id === alertId)
    if (alert) return alert
  }
  return undefined
}
