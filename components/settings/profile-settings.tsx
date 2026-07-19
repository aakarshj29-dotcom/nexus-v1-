'use client';

import * as React from 'react';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsernameInput } from '@/components/profile/username-input';
import { AvatarUploader } from '@/components/profile/avatar-uploader';
import { updateTimezonePreference } from '@/firebase/settings-service';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
  { value: 'Europe/London', label: 'Europe/London (London Time)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central European Time)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India Standard Time)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (China Standard Time)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan Standard Time)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (Eastern Australia Time)' },
];

export function ProfileSettings() {
  const { profile, updateProfile, claimUsername, loading, error: profileError } = useProfile();
  const [displayName, setDisplayName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [timezone, setTimezone] = React.useState('');
  const [isUsernameValid, setIsUsernameValid] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    }
  }, [profile]);

  // Add client-side validation to ensure current timezone is listed or added
  const allTimezones = React.useMemo(() => {
    const list = [...COMMON_TIMEZONES];
    if (timezone && !list.some((tz) => tz.value === timezone)) {
      list.unshift({ value: timezone, label: `${timezone} (Detected Timezone)` });
    }
    return list;
  }, [timezone]);

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

      // 1. Claim username if changed
      if (username !== profile.username) {
        if (!isUsernameValid) {
          throw new Error('Please enter a valid, available username.');
        }
        await claimUsername(username);
      }

      // 2. Update timezone in settings service
      if (timezone !== profile.timezone) {
        await updateTimezonePreference(profile.uid, timezone);
      }

      // 3. Update displayName and bio
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        timezone,
      });

      setSuccess('Profile settings updated successfully.');
    } catch (err) {
      console.error('Failed to update profile settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal details, custom username, bio, and visual avatar.
        </p>
      </div>

      {success && (
        <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {profileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync Error</AlertTitle>
          <AlertDescription>{profileError.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="flex flex-col items-center justify-center border rounded-lg p-6 bg-muted/20">
          <AvatarUploader
            currentImageUrl={profile?.avatarUrl}
            onUploadComplete={() => setSuccess('Avatar updated successfully.')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="display-name">
              Display Name
            </label>
            <Input
              id="display-name"
              placeholder="Your full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email-address">
              Email Address (Read-only)
            </label>
            <Input
              id="email-address"
              value={profile?.email || ''}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <UsernameInput
              value={username}
              onChange={setUsername}
              onValidChange={setIsUsernameValid}
              initialUsername={profile?.username}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="timezone-select">
              Timezone
            </label>
            <select
              id="timezone-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {allTimezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="bio-input">
            Bio
          </label>
          <textarea
            id="bio-input"
            rows={4}
            maxLength={200}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            placeholder="Introduce yourself to the team..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="text-right text-xs text-muted-foreground">
            {bio.length}/200 characters
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSaving || !isUsernameValid}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
