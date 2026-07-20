'use client';

import * as React from 'react';
import { useProjects } from '@/hooks/use-projects';
import { Project, ProjectStatus } from '@/types/project';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectGrid } from '@/components/projects/project-grid';
import { ProjectList } from '@/components/projects/project-list';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { EmptyProjectState } from '@/components/projects/empty-project-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FolderOpen } from 'lucide-react';
import { StateError } from '@/components/ui/states';

export default function ProjectsPage() {
  const {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
  } = useProjects();

  // Filter/Sort State
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'updatedAt' | 'title' | 'createdAt'>('updatedAt');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

  // Success message alert
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Memoized Filtered & Sorted Projects
  const filteredAndSortedProjects = React.useMemo(() => {
    let result = [...projects];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }

    // Filter by search query
    if (search.trim()) {
      const queryStr = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(queryStr) ||
          p.description.toLowerCase().includes(queryStr)
      );
    }

    // Sort projects
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }

      // Handle Timestamp or ISO string date conversion
      const dateA = a[sortBy]
        ? typeof a[sortBy] === 'string'
          ? new Date(a[sortBy] as string).getTime()
          : (a[sortBy] as unknown as { seconds: number }).seconds * 1000
        : 0;

      const dateB = b[sortBy]
        ? typeof b[sortBy] === 'string'
          ? new Date(b[sortBy] as string).getTime()
          : (b[sortBy] as unknown as { seconds: number }).seconds * 1000
        : 0;

      return dateB - dateA; // Newest / recently updated first
    });

    return result;
  }, [projects, search, sortBy, filterStatus]);

  const handleCreate = async (input: { title: string; description: string; color: string; icon: string }) => {
    await createProject(input);
    showSuccess(`Project "${input.title}" was successfully created!`);
  };

  const handleUpdate = async (
    projectId: string,
    input: { title: string; description: string; color: string; icon: string; status: ProjectStatus }
  ) => {
    await updateProject(projectId, input);
    showSuccess(`Project "${input.title}" details were updated!`);
  };

  const handleArchive = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    await archiveProject(projectId);
    if (proj) {
      showSuccess(`Project "${proj.title}" has been archived.`);
    }
  };

  const handleRestore = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    await restoreProject(projectId);
    if (proj) {
      showSuccess(`Project "${proj.title}" is now active again.`);
    }
  };

  const handleDelete = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    await deleteProject(projectId);
    if (proj) {
      showSuccess(`Project "${proj.title}" has been deleted.`);
    }
  };

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  if (error) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center max-w-4xl mx-auto">
        <StateError
          title="Error Loading Projects"
          message={error.message || 'Something went wrong while fetching projects.'}
          retryLabel="Reload Page"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header section with view toggle, search, and filter */}
      <ProjectHeader
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {/* Toast Alert for Operations feedback */}
      {successMessage && (
        <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <FolderOpen className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Content Space */}
      {loading ? (
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <div className="space-y-2 pt-2 border-t">
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        <EmptyProjectState onCreateClick={() => setIsCreateOpen(true)} />
      ) : viewMode === 'grid' ? (
        <ProjectGrid
          projects={filteredAndSortedProjects}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onArchive={handleArchive}
          onRestore={handleRestore}
        />
      ) : (
        <ProjectList
          projects={filteredAndSortedProjects}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onArchive={handleArchive}
          onRestore={handleRestore}
        />
      )}

      {/* Accessible Dialogs */}
      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
      />

      <EditProjectDialog
        project={selectedProject}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={handleUpdate}
      />

      <DeleteProjectDialog
        project={selectedProject}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
