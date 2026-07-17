'use client';

import * as React from 'react';
import { Search, Grid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProjectHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  sortBy: 'updatedAt' | 'title' | 'createdAt';
  onSortByChange: (val: 'updatedAt' | 'title' | 'createdAt') => void;
  filterStatus: 'all' | 'active' | 'completed' | 'archived';
  onFilterStatusChange: (val: 'all' | 'active' | 'completed' | 'archived') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (val: 'grid' | 'list') => void;
  onCreateClick: () => void;
}

export function ProjectHeader({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  filterStatus,
  onFilterStatusChange,
  viewMode,
  onViewModeChange,
  onCreateClick,
}: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Manage and track all projects and progress inside your workspace.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-8 h-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground hidden lg:inline">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as 'all' | 'active' | 'completed' | 'archived')}
            className="h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground hidden lg:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as 'updatedAt' | 'title' | 'createdAt')}
            className="h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Date Created</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border p-0.5">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => onViewModeChange('list')}
            title="List view"
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Create Project Button */}
        <Button onClick={onCreateClick} className="h-9">
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}
