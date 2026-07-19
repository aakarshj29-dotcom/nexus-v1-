'use client';

import * as React from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/sidebar';
import { TopNav } from '@/components/navigation/top-nav';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from 'next-themes';

function ThemeSync() {
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    const savedTheme = profile?.preferences?.theme;
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
  }, [profile?.preferences?.theme, theme, setTheme]);

  return null;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ThemeSync />
      <AppSidebar />
      <SidebarInset>
        <TopNav />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
