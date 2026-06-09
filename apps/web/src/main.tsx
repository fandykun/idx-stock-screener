import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Screener } from './pages/Screener'
import { StockDetail } from './pages/StockDetail'
import './styles.css'

const queryClient = new QueryClient()
const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Screener />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
