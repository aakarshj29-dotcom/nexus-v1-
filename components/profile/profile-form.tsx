'use client';

import { useState } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsernameInput } from './username-input';
import { AvatarUploader } from './avatar-uploader';
import { Loader2 } from 'lucide-react';

interface ProfileFormProps {
  onSuccess?: () => void;
}

export const ProfileForm = ({ onSuccess }: ProfileFormProps) => {
  const { profile, updateProfile, claimUsername } = useProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isUsernameValid, setIsUsernameValid] = useState(!!profile?.username);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);

      // Update display name and bio
      await updateProfile({
        displayName,
        bio,
      });

      // Update username if changed and valid
      if (username !== profile.username && isUsernameValid) {
        await claimUsername(username);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md w-full">
      <AvatarUploader
        currentImageUrl={profile.avatarUrl}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Display Name</label>
        <Input
          placeholder="Your Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Username</label>
        <UsernameInput
          value={username}
          onChange={setUsername}
          onValidChange={setIsUsernameValid}
          initialUsername={profile.username}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bio</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Tell us about yourself"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSaving || !isUsernameValid}
      >
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Profile
      </Button>
    </form>
  );
};
