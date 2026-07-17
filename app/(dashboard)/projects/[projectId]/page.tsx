'use client';

import * as React from 'react';
import Link from 'next/link';
import { useProject } from '@/hooks/use-project';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  FolderKanban,
  Briefcase,
  Flame,
  Star,
  Rocket,
  Sparkles,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  Clock,
  CheckSquare,
  UserPlus,
  Activity,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderKanban,
  Briefcase,
  Flame,
  Star,
  Rocket,
  Sparkles,
};

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function ProjectDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { projectId } = React.use(params);
  const { project, loading, error, updateProject, archiveProject, restoreProject, deleteProject } = useProject(projectId);

  // Active tab state
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'team' | 'activity'>('tasks');

  // Dialog State
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  // Success message alert
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handleUpdate = async (
    id: string,
    input: { title: string; description: string; color: string; icon: string; status: 'active' | 'completed' | 'archived' }
  ) => {
    await updateProject(input);
    showSuccess('Project details were updated!');
  };

  const handleArchive = async () => {
    if (!project) return;
    await archiveProject();
    showSuccess(`Project "${project.title}" has been archived.`);
  };

  const handleRestore = async () => {
    if (!project) return;
    await restoreProject();
    showSuccess(`Project "${project.title}" is now active again.`);
  };

  const handleDeleteConfirm = async () => {
    await deleteProject();
    router.replace('/projects');
  };

  // Helper for dynamic icon
  const IconComponent = project ? (ICON_MAP[project.icon] || FolderKanban) : FolderKanban;

  // Safe progress calculation
  const taskCount = project?.taskCount || 0;
  const completedCount = project?.completedTaskCount || 0;
  const progressPercent = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  // Format date correctly
  const formattedCreatedDate = React.useMemo(() => {
    if (!project?.createdAt) return '';
    let dateObj: Date | null = null;
    if (typeof project.createdAt === 'string') {
      dateObj = new Date(project.createdAt);
    } else if ((project.createdAt as unknown as { toDate: () => Date }).toDate) {
      dateObj = (project.createdAt as unknown as { toDate: () => Date }).toDate();
    }
    return dateObj ? dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  }, [project?.createdAt]);

  const formattedUpdatedDate = React.useMemo(() => {
    if (!project?.updatedAt) return '';
    let dateObj: Date | null = null;
    if (typeof project.updatedAt === 'string') {
      dateObj = new Date(project.updatedAt);
    } else if ((project.updatedAt as unknown as { toDate: () => Date }).toDate) {
      dateObj = (project.updatedAt as unknown as { toDate: () => Date }).toDate();
    }
    return dateObj ? dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  }, [project?.updatedAt]);

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex-1 p-6 flex flex-col gap-4 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Project Details</AlertTitle>
          <AlertDescription>
            {error?.message || 'Project not found or access denied.'}
          </AlertDescription>
        </Alert>
        <Link href="/projects">
          <Button variant="outline" className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {project.status === 'archived' ? (
            <Button variant="outline" size="sm" onClick={handleRestore} className="h-8">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Restore
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleArchive} className="h-8">
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archive
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="h-8">
            <Edit2 className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)} className="h-8">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Hero Banner Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: project.color || '#94a3b8' }}
          >
            <IconComponent className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Created {formattedCreatedDate}</span>
              <span>•</span>
              <span>Updated {formattedUpdatedDate}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout: Main info and Sidebar info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Details & Tabs Placeholder */}
        <div className="lg:col-span-8 space-y-6">
          {/* Project Description Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                {project.description || 'No description provided for this project. Keep project goals, details, and briefs aligned here.'}
              </p>
            </CardContent>
          </Card>

          {/* Interactive Navigation Tabs */}
          <div className="space-y-4">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 py-2.5 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'tasks'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`flex items-center gap-2 py-2.5 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'team'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Team
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-2 py-2.5 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'activity'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="h-4 w-4" />
                Activity
              </button>
            </div>

            {/* Tab content placeholder boxes */}
            <div className="min-h-[260px] rounded-xl border bg-card text-card-foreground shadow-xs p-6 flex flex-col items-center justify-center text-center animate-fade-in">
              {activeTab === 'tasks' && (
                <div className="space-y-3 max-w-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base">Tasks system is coming soon</h3>
                  <p className="text-sm text-muted-foreground">
                    This module is reserved for Chapter 8. In the next chapter, you will be able to create, assign, schedule, and complete project tasks here.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" disabled>
                    Add Task Placeholder
                  </Button>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-3 max-w-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base">Collaboration & Teams</h3>
                  <p className="text-sm text-muted-foreground">
                    Future workspace integration will enable invite flows, real-time presence, role-based controls, and member sync for project boards.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" disabled>
                    Invite Teammates
                  </Button>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3 max-w-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base">Audit Trail & Activity Log</h3>
                  <p className="text-sm text-muted-foreground">
                    A complete chronological feed of project events, updates, file attachments, and task assignments will be displayed here in a future update.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Project Progress, Metrics & Metadata */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold tracking-tight">{progressPercent}%</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {completedCount} of {taskCount} Completed
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg border p-3 text-center bg-muted/20">
                  <span className="text-xs text-muted-foreground block mb-0.5">Total Tasks</span>
                  <span className="text-lg font-bold text-foreground">{taskCount}</span>
                </div>
                <div className="rounded-lg border p-3 text-center bg-muted/20">
                  <span className="text-xs text-muted-foreground block mb-0.5">Completed</span>
                  <span className="text-lg font-bold text-foreground">{completedCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Workspace ID</span>
                </span>
                <span className="font-mono text-xs">{project.workspaceId || 'default'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>Project Owner</span>
                </span>
                <span className="text-xs truncate max-w-[160px]" title={project.ownerId}>
                  {project.ownerId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>Status</span>
                </span>
                <span className="text-xs font-semibold uppercase">{project.status}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Modals */}
      <EditProjectDialog
        project={project}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={handleUpdate}
      />

      <DeleteProjectDialog
        project={project}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
