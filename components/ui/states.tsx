'use client';

import * as React from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StateLoadingProps {
  message?: string;
  className?: string;
}

export function StateLoading({ message = 'Loading workspace data...', className }: StateLoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center min-h-[200px]',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

interface StateEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function StateEmpty({
  title = 'No items found',
  description = 'There is nothing to display here right now.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}: StateEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/10 min-h-[200px]',
        className
      )}
    >
      <div className="p-3 rounded-full bg-muted text-muted-foreground mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface StateErrorProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function StateError({
  title = 'An error occurred',
  message = 'We encountered an error while fetching your data. Please try again.',
  retryLabel = 'Try Again',
  onRetry,
  className,
}: StateErrorProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive min-h-[200px]',
        className
      )}
      role="alert"
    >
      <div className="p-3 rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-destructive mb-1">{title}</h3>
      <p className="text-xs text-destructive/90 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="destructive" size="sm">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
