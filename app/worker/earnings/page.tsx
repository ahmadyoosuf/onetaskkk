"use client"

import { useMemo, Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { ErrorBoundary } from "@/components/error-boundary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, Clock, Check, FileText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { useWorkerEarnings, useWorkerSubmissions, useTasks } from "@/hooks/use-store"
import type { SubmissionStatus } from "@/lib/types"

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  pending: "bg-warning",
  approved: "bg-success",
  rejected: "bg-destructive",
}

function EarningsContent() {
  const { user } = useAuth()
  const { approvedEarnings, pendingEarnings, totalEarnings, totalSubmitted, totalApproved } = useWorkerEarnings(user?.id)
  const { submissions } = useWorkerSubmissions(user?.id)
  const { tasks } = useTasks()

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  // Recent submissions (last 10)
  const recentSubmissions = useMemo(() => {
    return submissions
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 10)
  }, [submissions])

  // Per-task earnings breakdown
  const taskEarnings = useMemo(() => {
    const map = new Map<string, { taskTitle: string; approved: number; pending: number; count: number }>()
    for (const s of submissions) {
      const task = taskMap.get(s.taskId)
      if (!task) continue
      let reward = task.reward
      if (task.phases && s.phaseIndex) {
        const phase = task.phases.find((p) => p.phaseIndex === s.phaseIndex)
        if (phase) reward = phase.reward
      }
      const existing = map.get(s.taskId) ?? { taskTitle: task.title, approved: 0, pending: 0, count: 0 }
      existing.count++
      if (s.status === "approved") existing.approved += reward
      else if (s.status === "pending") existing.pending += reward
      map.set(s.taskId, existing)
    }
    return Array.from(map.entries())
      .map(([taskId, data]) => ({ taskId, ...data }))
      .sort((a, b) => (b.approved + b.pending) - (a.approved + a.pending))
      .slice(0, 5)
  }, [submissions, taskMap])

  const approvalRate = totalSubmitted > 0 ? Math.round((totalApproved / totalSubmitted) * 100) : 0

  return (
    <AppShell role="worker">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Earnings</h1>
          <p className="text-sm text-muted-foreground">Track your earnings and submission history.</p>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Earnings (Optimistic) */}
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">A${totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                {pendingEarnings > 0 && (
                  <p className="text-xs text-warning mt-0.5">
                    A${pendingEarnings.toFixed(2)} pending
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Confirmed */}
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Check className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">A${approvedEarnings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Completed */}
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                <FileText className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{totalSubmitted}</p>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </CardContent>
          </Card>

          {/* Approval Rate */}
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{approvalRate}%</p>
                <p className="text-sm text-muted-foreground">Approval Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Tasks by Earnings */}
          <Card className="border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Earning Tasks</CardTitle>
              <CardDescription>Your highest-earning tasks so far.</CardDescription>
            </CardHeader>
            <CardContent>
              {taskEarnings.length === 0 ? (
                <div className="flex h-24 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No earnings yet. Complete some tasks to start earning.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {taskEarnings.map(({ taskId, taskTitle, approved, pending, count }) => (
                    <div key={taskId} className="flex items-center justify-between gap-3 rounded-lg border border-border/20 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{taskTitle}</p>
                        <p className="text-xs text-muted-foreground">{count} submission{count !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-success">A${(approved + pending).toFixed(2)}</p>
                        {pending > 0 && (
                          <p className="text-[10px] text-warning">A${pending.toFixed(2)} pending</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Your latest submissions.</CardDescription>
                </div>
                <Link href="/worker/submissions">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    View All
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length === 0 ? (
                <div className="flex h-24 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSubmissions.map((sub) => {
                    const task = taskMap.get(sub.taskId)
                    let reward = task?.reward ?? 0
                    if (task?.phases && sub.phaseIndex) {
                      const phase = task.phases.find((p) => p.phaseIndex === sub.phaseIndex)
                      if (phase) reward = phase.reward
                    }
                    return (
                      <div key={sub.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/10 last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_COLORS[sub.status])} />
                          <div className="min-w-0">
                            <p className="text-sm truncate">{task?.title ?? "Unknown Task"}</p>
                            <p className="text-[10px] text-muted-foreground">{sub.submittedAt.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={sub.status === "approved" ? "approved" : sub.status === "rejected" ? "rejected" : "pending"}
                            className="text-[10px] px-1.5"
                          >
                            {sub.status === "pending" && <Clock className="mr-0.5 h-2.5 w-2.5" />}
                            {sub.status === "approved" && <Check className="mr-0.5 h-2.5 w-2.5" />}
                            {sub.status}
                          </Badge>
                          <span className="text-xs font-mono text-success">+A${reward.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Earnings Progress Bar */}
        {totalSubmitted > 0 && (
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Earnings Breakdown</span>
                <span>A${totalEarnings.toFixed(2)} total</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {approvedEarnings > 0 && (
                  <div
                    className="bg-success transition-all duration-500"
                    style={{ width: `${(approvedEarnings / Math.max(totalEarnings, 0.01)) * 100}%` }}
                  />
                )}
                {pendingEarnings > 0 && (
                  <div
                    className="bg-warning transition-all duration-500"
                    style={{ width: `${(pendingEarnings / Math.max(totalEarnings, 0.01)) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Confirmed</span>
                  <span className="font-medium">A${approvedEarnings.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">A${pendingEarnings.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

export default function EarningsPage() {
  return (
    <Suspense fallback={
      <AppShell role="worker">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </AppShell>
    }>
      <ErrorBoundary>
        <EarningsContent />
      </ErrorBoundary>
    </Suspense>
  )
}
