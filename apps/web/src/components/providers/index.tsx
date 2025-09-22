'use client'

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Web3Providers } from './web3-provider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Web3Providers>
        {children}
      </Web3Providers>
    </QueryClientProvider>
  )
}
