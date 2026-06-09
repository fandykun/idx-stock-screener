import axios from 'axios'
import cron from 'node-cron'
import { demoStocks } from '../data/demoData.js'

interface YahooChartResponse {
  chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ open?: number[]; high?: number[]; low?: number[]; close?: number[]; volume?: number[] }> } }> }
}

async function withRetry<T>(operation: () => Promise<T>, ticker: string): Promise<T> {
  const delays = [1000, 2000, 4000]
  let lastError: unknown
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try { return await operation() } catch (error) {
      lastError = error
      if (attempt < delays.length) await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
    }
  }
  throw new Error(`Yahoo fetch failed for ${ticker}: ${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

export async function fetchTickerCandles(ticker: string): Promise<number> {
  const response = await withRetry(() => axios.get<YahooChartResponse>(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.JK`, { params: { interval: '15m', range: '1d' }, timeout: 10000 }), ticker)
  const result = response.data.chart?.result?.[0]
  return result?.timestamp?.length ?? 0
}

export async function scrapeOnce(): Promise<void> {
  for (const stock of demoStocks) {
    const count = await fetchTickerCandles(stock.ticker)
    console.info(`Fetched ${count} candles for ${stock.ticker}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await scrapeOnce()
}

cron.schedule('*/15 9-16 * * 1-5', () => { void scrapeOnce() }, { timezone: 'Asia/Jakarta' })
