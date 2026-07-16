'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FolderPlus,
  UserPlus,
  MessageSquarePlus,
  FilePlus,
  Zap
} from 'lucide-react';

export function QuickActions() {
  const actions = [
    { label: 'New Project', icon: FolderPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Add Task', icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Invite Member', icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'New Message', icon: MessageSquarePlus, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Create Note', icon: FilePlus, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Zap className="h-4 w-4 text-primary" />
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className="flex h-auto flex-col items-center justify-center gap-2 rounded-xl border border-transparent p-3 text-center hover:border-border hover:bg-muted/50"
          >
            <div className={`rounded-lg p-2 ${action.bg} ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium leading-tight">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
