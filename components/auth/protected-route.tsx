'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthLoading } from '@/components/ui/auth-loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      } else if (!user.onboardingComplete && pathname !== '/onboarding') {
        router.replace('/onboarding');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
