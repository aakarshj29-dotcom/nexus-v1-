'use client';

import { ProjectStatus } from '@/types/project';
import { Badge } from '@/components/ui/badge';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="success" className={className}>
          Active
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="secondary" className={className}>
          Completed
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="warning" className={className}>
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          Unknown
        </Badge>
      );
  }
}
