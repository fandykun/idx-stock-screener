import { PrismaClient } from '@prisma/client'
import { demoStocks } from '../src/data/demoData.js'

const prisma = new PrismaClient()

async function main(): Promise<void> {
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
    await prisma.candle.createMany({ data: stock.candles.map((candle) => ({ ...candle, timestamp: new Date(candle.timestamp), volume: BigInt(candle.volume) })), skipDuplicates: true })
  }
}

main().finally(async () => prisma.$disconnect())
