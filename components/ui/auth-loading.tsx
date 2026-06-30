'use client';

import { Loader2 } from 'lucide-react';

export const AuthLoading = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Authenticating...
      </p>
    </div>
  );
};
