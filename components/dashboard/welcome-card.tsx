'use client';

import { useProfile } from '@/hooks/use-profile';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WelcomeCard() {
  const { profile, loading } = useProfile();

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-none">
      <CardContent className="p-8">
        <h2 className="text-3xl font-bold tracking-tight">
          {getTimeGreeting()}, {profile?.displayName || profile?.username || 'Nexus User'}!
        </h2>
        <p className="mt-2 text-muted-foreground">
          Here is what&apos;s happening with your projects and tasks today.
        </p>
      </CardContent>
    </Card>
  );
}
