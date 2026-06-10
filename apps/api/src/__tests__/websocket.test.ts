import { describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

describe('price WebSocket', () => {
  it('sends a snapshot of latest prices on connection', async () => {
    const app = await createApp()
    await app.listen({ port: 0 })
    const address = app.server.address()
    if (address === null || typeof address === 'string') throw new Error('Expected TCP server address')

    const message = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws/prices`)
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for snapshot')), 1000)
      socket.addEventListener('message', (event) => {
        clearTimeout(timeout)
        socket.close()
        resolve(JSON.parse(String(event.data)) as Record<string, unknown>)
      })
      socket.addEventListener('error', () => reject(new Error('WebSocket connection failed')))
    })

    expect(message.type).toBe('snapshot')
    expect((message.prices as Record<string, number>).BBCA).toBeGreaterThan(0)
    await app.close()
  })
})
