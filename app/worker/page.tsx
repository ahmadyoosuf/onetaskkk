"use client"

import { useMemo, useState, useRef, useEffect, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useQueryState, parseAsStringLiteral } from "nuqs"
import { useToast } from "@/hooks/use-toast"
import { AppShell } from "@/components/app-shell"
import { ErrorBoundary, DataErrorState } from "@/components/error-boundary"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { TaskDetail } from "@/components/tasks/task-detail"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Share2, Mail, Heart, Users, Filter, Flame, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/lib/store"
import { useSubmissions, useTasks, useCreateSubmission } from "@/hooks/use-store"
import { socialMediaSubmissionSchema, emailSubmissionSchema, type SubmissionFormData } from "@/lib/schemas"
import type { Task, TaskType } from "@/lib/types"
import { TASK_TYPE_META } from "@/lib/types"

const TASK_ICONS: Record<TaskType, typeof Share2> = {
  social_media_posting: Share2,
  email_sending: Mail,
  social_media_liking: Heart,
}

// URL state parsers for nuqs
const typeFilterParser = parseAsStringLiteral(["all", "social_media_posting", "email_sending", "social_media_liking"] as const).withDefault("all")
const sortByParser = parseAsStringLiteral(["newest", "reward"] as const).withDefault("newest")

