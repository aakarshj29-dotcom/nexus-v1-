'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useWorkspaceDetails } from '@/hooks/use-workspace-details';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Settings,
  Users,
  Mail,
  UserPlus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { WorkspaceRole } from '@/types/workspace';

export default function WorkspaceSettingsPage() {
  const { user } = useAuth();
  const {
    activeWorkspace,
    pendingInvitations,
    updateWorkspace,
    deleteWorkspace,
    sendInvite,
    cancelInvite,
    respondToInvite,
    updateMemberRole,
    removeMember,
  } = useWorkspaces();

  const {
    members,
    invitations,
    loadingMembers,
    loadingInvitations,
    error: detailsError,
  } = useWorkspaceDetails(activeWorkspace?.id);

  // States
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'admin' | 'member'>('member');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isInviting, setIsInviting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSuccess, setFormSuccess] = React.useState<string | null>(null);

  // Sync details when activeWorkspace changes
  React.useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setDescription(activeWorkspace.description || '');
      setFormError(null);
      setFormSuccess(null);
    }
  }, [activeWorkspace]);

  if (!activeWorkspace) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading workspace settings...</p>
        </div>
      </div>
    );
  }

  const userRole = activeWorkspace.roles[user?.uid || ''] || 'member';
  const isOwner = activeWorkspace.ownerId === user?.uid;
  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';

  // Actions
  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setIsUpdating(true);
      setFormError(null);
      setFormSuccess(null);
      await updateWorkspace(activeWorkspace.id, {
        name: name.trim(),
        description: description.trim(),
      });
      setFormSuccess('Workspace settings updated successfully.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update workspace.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this workspace? This action is permanent and cannot be undone.')) {
      return;
    }
    try {
      setIsDeleting(true);
      setFormError(null);
      await deleteWorkspace(activeWorkspace.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete workspace.');
      setIsDeleting(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setIsInviting(true);
      setFormError(null);
      setFormSuccess(null);
      await sendInvite(activeWorkspace.id, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setFormSuccess(`Invitation successfully sent to ${inviteEmail}.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      setFormError(null);
      await cancelInvite(activeWorkspace.id, invitationId);
      setFormSuccess('Invitation canceled successfully.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to cancel invitation.');
    }
  };

  const handleRoleChange = async (targetUserId: string, currentRole: WorkspaceRole, newRole: WorkspaceRole) => {
    if (newRole === 'owner') {
      if (!window.confirm('Transferring ownership will make this member the owner of the workspace. You will be demoted to Admin. Do you want to continue?')) {
        return;
      }
    }
    try {
      setFormError(null);
      setFormSuccess(null);
      await updateMemberRole(activeWorkspace.id, targetUserId, newRole);
      setFormSuccess('Member role updated successfully.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    const isSelf = targetUserId === user?.uid;
    const confirmMsg = isSelf
      ? 'Are you sure you want to leave this workspace?'
      : 'Are you sure you want to remove this member from the workspace?';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);
      await removeMember(activeWorkspace.id, targetUserId);
      setFormSuccess(isSelf ? 'You have left the workspace.' : 'Member removed successfully.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to remove member.');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Admin</h1>
        <p className="text-muted-foreground">
          Manage workspace settings, invite team members, and configure collaboration options.
        </p>
      </div>

      {/* Global Alerts */}
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      {formSuccess && (
        <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{formSuccess}</AlertDescription>
        </Alert>
      )}
      {detailsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync Error</AlertTitle>
          <AlertDescription>{detailsError.message}</AlertDescription>
        </Alert>
      )}

      {/* Received Invitations Section */}
      {pendingInvitations.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Pending Workspace Invitations
            </CardTitle>
            <CardDescription>
              You have been invited to collaborate in other workspaces. Accept or decline to join them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-background border"
              >
                <div>
                  <h4 className="font-semibold text-sm">{inv.workspaceName}</h4>
                  <p className="text-xs text-muted-foreground">
                    Invited by {inv.invitedByName} to join as an{' '}
                    <span className="capitalize font-semibold">{inv.role}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => respondToInvite(inv.id, 'decline')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => respondToInvite(inv.id, 'accept')}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column - Workspace General & Invitations */}
        <div className="space-y-6 lg:col-span-7">
          {/* General Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="h-5 w-5 text-primary" />
                Workspace Settings
              </CardTitle>
              <CardDescription>
                Customize details for your workspace. Only Admins and Owners can save these details.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateWorkspace}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="ws-name" className="text-sm font-medium">
                    Workspace Name
                  </label>
                  <Input
                    id="ws-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isAdminOrOwner || isUpdating}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ws-desc" className="text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="ws-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isAdminOrOwner || isUpdating}
                    maxLength={500}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  />
                </div>
              </CardContent>
              {isAdminOrOwner && (
                <CardFooter className="flex justify-between border-t pt-6">
                  {isOwner && !activeWorkspace.isPersonal ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteWorkspace}
                      disabled={isDeleting || isUpdating}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Workspace
                    </Button>
                  ) : (
                    <div />
                  )}
                  <Button type="submit" disabled={isUpdating || !name.trim()}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>

          {/* Invite Member Section */}
          {isAdminOrOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Invite Members
                </CardTitle>
                <CardDescription>
                  Invite others to join this workspace by sending an invitation to their email.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSendInvite}>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <label htmlFor="invite-email" className="text-sm font-medium">
                        Email Address
                      </label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="collaborator@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={isInviting}
                        required
                      />
                    </div>
                    <div className="w-full sm:w-[150px] space-y-2">
                      <label htmlFor="invite-role" className="text-sm font-medium">
                        Role
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-between"
                            >
                              <span className="capitalize">{inviteRole}</span>
                              <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent className="w-[150px]">
                          <DropdownMenuItem onClick={() => setInviteRole('member')}>
                            Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setInviteRole('admin')}>
                            Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6">
                  <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                    {isInviting ? 'Sending Invite...' : 'Send Invitation'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Pending Sent Invitations */}
          {isAdminOrOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sent Invitations</CardTitle>
                <CardDescription>
                  Outstanding invitations that have not yet been accepted or declined.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInvitations ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No pending invitations sent from this workspace.
                  </div>
                ) : (
                  <div className="divide-y">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between py-3 gap-4"
                      >
                        <div>
                          <p className="text-sm font-medium">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Invited as <span className="capitalize font-semibold">{inv.role}</span> •{' '}
                            <span className="capitalize">{inv.status}</span>
                          </p>
                        </div>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleCancelInvite(inv.id)}
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          title="Cancel Invitation"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Members List */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                Workspace Members
              </CardTitle>
              <CardDescription>
                A list of people who have access to this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No members in this workspace.
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => {
                    const isSelf = member.uid === user?.uid;
                    const canManageRoles =
                      isOwner && !isSelf; // Only owners can change other roles
                    const canKick =
                      isAdminOrOwner &&
                      !isSelf &&
                      member.role !== 'owner' &&
                      (userRole === 'owner' || member.role !== 'admin');

                    return (
                      <div
                        key={member.uid}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-background"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl || ''} />
                            <AvatarFallback>
                              {(member.displayName || member.username || 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid leading-tight">
                            <span className="font-semibold text-sm truncate">
                              {member.displayName || member.username || 'User'}
                              {isSelf && ' (You)'}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                              {member.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Role selector / badge */}
                          {canManageRoles ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button size="xs" variant="outline" className="gap-1 capitalize h-8">
                                    {member.role}
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-[150px]">
                                <DropdownMenuItem onClick={() => handleRoleChange(member.uid, member.role, 'member')}>
                                  Member
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(member.uid, member.role, 'admin')}>
                                  Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(member.uid, member.role, 'owner')}>
                                  Transfer Owner
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs font-semibold capitalize text-muted-foreground bg-muted px-2 py-1 rounded">
                              {member.role}
                            </span>
                          )}

                          {/* Action Buttons (Kick or Leave) */}
                          {canKick && (
                            <Button
                              size="xs"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              onClick={() => handleRemoveMember(member.uid)}
                              title="Remove Member"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}

                          {isSelf && !isOwner && (
                            <Button
                              size="xs"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10 h-8"
                              onClick={() => handleRemoveMember(member.uid)}
                            >
                              Leave
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
