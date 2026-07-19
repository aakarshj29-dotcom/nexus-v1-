'use client';

import * as React from 'react';
import { useProfile } from '@/hooks/use-profile';
import { changeUserPassword } from '@/firebase/settings-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, ShieldAlert, Key, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SecuritySettings() {
  const { profile } = useProfile();
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const provider = profile?.provider || 'password';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setIsSaving(true);
      await changeUserPassword(newPassword);
      setSuccess('Your password has been changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      console.error('Password change error:', err);
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError?.code === 'auth/requires-recent-login') {
        setError('For security reasons, this action requires a recent login. Please log out and log back in, then try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to change password. Please check your network connection.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Security Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account credentials, verify your sign-in methods, and update security parameters.
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
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Changing Password</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="max-w-xl border rounded-xl p-5 bg-muted/10 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Authentication Method
        </h3>
        <p className="text-xs text-muted-foreground">
          You are signed in using <span className="font-semibold capitalize">{provider === 'google.com' ? 'Google Sign-In' : 'Email & Password'}</span>.
        </p>

        {provider === 'google.com' && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs leading-relaxed text-muted-foreground">
            Your credentials and profile synchronization are safely managed by Google. You can adjust security parameters, review devices, or change passwords via your official Google Account Control Panel.
          </div>
        )}
      </div>

      {provider !== 'google.com' && (
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Update Password
            </h3>
            <p className="text-xs text-muted-foreground">
              Please enter your desired new password. Ensure it has at least 6 characters and is strong.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold" htmlFor="new-password">
              New Password
            </label>
            <Input
              id="new-password"
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