function TasksFeedContent() {
  const { toast } = useToast()
  const { tasks, isLoading, error, refetch } = useTasks()
  const { submissions } = useSubmissions()
  const createSubmissionMutation = useCreateSubmission()
  const currentUser = getCurrentUser()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)
  
  // URL state management with nuqs
  const [typeFilter, setTypeFilter] = useQueryState("type", typeFilterParser)
  const [sortBy, setSortBy] = useQueryState("sort", sortByParser)
  
  const parentRef = useRef<HTMLDivElement>(null)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task)
    if (window.innerWidth < 1024) {
      setShowMobileDrawer(true)
    }
  }

  // Dynamic schema based on selected task type (PRD requirement)
  const isEmailTask = selectedTask?.type === "email_sending"
  const currentSchema = isEmailTask ? emailSubmissionSchema : socialMediaSubmissionSchema

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isValid } } = useForm<SubmissionFormData>({
    resolver: zodResolver(currentSchema),
    mode: "onChange",
  })

  // Reset form when task selection changes to ensure validation matches the new schema
  useEffect(() => {
    reset()
  }, [selectedTask?.id, reset])

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => t.status === "open")
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter)
    }
    if (sortBy === "reward") {
      result = [...result].sort((a, b) => b.reward - a.reward)
    }
    return result
  }, [tasks, typeFilter, sortBy])

  const hasSubmittedSelectedTask = useMemo(() => {
    if (!selectedTask) return false
    return submissions.some(
      (submission) => submission.taskId === selectedTask.id && submission.userId === currentUser.id
    )
  }, [currentUser.id, selectedTask, submissions])

  const isSubmitLocked = !!selectedTask && !selectedTask.allowMultipleSubmissions && hasSubmittedSelectedTask

  const virtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 10,
  })

  const onSubmit = async (data: SubmissionFormData) => {
    if (!selectedTask) return
    try {
      // Build PRD-compliant submission based on task type
      const submissionData = {
        taskId: selectedTask.id,
        taskType: selectedTask.type,
        userId: currentUser.id,
        userName: currentUser.name,
        screenshotUrl: data.screenshotUrl,
        postUrl: "postUrl" in data ? data.postUrl : undefined,
        emailContent: "emailContent" in data ? data.emailContent : undefined,
      }
      
      await createSubmissionMutation.mutateAsync(submissionData)
      toast({
        title: "Submission received",
        description: `Your work on "${selectedTask.title}" has been submitted for review.`,
      })
      setShowSubmitDialog(false)
      reset()
      setSelectedTask(null)
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <AppShell role="worker">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Task List */}
        <div className="flex-1 space-y-4">
          {/* Header & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Available Tasks</h1>
              <p className="text-sm text-muted-foreground">
                {hasMounted ? `${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""} available` : "\u00A0"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4 shrink-0" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="social_media_posting">Social Media Posting</SelectItem>
                  <SelectItem value="email_sending">Email Sending</SelectItem>
                <SelectItem value="social_media_liking">Social Media Liking</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-28 sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Date</SelectItem>
                  <SelectItem value="reward">Highest Reward</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Feed */}
          {error ? (
            <DataErrorState
              title="Failed to load tasks"
              description="We couldn't load available tasks right now."
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
          ) : filteredTasks.length === 0 ? (
            <Card className="border-border/30 border-dashed">
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No tasks match your filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div
              ref={parentRef}
              className="overflow-auto scrollbar-hide"
              style={{ height: "calc(100svh - 200px)" }}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const task = filteredTasks[virtualRow.index]
                  const Icon = TASK_ICONS[task.type]
                  const meta = TASK_TYPE_META[task.type]
                  const isSelected = selectedTask?.id === task.id
                  const spotsLeft = task.maxSubmissions - task.currentSubmissions
                  const isHot = spotsLeft <= 5 && spotsLeft > 0
                  const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0
                  const progressPercent = (task.currentSubmissions / task.maxSubmissions) * 100

                  return (
                    <div
                      key={task.id}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                        paddingBottom: "8px",
                      }}
                    >
                      <Card
                        onClick={() => handleTaskSelect(task)}
                        className={cn(
                          "cursor-pointer border-border/30 transition-all hover:border-primary/30 touch-feedback overflow-hidden",
                          isSelected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
                          isAlmostFull && !isSelected && "border-warning/30"
                        )}
                      >
                        {/* Progress bar at top of card */}
                        <div className="h-1 w-full bg-muted">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              progressPercent >= 80 ? "bg-warning" : "bg-primary/40"
                            )}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                            )}>
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-sm sm:text-base leading-tight truncate">{task.title}</h3>
                                    {isHot && (
                                      <span className={cn(
                                        "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0",
                                        isAlmostFull ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                                      )}>
                                        <Flame className="h-2.5 w-2.5" />
                                        {isAlmostFull ? "Almost full" : "Hot"}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-base sm:text-lg font-semibold text-success">${task.reward.toFixed(2)}</p>
                                  <p className="text-[10px] text-muted-foreground">per task</p>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className={cn(
                                  "flex items-center gap-1 rounded-full px-2 py-0.5",
                                  isAlmostFull ? "bg-destructive/10 text-destructive" : 
                                  isHot ? "bg-warning/10 text-warning" : "bg-muted"
                                )}>
                                  <Users className="h-3 w-3" />
                                  {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                                </span>
                                <Badge variant="outline" className="border-border/30 text-xs px-1.5 py-0">
                                  {meta.label}
                                </Badge>
                                {task.deadline && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {task.deadline.toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Task Detail Panel - Hidden on mobile (use bottom drawer), visible on desktop */}
        <div className="hidden lg:block lg:w-80 xl:w-96">
          {selectedTask ? (
            <Card className="border-border/30 sticky top-20">
              <CardContent className="p-4">
                <TaskDetail
                  task={selectedTask}
                  isSubmitLocked={isSubmitLocked}
                  onSubmit={() => setShowSubmitDialog(true)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/30 border-dashed">
              <CardContent className="flex h-48 lg:h-64 flex-col items-center justify-center text-center p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Share2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 font-medium text-sm">No task selected</p>
                <p className="text-xs text-muted-foreground">
                  Click on a task to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Task Detail Drawer */}
      <Drawer open={showMobileDrawer && !!selectedTask} onOpenChange={(open) => {
        setShowMobileDrawer(open)
        // Only clear selectedTask if the submit dialog is not open — otherwise
        // the dialog loses its task reference before it can render
        if (!open && !showSubmitDialog) setSelectedTask(null)
      }}>
        <DrawerContent className="max-h-[85vh]">
          {selectedTask && (
            <div className="overflow-y-auto p-4">
              <DrawerHeader className="p-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    {(() => {
                      const Icon = TASK_ICONS[selectedTask.type]
                      return <Icon className="h-5 w-5" />
                    })()}
                  </div>
                  <div className="min-w-0">
                    <DrawerTitle className="text-base text-left">{selectedTask.title}</DrawerTitle>
                    <DrawerDescription className="text-xs text-left">{TASK_TYPE_META[selectedTask.type].label}</DrawerDescription>
                  </div>
                </div>
              </DrawerHeader>
              <TaskDetail
                task={selectedTask}
                isSubmitLocked={isSubmitLocked}
                onSubmit={() => {
                  setShowMobileDrawer(false)
                  setShowSubmitDialog(true)
                }}
              />
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Submit Work Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={(open) => {
        setShowSubmitDialog(open)
        if (!open) {
          reset()
          setSelectedTask(null)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Work</DialogTitle>
            <DialogDescription>
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* Task-type-specific fields per PRD */}
            {isEmailTask ? (
              // Email Sending: Email Content + Screenshot
              <div className="space-y-2">
                <Label htmlFor="emailContent">
                  Email Content <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="emailContent"
                  placeholder="Paste the full email you sent to the recipient..."
                  className="min-h-32 resize-none"
                  {...register("emailContent")}
                />
                {errors.emailContent && (
                  <p className="text-xs text-destructive">{String(errors.emailContent.message ?? "")}</p>
                )}
              </div>
            ) : (
              // Social Media Posting/Liking: Post URL + Screenshot
              <div className="space-y-2">
                <Label htmlFor="postUrl">
                  Post URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="postUrl"
                  type="url"
                  placeholder="https://linkedin.com/posts/... or https://twitter.com/..."
                  {...register("postUrl")}
                />
                {errors.postUrl && (
                  <p className="text-xs text-destructive">{String(errors.postUrl.message ?? "")}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedTask?.type === "social_media_posting" 
                    ? "Paste the URL of your published post" 
                    : "Paste the URL of the post you liked"}
                </p>
              </div>
            )}

            {/* Screenshot upload - required for all task types */}
            <ImageUpload
              label="Evidence Screenshot"
              required
              value={watch("screenshotUrl")}
              onChange={(url) => setValue("screenshotUrl", url ?? "", { shouldValidate: true })}
              error={errors.screenshotUrl?.message ? String(errors.screenshotUrl.message) : undefined}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid} loading={createSubmissionMutation.isPending}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export default function TasksFeedPage() {
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
        <TasksFeedContent />
      </ErrorBoundary>
    </Suspense>
  )
}
