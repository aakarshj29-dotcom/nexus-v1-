'use client';

import * as React from 'react';
import Link from 'next/link';
import { Project } from '@/types/project';
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

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onArchive: (projectId: string) => void;
  onRestore: (projectId: string) => void;
}

export function ProjectList({ projects, onEdit, onDelete, onArchive, onRestore }: ProjectListProps) {
  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground font-medium text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4 w-[120px]">Status</th>
              <th className="py-3 px-4 w-[160px]">Progress</th>
              <th className="py-3 px-4 w-[100px]">Members</th>
              <th className="py-3 px-4 w-[140px]">Updated</th>
              <th className="py-3 px-4 w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects.map((project) => {
              const IconComponent = ICON_MAP[project.icon] || FolderKanban;
              const taskCount = project.taskCount || 0;
              const completedCount = project.completedTaskCount || 0;
              const progressPercent = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

              let formattedDate = '';
              if (project.updatedAt) {
                let dateObj: Date | null = null;
                if (typeof project.updatedAt === 'string') {
                  dateObj = new Date(project.updatedAt);
                } else if (project.updatedAt.toDate) {
                  dateObj = project.updatedAt.toDate();
                }
                if (dateObj) {
                  formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                }
              }

              return (
                <tr key={project.id} className="hover:bg-muted/30 group transition-colors">
                  {/* Title & Description */}
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <Link href={`/projects/${project.id}`} className="block">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: project.color || '#94a3b8' }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-medium text-foreground block truncate group-hover:text-primary transition-colors">
                            {project.title}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1 block">
                            {project.description || 'No description provided.'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 align-middle">
                    <ProjectStatusBadge status={project.status} />
                  </td>

                  {/* Progress bar */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="space-y-1 max-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{progressPercent}%</span>
                        <span>{completedCount}/{taskCount} tasks</span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  </td>

                  {/* Member count */}
                  <td className="py-3.5 px-4 align-middle text-muted-foreground text-xs">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{project.memberIds?.length || 1}</span>
                    </span>
                  </td>

                  {/* Updated at */}
                  <td className="py-3.5 px-4 align-middle text-muted-foreground text-xs">
                    {formattedDate ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formattedDate}</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Actions dropdown */}
                  <td className="py-3.5 px-4 align-middle text-right">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
