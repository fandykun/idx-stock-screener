import { CandlestickSeries, createChart, LineSeries, type IChartApi } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import type { Candle } from '../types'

interface Props { candles: Candle[]; showMa20: boolean; showMa50: boolean; showBollinger: boolean }

export function CandleChart({ candles, showMa20, showMa50, showBollinger }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart: IChartApi = createChart(ref.current, { height: 420, layout: { background: { color: '#07111f' }, textColor: '#d8e2ef' }, grid: { vertLines: { color: '#132036' }, horzLines: { color: '#132036' } } })
    const series = chart.addSeries(CandlestickSeries, { upColor: '#22c55e', downColor: '#ef4444', borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444' })
    series.setData(candles.map((candle) => ({ time: candle.timestamp.slice(0, 10), open: candle.open, high: candle.high, low: candle.low, close: candle.close })))
    if (showMa20) addLine(chart, candles, 20, '#38bdf8')
    if (showMa50) addLine(chart, candles, 50, '#f59e0b')
    if (showBollinger) { addLine(chart, candles, 20, '#a78bfa', 1.04); addLine(chart, candles, 20, '#a78bfa', 0.96) }
    chart.timeScale().fitContent()
    return () => chart.remove()
  }, [candles, showMa20, showMa50, showBollinger])
  return <div className="chart" ref={ref} />
}

function addLine(chart: IChartApi, candles: Candle[], period: number, color: string, multiplier = 1): void {
  const line = chart.addSeries(LineSeries, { color, lineWidth: 2 })
  line.setData(candles.map((candle, index) => {
    const window = candles.slice(Math.max(0, index - period + 1), index + 1)
    const value = window.reduce((sum, item) => sum + item.close, 0) / window.length
    return { time: candle.timestamp.slice(0, 10), value: value * multiplier }
  }))
}
