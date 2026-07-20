'use client'

import * as React from 'react'
import { ThemeProvider } from './theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './auth-provider'
import { WorkspaceProvider } from '@/hooks/use-workspaces'
import { ToastProvider } from '@/components/ui/toast'

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
        <WorkspaceProvider>
          <ToastProvider>
            <TooltipProvider delay={0}>{children}</TooltipProvider>
          </ToastProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
