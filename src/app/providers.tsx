'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import ThemeProvider from './components/ui/ThemeProvider'
import HydrationFix from './components/ui/HydrationFix'
import { ToastProvider } from './components/ui/toast'
import { NotificationProvider } from './components/notifications/NotificationProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HydrationFix />
        <ToastProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
