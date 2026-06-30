'use client'

import * as React from 'react'
import { ThemeProvider } from './theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './auth-provider'

interface RootProvidersProps {
  children: React.ReactNode
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <TooltipProvider delay={0}>{children}</TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
