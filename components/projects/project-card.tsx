'use client';

import * as React from 'react';
import Link from 'next/link';
import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProjectStatusBadge } from './project-status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FolderKanban,
  Briefcase,
  Flame,
  Star,
  Rocket,
  Sparkles,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  Users,
  Calendar,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderKanban,
  Briefcase,
  Flame,
  Star,
  Rocket,
  Sparkles,
};

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onArchive: (projectId: string) => void;
  onRestore: (projectId: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete, onArchive, onRestore }: ProjectCardProps) {
  const IconComponent = ICON_MAP[project.icon] || FolderKanban;

  // Safe progress calculation
  const taskCount = project.taskCount || 0;
  const completedCount = project.completedTaskCount || 0;
  const progressPercent = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  // Format date correctly
  const formattedDate = React.useMemo(() => {
    let dateObj: Date | null = null;
    if (project.updatedAt) {
      if (typeof project.updatedAt === 'string') {
        dateObj = new Date(project.updatedAt);
      } else if (project.updatedAt.toDate) {
        dateObj = project.updatedAt.toDate();
      }
    }
    return dateObj ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  }, [project.updatedAt]);

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-4" style={{ borderTopColor: project.color || '#94a3b8' }}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <Link href={`/projects/${project.id}`} className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: project.color || '#94a3b8' }}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                {project.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <ProjectStatusBadge status={project.status} />
              </div>
            </div>
          </div>
        </Link>

        <div className="ml-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit2 className="mr-2 h-4 w-4" />
                <span>Edit Project</span>
              </DropdownMenuItem>

              {project.status === 'archived' ? (
                <DropdownMenuItem onClick={() => onRestore(project.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Restore Project</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onArchive(project.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>Archive Project</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(project)} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-3">
        <Link href={`/projects/${project.id}`} className="flex-1 block">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
            {project.description || 'No description provided.'}
          </p>
        </Link>

        <div className="space-y-3 pt-2 mt-auto border-t">
          {/* Progress Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">
                {progressPercent}% ({completedCount}/{taskCount} tasks)
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{project.memberIds?.length || 1} members</span>
            </span>
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated {formattedDate}</span>
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
