'use client';

import * as React from 'react';
import { useProfile } from '@/hooks/use-profile';
import { updateNotificationPreferences } from '@/firebase/settings-service';
import { Check, Mail, Bell, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function NotificationSettings() {
  const { profile, loading, error: profileError } = useProfile();
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [desktopNotifications, setDesktopNotifications] = React.useState(false);
  const [weeklyDigest, setWeeklyDigest] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile?.preferences?.notifications) {
      const n = profile.preferences.notifications;
      setEmailNotifications(n.emailNotifications ?? true);
      setDesktopNotifications(n.desktopNotifications ?? false);
      setWeeklyDigest(n.weeklyDigest ?? true);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await updateNotificationPreferences(profile.uid, {
        emailNotifications,
        desktopNotifications,
        weeklyDigest,
      });

      setSuccess('Notification preferences saved successfully.');
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      setError('Failed to update notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Manage how you receive alerts, summaries, and real-time project updates.
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
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {profileError && (
        <Alert variant="destructive" className="max-w-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync Error</AlertTitle>
          <AlertDescription>{profileError.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="space-y-4">
          {/* Email Notifications Toggle Option */}
          <div className="flex items-start justify-between p-4 rounded-xl border bg-card gap-4 hover:bg-muted/10 transition-colors">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <label htmlFor="email-notifications" className="text-sm font-semibold cursor-pointer">
                  Email Notifications
                </label>
                <p className="text-xs text-muted-foreground">
                  Receive email alerts for direct messages, mentions, and updates to your tasks.
                </p>
              </div>
            </div>
            <button
              id="email-notifications"
              type="button"
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                emailNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                  emailNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Desktop/Push Notifications Toggle Option */}
          <div className="flex items-start justify-between p-4 rounded-xl border bg-card gap-4 hover:bg-muted/10 transition-colors">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <label htmlFor="desktop-notifications" className="text-sm font-semibold cursor-pointer">
                  Desktop & Push Alerts
                </label>
                <p className="text-xs text-muted-foreground">
                  Receive immediate notification pop-ups directly on your desktop or device interface.
                </p>
              </div>
            </div>
            <button
              id="desktop-notifications"
              type="button"
              onClick={() => setDesktopNotifications(!desktopNotifications)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                desktopNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                  desktopNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Weekly Activity Digest Toggle Option */}
          <div className="flex items-start justify-between p-4 rounded-xl border bg-card gap-4 hover:bg-muted/10 transition-colors">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <label htmlFor="weekly-digest" className="text-sm font-semibold cursor-pointer">
                  Weekly Activity Digest
                </label>
                <p className="text-xs text-muted-foreground">
                  Get a weekly recap of your workspace&apos;s accomplishments, pending tasks, and events.
                </p>
              </div>
            </div>
            <button
              id="weekly-digest"
              type="button"
              onClick={() => setWeeklyDigest(!weeklyDigest)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                weeklyDigest ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                  weeklyDigest ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
