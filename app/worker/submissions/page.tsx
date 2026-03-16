"use client"

import { useMemo, useRef, Suspense } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useQueryState, parseAsStringLiteral } from "nuqs"
import { AppShell } from "@/components/app-shell"
import { ErrorBoundary, DataErrorState } from "@/components/error-boundary"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EvidenceImage } from "@/components/submissions/evidence-image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Clock, Check, X, ExternalLink, FileText, Filter, Share2, Mail, Heart, ArrowUpDown, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { useWorkerSubmissions, useTasks } from "@/hooks/use-store"
import { useState } from "react"
import type { Submission, SubmissionStatus, TaskType } from "@/lib/types"
import { TASK_TYPE_META } from "@/lib/types"

const STATUS_META: Record<SubmissionStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "bg-warning" },
  approved: { label: "Approved", icon: Check, color: "bg-success" },
  rejected: { label: "Rejected", icon: X, color: "bg-destructive" },
}

const TASK_ICONS: Record<TaskType, typeof Share2> = {
  social_media_posting: Share2,
  email_sending: Mail,
  social_media_liking: Heart,
}

// URL state parsers
const statusFilterParser = parseAsStringLiteral(["all", "pending", "approved", "rejected"] as const).withDefault("all")
const sortByParser = parseAsStringLiteral(["newest", "oldest"] as const).withDefault("newest")

