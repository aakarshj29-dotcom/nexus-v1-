'use client';

import React from 'react';
import Link from 'next/link';
import { FolderKanban, Users, FileText, Calendar, ArrowUpRight } from 'lucide-react';
import { LiveObjectAttachment } from '@/types/message';

interface LiveObjectCardProps {
  attachment: LiveObjectAttachment;
}

export const LiveObjectCard: React.FC<LiveObjectCardProps> = ({ attachment }) => {
  const { type, id, title, statusOrDate } = attachment;

  const getDetails = () => {
    switch (type) {
      case 'project':
        return {
          icon: FolderKanban,
          label: 'Project',
          colorClass: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
          href: `/projects/${id}`,
        };
      case 'task':
        return {
          icon: Users,
          label: 'Task',
          colorClass: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
          href: `/dashboard/tasks`,
        };
      case 'note':
        return {
          icon: FileText,
          label: 'Note',
          colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          href: `/dashboard/notes`,
        };
      case 'event':
        return {
          icon: Calendar,
          label: 'Calendar Event',
          colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          href: `/dashboard/calendar`,
        };
      default:
        return {
          icon: FileText,
          label: 'Object',
          colorClass: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
          href: '#',
        };
    }
  };

  const { icon: Icon, label, colorClass, href } = getDetails();

  return (
    <Link href={href} className="block group mt-2 max-w-sm">
      <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-foreground/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center justify-center p-1 rounded border text-xs font-semibold ${colorClass}`}>
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </span>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
            {title}
          </h4>
          {statusOrDate && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {statusOrDate}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
