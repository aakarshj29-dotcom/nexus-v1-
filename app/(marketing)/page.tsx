import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FolderKanban, ListTodo, FileText, Calendar, MessageSquare, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Nexus V1 - All-in-One Collaboration & Productivity Platform',
  description: 'Unify your projects, tasks, collaborative notes, real-time messaging, and shared calendars inside a beautiful, premium collaboration workspace.',
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-[family-name:var(--font-geist-sans)]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
              N
            </div>
            <span className="text-xl font-bold tracking-tight">Nexus V1</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="font-semibold">
                Go to Workspace <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        {/* Background Decorative Blur */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-blue-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground border mb-6">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Nexus V1 Foundation Ready
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
              Unify Your Team&apos;s Projects, Tasks, and Conversations
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Nexus V1 is a premium, real-time workspace that merges collaborative note-taking, project tracking, task boards, and chats into one elegant interface.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/dashboard">
                <Button size="lg" className="px-8 font-semibold shadow-lg shadow-primary/20">
                  Enter App Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors">
                Create Free Account <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 bg-muted/35 border-y">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need in one place
            </h2>
            <p className="mt-4 text-muted-foreground">
              Stop context-switching between separate platforms. Nexus V1 integrates the five pillars of modern digital operations.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Projects */}
            <div className="relative overflow-hidden rounded-2xl border bg-background p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Projects Overview</h3>
              <p className="text-sm text-muted-foreground">
                Track, coordinate, and organize your work across dedicated team-level and personal-level workspaces seamlessly.
              </p>
            </div>

            {/* Tasks */}
            <div className="relative overflow-hidden rounded-2xl border bg-background p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                <ListTodo className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Kanban & List Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Visualize progress, update task statuses instantly, and drag & drop cards to manage workload in real-time.
              </p>
            </div>

            {/* Notes */}
            <div className="relative overflow-hidden rounded-2xl border bg-background p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Rich Notes Editor</h3>
              <p className="text-sm text-muted-foreground">
                Write meeting items, strategies, and notes in our dynamic Tiptap editor featuring styling, checklist blocks, and soft-delete archives.
              </p>
            </div>

            {/* Calendar */}
            <div className="relative overflow-hidden rounded-2xl border bg-background p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Unified Calendar</h3>
              <p className="text-sm text-muted-foreground">
                View project deadlines, task target dates, and custom-scheduled user events under a unified, real-time interactive calendar.
              </p>
            </div>

            {/* Messages */}
            <div className="relative overflow-hidden rounded-2xl border bg-background p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-time Messaging</h3>
              <p className="text-sm text-muted-foreground">
                Communicate live with teammates in private direct channels, featuring embedded interactive rich resource attachments.
              </p>
            </div>

            {/* Workspace switcher */}
            <div className="relative overflow-hidden rounded-2xl border bg-background p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Workspace Isolation</h3>
              <p className="text-sm text-muted-foreground">
                Maintain enterprise-grade logical access boundary controls, switching seamlessly between workspaces while staying perfectly secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Nexus V1. All rights reserved. Built for production excellence.
          </p>
        </div>
      </footer>
    </div>
  )
}
