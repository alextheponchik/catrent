'use client'

import { ThemeProvider } from 'next-themes'
import React from 'react'

// Cast needed because next-themes 0.3.0 types ThemeProvider as a plain function,
// which doesn't pass children through JSX inference in React 18 + TypeScript 5
const Provider = ThemeProvider as unknown as React.ComponentType<{
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  children: React.ReactNode
}>

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </Provider>
  )
}
