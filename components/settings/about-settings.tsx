'use client';

import * as React from 'react';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { Info, Globe, Award, ShieldCheck, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AboutSettings() {
  const { activeWorkspace } = useWorkspaces();

  const systemInfo = React.useMemo(() => {
    if (typeof window === 'undefined') return [];
    return [
      { name: 'App Version', value: 'v1.0.4-stable' },
      { name: 'Active Workspace ID', value: activeWorkspace?.id || 'None' },
      { name: 'Active Workspace Name', value: activeWorkspace?.name || 'None' },
      { name: 'Client Language', value: window.navigator.language || 'en-US' },
      { name: 'System Local Time', value: new Date().toLocaleTimeString() },
    ];
  }, [activeWorkspace]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">About Nexus V1</h2>
        <p className="text-sm text-muted-foreground">
          System metadata, build documentation, terms of service, and credits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {/* Brand details */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl shadow-md">
                N
              </div>
              <div>
                <CardTitle className="text-lg">Nexus V1</CardTitle>
                <p className="text-xs text-muted-foreground">Next-Gen Team Collaboration Platform</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Nexus V1 is a premium task manager, chat interface, calendar, and real-time document sharing engine designed for high-performance development teams.
            </p>
            <p className="text-xs">
              Made with Next.js 15, TypeScript, Tailwind CSS, and Firebase. Build optimizations are compiled for high speed, premium caching, and client-side offline tolerance.
            </p>
            <div className="flex items-center gap-4 pt-2 border-t text-xs font-semibold text-primary">
              <a href="#" className="flex items-center gap-1 hover:underline">
                <Globe className="h-3 w-3" />
                Website
              </a>
              <a href="#" className="flex items-center gap-1 hover:underline">
                <ShieldCheck className="h-3 w-3" />
                Privacy Policy
              </a>
              <a href="#" className="flex items-center gap-1 hover:underline">
                <FileText className="h-3 w-3" />
                Terms of Service
              </a>
            </div>
          </CardContent>
        </Card>

        {/* System Diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-primary" />
              Diagnostics & Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-xs">
              {systemInfo.map((info) => (
                <div key={info.name} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground font-medium">{info.name}</dt>
                  <dd className="font-mono text-foreground font-semibold max-w-[200px] truncate">{info.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl border rounded-xl p-5 bg-muted/10 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Award className="h-4 w-4 text-primary" />
          Platform Credits & Acknowledgments
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Nexus is designed, developed, and maintained by elite engineers globally. We thank all Open Source contributors of packages such as React, Next.js, Firebase, Radix UI, Tailwind CSS, Lucide icons, and more.
        </p>
      </div>
    </div>
  );
}
