'use client';

import { AppUser } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin } from 'lucide-react';

interface ProfileCardProps {
  profile: AppUser;
}

export const ProfileCard = ({ profile }: ProfileCardProps) => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="h-24 bg-primary/10 w-full" />
      <div className="px-6 pb-6 relative">
        <div className="flex justify-between items-end -mt-12 mb-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={profile.avatarUrl || undefined} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">
            {profile.displayName || 'Unnamed User'}
          </h3>
          <p className="text-sm text-muted-foreground">
            @{profile.username || 'username'}
          </p>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm leading-relaxed">
            {profile.bio}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {profile.timezone && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{profile.timezone}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>Joined {profile.createdAt.toDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
