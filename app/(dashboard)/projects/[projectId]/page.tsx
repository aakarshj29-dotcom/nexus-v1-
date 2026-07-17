'use client';

import * as React from 'react';
import Link from 'next/link';
import { useProject } from '@/hooks/use-project';
import { useTasks } from '@/hooks/use-tasks';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditProjectDialog } from '@/components/projects/edit-project-dialog';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog';
import { TaskKanbanBoard } from '@/components/tasks/task-kanban-board';
import { TaskList } from '@/components/tasks/task-list';
import { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { Input } from '@/components/ui/input';

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
  LayoutGrid,
  List,
  Search,
  Plus,
  X,
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

  // Real-time project subscription
  const { project, loading: projectLoading, error: projectError, updateProject, archiveProject, restoreProject, deleteProject } = useProject(projectId);

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

  // Format dates
  const formattedCreatedDate = React.useMemo(() => {
    if (!project?.createdAt) return '';
    let dateObj: Date | null = null;
    if (typeof project.createdAt === 'string') {
      dateObj = new Date(project.createdAt);
    } else if (project.createdAt && typeof project.createdAt === 'object' && 'toDate' in project.createdAt) {
      dateObj = (project.createdAt as { toDate: () => Date }).toDate();
    }
    return dateObj ? dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  }, [project?.createdAt]);

  const formattedUpdatedDate = React.useMemo(() => {
    if (!project?.updatedAt) return '';
    let dateObj: Date | null = null;
    if (typeof project.updatedAt === 'string') {
      dateObj = new Date(project.updatedAt);
    } else if (project.updatedAt && typeof project.updatedAt === 'object' && 'toDate' in project.updatedAt) {
      dateObj = (project.updatedAt as { toDate: () => Date }).toDate();
    }
    return dateObj ? dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  }, [project?.updatedAt]);


  // ==========================================
  // TASKS MANAGEMENT integration
  // ==========================================
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | ''>('');
  const [sortBy, setSortBy] = React.useState<'position' | 'dueDate' | 'title' | 'createdAt' | 'priority'>('position');

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask: deleteTaskHandler,
  } = useTasks({
    projectId,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    searchQuery,
    sortBy,
  });

  const [isCreateTaskOpen, setIsCreateTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  const handleCreateTask = async (input: CreateTaskInput) => {
    return await createTask(input);
  };

  const handleUpdateTask = async (input: UpdateTaskInput) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, input);
    setEditingTask(null);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task? This cannot be undone.')) {
      await deleteTaskHandler(taskId);
    }
  };


  if (projectLoading) {
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

  if (projectError || !project) {
    return (
      <div className="flex-1 p-6 flex flex-col gap-4 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Project Details</AlertTitle>
          <AlertDescription>
            {projectError?.message || 'Project not found or access denied.'}
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
            className="flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-sm font-bold"
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
        {/* Left Column: Details & Tabs */}
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

            {/* Tab content */}
            <div className="min-h-[260px] rounded-xl border bg-card text-card-foreground shadow-xs p-4 md:p-6 animate-fade-in">
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/50">
                    <div className="flex flex-1 flex-wrap items-center gap-2 max-w-xl">
                      {/* Search */}
                      <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tasks..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 h-9 text-xs"
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-1 top-1 h-7 w-7 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Status select */}
                      <select
                        className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                      >
                        <option value="">All Statuses</option>
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                      </select>

                      {/* Priority select */}
                      <select
                        className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
                      >
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>

                      {/* Sort select */}
                      <select
                        className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'position' | 'dueDate' | 'title' | 'createdAt' | 'priority')}
                      >
                        <option value="position">Kanban Position</option>
                        <option value="dueDate">Due Date</option>
                        <option value="title">Alphabetical</option>
                        <option value="priority">Priority weight</option>
                        <option value="createdAt">Created Date</option>
                      </select>
                    </div>

                    {/* View mode toggle and Add Task button */}
                    <div className="flex items-center gap-2">
                      <div className="flex border rounded-md p-0.5 bg-muted/50 shrink-0">
                        <Button
                          variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                          size="icon"
                          onClick={() => setViewMode('kanban')}
                          className="h-7 w-7 rounded-sm p-0"
                          title="Kanban Board"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="icon"
                          onClick={() => setViewMode('list')}
                          className="h-7 w-7 rounded-sm p-0"
                          title="List View"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button size="sm" onClick={() => setIsCreateTaskOpen(true)} className="h-8 text-xs">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Task
                      </Button>
                    </div>
                  </div>

                  {/* Tasks Container */}
                  {tasksError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Failed to load tasks</AlertTitle>
                      <AlertDescription>{tasksError.message}</AlertDescription>
                    </Alert>
                  ) : tasksLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-3 rounded-xl border p-4 bg-card">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed rounded-xl bg-muted/10">
                      <CheckSquare className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
                      <h4 className="font-semibold text-sm">No tasks found</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        {searchQuery || statusFilter || priorityFilter
                          ? "No tasks match your current filters. Try relaxing your search criteria!"
                          : "Get started by adding your first project task to organize your workspace."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateTaskOpen(true)}
                        className="mt-4 text-xs h-8"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Your First Task
                      </Button>
                    </div>
                  ) : viewMode === 'kanban' ? (
                    <TaskKanbanBoard
                      tasks={tasks}
                      onEditClick={setEditingTask}
                      onDeleteClick={handleDeleteTask}
                      onStatusChange={handleStatusChange}
                    />
                  ) : (
                    <TaskList
                      tasks={tasks}
                      onEditClick={setEditingTask}
                      onDeleteClick={handleDeleteTask}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-3 max-w-sm mx-auto text-center py-6">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base">Collaboration & Teams</h3>
                  <p className="text-sm text-muted-foreground">
                    Future workspace integration will enable invite flows, real-time presence, role-based controls, and member sync for project boards.
                  </p>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3 max-w-sm mx-auto text-center py-6">
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

      {/* Task Creation Modal */}
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        projectId={projectId}
        onCreate={handleCreateTask}
      />

      {/* Task Editing Modal */}
      <EditTaskDialog
        task={editingTask}
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
}
