'use client';

import { Project } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, MoreVertical, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecentProjectsProps {
  projects: Project[] | undefined;
  loading: boolean;
}

export function RecentProjects({ projects, loading }: RecentProjectsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] flex-col items-center justify-center text-center">
          <FolderKanban className="mb-2 h-8 w-8 text-muted-foreground opacity-20" />
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          <Button variant="link" className="mt-2">Create your first project</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Projects</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: project.color || '#94a3b8' }}
              >
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">{project.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {project.status}
                  </Badge>
                  <span className="flex items-center text-[10px] text-muted-foreground">
                    <Users className="mr-1 h-3 w-3" />
                    {project.memberCount}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" className="w-full">View All Projects</Button>
      </CardContent>
    </Card>
  );
}
