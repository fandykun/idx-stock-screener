import { PrismaClient } from '@prisma/client'
import { demoStocks } from '../src/data/demoData.js'

const prisma = new PrismaClient()

const demoEmail = 'demo@idx-screener.app'
const demoPasswordNotice = 'auth-stub-demo-user-phase-6-will-replace-password-hash'
const demoWatchlistTickers = ['BBCA', 'TLKM', 'ASII', 'BBRI']
const demoAlerts = [
  { ticker: 'BBCA', type: 'TECHNICAL' as const, metric: 'rsi', operator: 'lt', threshold: 30 },
  { ticker: 'ASII', type: 'FUNDAMENTAL' as const, metric: 'pe', operator: 'lt', threshold: 10 },
]

async function seedStocks(): Promise<void> {
  for (const stock of demoStocks) {
    await prisma.stock.upsert({
      where: { ticker: stock.ticker },
      create: { ticker: stock.ticker, name: stock.name, sector: stock.sector },
      update: { name: stock.name, sector: stock.sector },
    })

    await prisma.fundamental.upsert({
      where: { ticker: stock.ticker },
      create: { ticker: stock.ticker, ...stock.fundamental },
      update: stock.fundamental,
    })

    await prisma.candle.createMany({
      data: stock.candles.map((candle) => ({
        ...candle,
        timestamp: new Date(candle.timestamp),
        volume: BigInt(candle.volume),
      })),
      skipDuplicates: true,
    })
  }
}

async function main(): Promise<void> {
  await seedStocks()

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      passwordHash: demoPasswordNotice,
    },
    update: {
      passwordHash: demoPasswordNotice,
    },
  })

  await prisma.watchlist.deleteMany({ where: { userId: user.id } })
  await prisma.alert.deleteMany({ where: { userId: user.id } })

  await prisma.watchlist.createMany({
    data: demoWatchlistTickers.map((ticker) => ({ userId: user.id, ticker })),
    skipDuplicates: true,
  })

  await prisma.alert.createMany({
    data: demoAlerts.map((alert) => ({ userId: user.id, ...alert })),
  })

  const [stockCount, candleCount, watchlistCount, alertCount] = await Promise.all([
    prisma.stock.count(),
    prisma.candle.count(),
    prisma.watchlist.count({ where: { userId: user.id } }),
    prisma.alert.count({ where: { userId: user.id } }),
  ])

  console.log(
    JSON.stringify({
      demoUser: demoEmail,
      stocks: stockCount,
      candles: candleCount,
      watchlistItems: watchlistCount,
      alerts: alertCount,
    }),
  )
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
