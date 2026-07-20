'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProjects } from './use-projects';
import { useTasks } from './use-tasks';
import { useCalendar } from './use-calendar';
import { useNotes } from './use-notes';
import { useConversations } from './use-conversations';
import { useWorkspaces } from './use-workspaces';

export function useSearch(searchQuery: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query to prevent laggy input transitions
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Retrieve all authorized data streams through existing reactive subscription hooks
  const { projects, loading: loadingProjects } = useProjects();
  const { tasks, loading: loadingTasks } = useTasks();
  const { unifiedItems, loading: loadingCalendar } = useCalendar();
  const { notes, loading: loadingNotes } = useNotes();
  const { conversations, loading: loadingConversations } = useConversations();
  const { workspaces, activeWorkspace, loading: loadingWorkspaces } = useWorkspaces();

  const results = useMemo(() => {
    const queryClean = debouncedQuery.trim().toLowerCase();

    if (!queryClean) {
      return {
        projects: [],
        tasks: [],
        calendar: [],
        notes: [],
        conversations: [],
        workspaces: [],
        hasResults: false,
      };
    }

    // Projects: limited to 5 results
    const matchedProjects = projects
      .filter(
        (p) =>
          !p.deleted &&
          (p.title.toLowerCase().includes(queryClean) ||
            p.description.toLowerCase().includes(queryClean))
      )
      .slice(0, 5);

    // Tasks: limited to 5 results
    const matchedTasks = tasks
      .filter(
        (t) =>
          !t.deleted &&
          (t.title.toLowerCase().includes(queryClean) ||
            t.description.toLowerCase().includes(queryClean))
      )
      .slice(0, 5);

    // Calendar: limited to 5 results (events/deadlines)
    const matchedCalendar = unifiedItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(queryClean) ||
          (item.description && item.description.toLowerCase().includes(queryClean))
      )
      .slice(0, 5);

    // Notes: limited to 5 results
    const matchedNotes = notes
      .filter(
        (n) =>
          !n.deleted &&
          (n.title.toLowerCase().includes(queryClean) ||
            n.content.toLowerCase().includes(queryClean) ||
            n.excerpt.toLowerCase().includes(queryClean))
      )
      .slice(0, 5);

    // Conversations: limited to 5 results (by workspace name or sender text)
    const matchedConversations = conversations
      .filter((c) => {
        const nameMatch = c.name && c.name.toLowerCase().includes(queryClean);
        const descMatch = c.description && c.description.toLowerCase().includes(queryClean);
        const lastMsgMatch =
          c.lastMessage?.text && c.lastMessage.text.toLowerCase().includes(queryClean);
        return nameMatch || descMatch || lastMsgMatch;
      })
      .slice(0, 5);

    // Workspaces: limited to 5 results
    const matchedWorkspaces = workspaces
      .filter(
        (w) =>
          !w.deleted &&
          (w.name.toLowerCase().includes(queryClean) ||
            w.description.toLowerCase().includes(queryClean))
      )
      .slice(0, 5);

    const hasResults =
      matchedProjects.length > 0 ||
      matchedTasks.length > 0 ||
      matchedCalendar.length > 0 ||
      matchedNotes.length > 0 ||
      matchedConversations.length > 0 ||
      matchedWorkspaces.length > 0;

    return {
      projects: matchedProjects,
      tasks: matchedTasks,
      calendar: matchedCalendar,
      notes: matchedNotes,
      conversations: matchedConversations,
      workspaces: matchedWorkspaces,
      hasResults,
    };
  }, [debouncedQuery, projects, tasks, unifiedItems, notes, conversations, workspaces]);

  const isLoading =
    typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true'
      ? false
      : loadingProjects ||
        loadingTasks ||
        loadingCalendar ||
        loadingNotes ||
        loadingConversations ||
        loadingWorkspaces;

  return {
    results,
    isLoading,
    activeWorkspace,
  };
}
