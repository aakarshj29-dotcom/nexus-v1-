'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus, Settings, Building2, User2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenu } from '@/components/ui/sidebar';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { WorkspaceModal } from './workspace-modal';
import Link from 'next/link';

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaces();
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    {activeWorkspace?.isPersonal ? (
                      <User2 className="h-4 w-4" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeWorkspace?.name || 'Loading...'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {activeWorkspace?.isPersonal ? 'Personal Space' : 'Team Space'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              side="bottom"
              align="start"
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => setActiveWorkspace(ws)}
                  className="flex items-center gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    {ws.isPersonal ? (
                      <User2 className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="flex-1 truncate font-medium">
                    {ws.name}
                  </span>
                  {activeWorkspace?.id === ws.id && (
                    <span className="text-xs text-primary font-semibold">Active</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Create Workspace</span>
              </DropdownMenuItem>
              {activeWorkspace && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    render={
                      <Link href="/dashboard/workspace" className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Workspace Settings</span>
                      </Link>
                    }
                  />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <WorkspaceModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