function WorkerSubmissionsContent() {
  const { user } = useAuth()
  const { submissions, isLoading, error, refetch } = useWorkerSubmissions(user?.id)
  const { tasks } = useTasks()
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)

  const [statusFilter, setStatusFilter] = useQueryState("status", statusFilterParser)
  const [sortBy, setSortBy] = useQueryState("sort", sortByParser)

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  const filteredSubmissions = useMemo(() => {
    let result = submissions
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter)
    }
    switch (sortBy) {
      case "newest":
        result = [...result].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        break
      case "oldest":
        result = [...result].sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
        break
    }
    return result
  }, [submissions, statusFilter, sortBy])

  const virtualizer = useVirtualizer({
    count: filteredSubmissions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 10,
  })

  const handleSelect = (sub: Submission) => {
    setSelectedSubmission(sub)
    setShowDrawer(true)
  }

  // Status counts
  const pendingCount = submissions.filter((s) => s.status === "pending").length
  const approvedCount = submissions.filter((s) => s.status === "approved").length
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length

  return (
    <AppShell role="worker">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">My Submissions</h1>
          <p className="text-sm text-muted-foreground">View all your past submissions and their status.</p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs transition-all",
              statusFilter === "all" ? "bg-primary/10 text-primary border-primary/30" : "border-border/30 hover:border-border"
            )}
            onClick={() => setStatusFilter("all")}
          >
            All ({submissions.length})
          </Badge>
          <Badge
            variant="pending"
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs transition-all",
              statusFilter === "pending" ? "bg-warning/20 text-warning border-warning/50" : "hover:bg-warning/5"
            )}
            onClick={() => setStatusFilter("pending")}
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending ({pendingCount})
          </Badge>
          <Badge
            variant="approved"
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs transition-all",
              statusFilter === "approved" ? "bg-success/20 text-success border-success/50" : "hover:bg-success/5"
            )}
            onClick={() => setStatusFilter("approved")}
          >
            <Check className="mr-1 h-3 w-3" />
            Approved ({approvedCount})
          </Badge>
          <Badge
            variant="rejected"
            className={cn(
              "cursor-pointer px-3 py-1.5 text-xs transition-all",
              statusFilter === "rejected" ? "bg-destructive/20 text-destructive border-destructive/50" : "hover:bg-destructive/5"
            )}
            onClick={() => setStatusFilter("rejected")}
          >
            <X className="mr-1 h-3 w-3" />
            Rejected ({rejectedCount})
          </Badge>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submissions List */}
        {error ? (
          <DataErrorState
            title="Failed to load submissions"
            description="We couldn't load your submissions right now."
            error={error}
            onRetry={refetch}
          />
        ) : isLoading ? (
          <Card className="border-border/30 border-dashed">
            <CardContent className="space-y-3 p-4">
              <div className="h-4 w-2/5 rounded bg-muted animate-pulse" />
              <div className="h-20 rounded bg-muted animate-pulse" />
              <div className="h-20 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ) : filteredSubmissions.length === 0 ? (
          <Card className="border-border/30 border-dashed">
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">
                {submissions.length === 0 ? "No submissions yet. Go to the Feed to start earning." : "No submissions match your filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            ref={parentRef}
            className="overflow-auto scrollbar-hide rounded-lg border border-border/30"
            style={{ height: "calc(100svh - 320px)", minHeight: "300px" }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const sub = filteredSubmissions[virtualRow.index]
                if (!sub) return null
                const task = taskMap.get(sub.taskId)
                const statusMeta = STATUS_META[sub.status]
                const StatusIcon = statusMeta.icon
                const Icon = task ? TASK_ICONS[task.type] : FileText
                let reward = task?.reward ?? 0
                if (task?.phases && sub.phaseIndex) {
                  const phase = task.phases.find((p) => p.phaseIndex === sub.phaseIndex)
                  if (phase) reward = phase.reward
                }

                return (
                  <div
                    key={sub.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      padding: "2px 4px",
                    }}
                  >
                    <div
                      onClick={() => handleSelect(sub)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-all touch-feedback",
                        selectedSubmission?.id === sub.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/20 hover:border-border/40 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background flex items-center justify-center",
                            statusMeta.color
                          )}>
                            <StatusIcon className="h-2 w-2 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{task?.title ?? "Unknown Task"}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{sub.submittedAt.toLocaleDateString()}</span>
                            {sub.phaseIndex && (
                              <span className="flex items-center gap-0.5 text-info">
                                <Layers className="h-2.5 w-2.5" />
                                P{sub.phaseIndex}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-success">A${reward.toFixed(2)}</span>
                        <Badge
                          variant={sub.status}
                          className="text-[10px] px-1.5"
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </p>
      </div>

      {/* Submission Detail Drawer */}
      <Drawer open={showDrawer && !!selectedSubmission} onOpenChange={(open) => {
        setShowDrawer(open)
        if (!open) setSelectedSubmission(null)
      }}>
        <DrawerContent className="max-h-[85vh]">
          {selectedSubmission && (() => {
            const task = taskMap.get(selectedSubmission.taskId)
            const statusMeta = STATUS_META[selectedSubmission.status]
            return (
              <div className="overflow-y-auto p-4">
                <DrawerHeader className="p-0 pb-4">
                  <DrawerTitle className="text-base text-left">Submission Details</DrawerTitle>
                  <DrawerDescription className="text-xs text-left">
                    {task?.title ?? "Unknown Task"} &middot; {selectedSubmission.submittedAt.toLocaleString()}
                  </DrawerDescription>
                </DrawerHeader>

                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={selectedSubmission.status}>
                      {statusMeta.label}
                    </Badge>
                  </div>

                  {/* Phase info */}
                  {selectedSubmission.phaseIndex && task?.phases && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phase</span>
                      <span className="text-sm font-medium">
                        {task.phases.find((p) => p.phaseIndex === selectedSubmission.phaseIndex)?.phaseName ?? `Phase ${selectedSubmission.phaseIndex}`}
                      </span>
                    </div>
                  )}

                  {/* Evidence */}
                  {selectedSubmission.postUrl && (
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Submitted Post URL
                      </span>
                      <a
                        href={selectedSubmission.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline break-all rounded-lg border border-border/30 bg-background p-3"
                      >
                        {selectedSubmission.postUrl}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {selectedSubmission.emailContent && (
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Email Content
                      </span>
                      <div className="rounded-lg border border-border/30 bg-background p-3 text-sm whitespace-pre-wrap">
                        {selectedSubmission.emailContent}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.screenshotUrl && (
                    <EvidenceImage screenshotUrl={selectedSubmission.screenshotUrl} />
                  )}

                  {/* Admin Notes */}
                  {selectedSubmission.adminNotes && (
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Admin Notes</span>
                      <div className="rounded-lg border border-border/30 bg-muted/30 p-3 text-sm">
                        {selectedSubmission.adminNotes}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed: {selectedSubmission.reviewedAt.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )
          })()}
        </DrawerContent>
      </Drawer>
    </AppShell>
  )
}

export default function WorkerSubmissionsPage() {
  return (
    <Suspense fallback={
      <AppShell role="worker">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </AppShell>
    }>
      <ErrorBoundary>
        <WorkerSubmissionsContent />
      </ErrorBoundary>
    </Suspense>
  )
}
