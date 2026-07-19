'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useProfile } from '@/hooks/use-profile';
import { updateThemePreference } from '@/firebase/settings-service';
import { Check, Sun, Moon, Laptop, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { profile } = useProfile();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const currentTheme = theme || 'system';

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      setIsUpdating(true);
      setError(null);
      setSuccess(null);

      // 1. Set standard client theme immediately
      setTheme(newTheme);

      // 2. Persist in Firestore if user is logged in
      if (profile?.uid) {
        await updateThemePreference(profile.uid, newTheme);
      }

      setSuccess(`Theme preference updated to ${newTheme} successfully.`);
    } catch (err) {
      console.error('Failed to update theme preference:', err);
      setError('Failed to persist theme settings in your profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Appearance Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize your Nexus theme interface. Select a light, dark, or system preference.
        </p>
      </div>

      {success && (
        <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 max-w-xl">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="max-w-xl">
          <Check className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <label className="text-sm font-medium">Select Theme</label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            disabled={isUpdating}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border text-left transition-all ${
              currentTheme === 'light'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                : 'hover:bg-muted/50 border-input bg-card'
            }`}
          >
            <div className="flex h-12 w-full items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              <Sun className="h-6 w-6" />
            </div>
            <div className="flex w-full items-center justify-between text-sm">
              <span>Light</span>
              {currentTheme === 'light' && (
                <div className="rounded-full bg-primary p-0.5 text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            disabled={isUpdating}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border text-left transition-all ${
              currentTheme === 'dark'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                : 'hover:bg-muted/50 border-input bg-card'
            }`}
          >
            <div className="flex h-12 w-full items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Moon className="h-6 w-6" />
            </div>
            <div className="flex w-full items-center justify-between text-sm">
              <span>Dark</span>
              {currentTheme === 'dark' && (
                <div className="rounded-full bg-primary p-0.5 text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </button>

          {/* System Default Theme Card */}
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            disabled={isUpdating}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border text-left transition-all ${
              currentTheme === 'system'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                : 'hover:bg-muted/50 border-input bg-card'
            }`}
          >
            <div className="flex h-12 w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Laptop className="h-6 w-6" />
            </div>
            <div className="flex w-full items-center justify-between text-sm">
              <span>System</span>
              {currentTheme === 'system' && (
                <div className="rounded-full bg-primary p-0.5 text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {isUpdating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Synchronizing preferences with server...
        </div>
      )}
    </div>
  );
}
