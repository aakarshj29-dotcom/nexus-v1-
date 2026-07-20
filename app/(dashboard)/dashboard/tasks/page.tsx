'use client';

import * as React from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { TaskKanbanBoard } from '@/components/tasks/task-kanban-board';
import { TaskList } from '@/components/tasks/task-list';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog';
import { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StateError, StateEmpty, StateLoading } from '@/components/ui/states';
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  CheckSquare,
  X,
} from 'lucide-react';

export default function TasksPage() {
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list'>('list'); // Default to list for overview, kanban available
  const [searchQuery, setSearchQuery] = React.useState('');
  const [projectIdFilter, setProjectIdFilter] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | ''>('');
  const [sortBy, setSortBy] = React.useState<'position' | 'dueDate' | 'title' | 'createdAt' | 'priority'>('dueDate'); // Sort by due date by default globally

  // Fetch all user projects to feed the project filter dropdown
  const { projects, loading: projectsLoading } = useProjects();

  // Fetch tasks using hook with options (automatically uses current user.uid)
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks({
    projectId: projectIdFilter || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    searchQuery,
    sortBy,
  });

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
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
      await deleteTask(taskId);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setProjectIdFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setSortBy('dueDate');
  };

  const isFiltered = searchQuery || projectIdFilter || statusFilter || priorityFilter;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Manage, schedule, and organize all tasks across your active projects.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="sm:w-fit w-full">
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search task title or description..."
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

            {/* Project Filter */}
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-9 min-w-[140px]"
              value={projectIdFilter}
              onChange={(e) => setProjectIdFilter(e.target.value)}
              disabled={projectsLoading}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-9 min-w-[120px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-9 min-w-[120px]"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Sorting */}
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-9 min-w-[140px]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'position' | 'dueDate' | 'title' | 'createdAt' | 'priority')}
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="position">Sort by Position</option>
              <option value="title">Sort Alphabetically</option>
              <option value="priority">Sort by Priority weight</option>
              <option value="createdAt">Sort by Created Date</option>
            </select>

            {/* View Toggle */}
            <div className="flex border rounded-md p-0.5 bg-muted/50 h-9 items-center shrink-0">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('kanban')}
                className="h-8 w-8 rounded-sm p-0"
                title="Kanban Board"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 rounded-sm p-0"
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Reset Filters Option */}
          {isFiltered && (
            <div className="flex justify-end border-t pt-2 border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main tasks container */}
      {tasksError ? (
        <StateError
          title="Error Loading Tasks"
          message={tasksError.message || 'There was an issue loading your tasks.'}
          retryLabel="Try Again"
          onRetry={resetFilters}
        />
      ) : tasksLoading ? (
        <StateLoading message="Loading tasks..." />
      ) : tasks.length === 0 ? (
        <StateEmpty
          title="No tasks found"
          description={
            isFiltered
              ? "We couldn't find any tasks matching your filters. Try relaxing your filters or search terms."
              : "You don't have any tasks in this workspace yet. Create a task to get started!"
          }
          icon={CheckSquare}
          actionLabel={isFiltered ? "Clear Filters" : "Add Your First Task"}
          onAction={isFiltered ? resetFilters : () => setIsCreateOpen(true)}
        />
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

      {/* Modals */}
      <CreateTaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateTask}
      />

      <EditTaskDialog
        task={editingTask}
        open={editingTask !== null}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
}
