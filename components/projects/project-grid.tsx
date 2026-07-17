'use client';

import * as React from 'react';
import { Project } from '@/types/project';
import { ProjectCard } from './project-card';

interface ProjectGridProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onArchive: (projectId: string) => void;
  onRestore: (projectId: string) => void;
}

export function ProjectGrid({ projects, onEdit, onDelete, onArchive, onRestore }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}
