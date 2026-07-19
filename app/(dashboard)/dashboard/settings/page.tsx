'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useWorkspaceDetails } from '@/hooks/use-workspace-details';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { SecuritySettings } from '@/components/settings/security-settings';
import { AboutSettings } from '@/components/settings/about-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Settings,
  Bell,
  Lock,
  Info,
  Briefcase,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'security' | 'workspace' | 'about';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { activeWorkspace } = useWorkspaces();
  const { members } = useWorkspaceDetails(activeWorkspace?.id);

  // Read active tab from query parameter or default to 'profile'
  const activeTabParam = searchParams.get('tab') as SettingsTab;
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('profile');

  React.useEffect(() => {
    if (activeTabParam && ['profile', 'appearance', 'notifications', 'security', 'workspace', 'about'].includes(activeTabParam)) {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    // Update the URL search param without pushing to browser history if not desired, or just standard router.push
    router.push(`/dashboard/settings?tab=${tab}`);
  };

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading settings page...</p>
        </div>
      </div>
    );
  }

  // Tabs config
  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User, description: 'Personal details, avatar, and custom username' },
    { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Settings, description: 'Color themes and UI visuals' },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell, description: 'Alert channels, digests, and email settings' },
    { id: 'security' as SettingsTab, label: 'Security', icon: Lock, description: 'Credentials, verification, and passwords' },
    { id: 'workspace' as SettingsTab, label: 'Workspace', icon: Briefcase, description: 'Active collaboration workspace status' },
    { id: 'about' as SettingsTab, label: 'About', icon: Info, description: 'Nexus metadata, terms, and build details' },
  ];

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'workspace':
        return renderWorkspaceTabContent();
      case 'about':
        return <AboutSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  const renderWorkspaceTabContent = () => {
    if (!activeWorkspace) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Workspace settings</h2>
            <p className="text-sm text-muted-foreground">
              Monitor active project teams, workspaces, and member settings.
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-sm">No Active Workspace Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  You are currently not bound to any active workspace. Please create or select one via the workspace switcher.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Workspace Integration</h2>
          <p className="text-sm text-muted-foreground">
            View current team metadata, active membership statistics, and access workspace management tools.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                {activeWorkspace.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-md">{activeWorkspace.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-0.5">
                  {activeWorkspace.description || 'No description provided for this workspace.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 border-t pt-5">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border rounded-lg p-3 bg-muted/10">
                <span className="block text-muted-foreground font-medium mb-1">Your Role</span>
                <span className="block text-foreground font-semibold capitalize">
                  {activeWorkspace.roles[user?.uid || ''] || 'Member'}
                </span>
              </div>
              <div className="border rounded-lg p-3 bg-muted/10">
                <span className="block text-muted-foreground font-medium mb-1">Active Members</span>
                <span className="block text-foreground font-semibold">
                  {members.length} member{members.length !== 1 && 's'}
                </span>
              </div>
            </div>

            {/* Quick overview of team members */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Workspace Members
              </h4>
              <div className="flex -space-x-2 overflow-hidden py-1">
                {members.slice(0, 5).map((member) => (
                  <Avatar key={member.uid} className="inline-block h-8 w-8 rounded-full border-2 border-background">
                    <AvatarImage src={member.avatarUrl || ''} />
                    <AvatarFallback className="text-[10px] font-semibold">
                      {(member.displayName || member.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 5 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t py-4 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Configure invitation links, member roles, and general parameters.
            </p>
            <Link href="/dashboard/workspace" passHref legacyBehavior>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                Workspace Admin Panel
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-8">
      {/* Settings Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings & Account</h1>
        <p className="text-muted-foreground">
          Configure profile settings, appearance visual preferences, notifications, and security options.
        </p>
      </div>

      {/* Main Settings Container */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left column navigation - vertical list on desktop, horizontal scroll on mobile */}
        <div className="lg:col-span-3">
          {/* Mobile view horizontal scrolling buttons */}
          <div className="flex lg:hidden overflow-x-auto pb-2 gap-2 scrollbar-none">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border shrink-0 transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground hover:bg-muted/50 border-input'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop view vertical nav card */}
          <Card className="hidden lg:block">
            <CardContent className="p-3">
              <nav className="flex flex-col space-y-1">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-left transition-all group ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <TabIcon className={`h-4 w-4 shrink-0 transition-colors ${
                          activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        }`} />
                        <span className="text-sm">{tab.label}</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`} />
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Right column active panel content */}
        <Card className="lg:col-span-9 p-6 md:p-8 min-h-[450px]">
          {renderActiveTabContent()}
        </Card>
      </div>
    </div>
  );
}
