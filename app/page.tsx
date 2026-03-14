"use client"

import { useMemo, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useToast } from "@/hooks/use-toast"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Mail, Heart, DollarSign, Users, ExternalLink, Send, Filter, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { createSubmission, getCurrentUser } from "@/lib/store"
import { useTasks } from "@/hooks/use-store"
import { submissionSchema, type SubmissionFormData } from "@/lib/schemas"
import type { Task, TaskType } from "@/lib/types"
import { TASK_TYPE_META } from "@/lib/types"

const TASK_ICONS: Record<TaskType, typeof FileText> = {
  form_submission: FileText,
  email_sending: Mail,
  social_media_liking: Heart,
}

export default function TasksFeedPage() {
  const { toast } = useToast()
  const tasks = useTasks()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all")
  const [sortBy, setSortBy] = useState<"newest" | "reward">("newest")
  const parentRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    mode: "onChange",
  })

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

  const virtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  const onSubmit = (data: SubmissionFormData) => {
    if (!selectedTask) return
    const user = getCurrentUser()
    createSubmission({
      taskId: selectedTask.id,
      userId: user.id,
      userName: user.name,
      proof: data.proof,
      liveAppUrl: data.liveAppUrl || undefined,
    })
    toast({
      title: "Submission received",
      description: `Your work on "${selectedTask.title}" has been submitted for review.`,
    })
    setShowSubmitDialog(false)
    reset()
    setSelectedTask(null)
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Task List */}
        <div className="flex-1 space-y-4">
          {/* Header & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Available Tasks</h1>
              <p className="text-sm text-muted-foreground">
                {filteredTasks.length} task{filteredTasks.length !== 1 && "s"} available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TaskType | "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4 shrink-0" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="form_submission">Form Submission</SelectItem>
                  <SelectItem value="email_sending">Email Sending</SelectItem>
                  <SelectItem value="social_media_liking">Social Media</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "reward")}>
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

          {/* Virtualized Task Feed */}
          {filteredTasks.length === 0 ? (
            <Card className="border-border/30 border-dashed">
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No tasks match your filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div
              ref={parentRef}
              className="h-[50vh] sm:h-[calc(100vh-220px)] overflow-auto"
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

                  return (
                    <div
                      key={task.id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="pr-2 sm:pr-4 pb-2"
                    >
                      <Card
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          "cursor-pointer border-border/30 transition-all hover:border-primary/30 h-full",
                          isSelected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        )}
                      >
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
                                  <h3 className="font-medium text-sm sm:text-base leading-tight truncate">{task.title}</h3>
                                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="shrink-0 bg-success/10 text-success border-success/20 text-xs">
                                  ${task.reward.toFixed(2)}
                                </Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {spotsLeft} left
                                </span>
                                <Badge variant="outline" className="border-border/30 text-xs px-1.5 py-0">
                                  {meta.label}
                                </Badge>
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

        {/* Task Detail Panel */}
        <div className="w-full lg:w-80 xl:w-96">
          {selectedTask ? (
            <Card className="border-border/30 lg:sticky lg:top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    {(() => {
                      const Icon = TASK_ICONS[selectedTask.type]
                      return <Icon className="h-5 w-5" />
                    })()}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{selectedTask.title}</CardTitle>
                    <CardDescription className="text-xs">{TASK_TYPE_META[selectedTask.type].label}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                
                {/* Task Details */}
                <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                  {selectedTask.type === "form_submission" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Target URL</span>
                        <a 
                          href={selectedTask.details.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {selectedTask.details.formFields.length > 0 && (
                        <div>
                          <span className="text-muted-foreground text-xs">Required Fields:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedTask.details.formFields.map((field) => (
                              <Badge key={field} variant="outline" className="text-xs px-1.5 py-0">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {selectedTask.type === "email_sending" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Send to</span>
                        <span className="font-mono text-xs">{selectedTask.details.targetEmail}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Email Content:</span>
                        <p className="mt-1 text-xs bg-background p-2 rounded border border-border/30">
                          {selectedTask.details.emailContent}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedTask.type === "social_media_liking" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Platform</span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {selectedTask.details.platform}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Post</span>
                        <a 
                          href={selectedTask.details.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          View Post <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/30 p-2.5 text-center">
                    <DollarSign className="mx-auto h-4 w-4 text-success" />
                    <p className="mt-0.5 text-base font-semibold">${selectedTask.reward.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Reward</p>
                  </div>
                  <div className="rounded-lg border border-border/30 p-2.5 text-center">
                    <Users className="mx-auto h-4 w-4 text-primary" />
                    <p className="mt-0.5 text-base font-semibold">
                      {selectedTask.maxSubmissions - selectedTask.currentSubmissions}
                    </p>
                    <p className="text-xs text-muted-foreground">Spots Left</p>
                  </div>
                </div>

                {selectedTask.deadline && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Deadline: {selectedTask.deadline.toLocaleDateString()}
                  </div>
                )}

                <Button className="w-full" size="sm" onClick={() => setShowSubmitDialog(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Work
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/30 border-dashed">
              <CardContent className="flex h-48 lg:h-64 flex-col items-center justify-center text-center p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
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

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Work</DialogTitle>
            <DialogDescription>
              Provide proof of completion for "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proof" className={errors.proof ? "text-destructive" : ""}>
                Proof of Completion *
              </Label>
              <Textarea
                id="proof"
                placeholder="Describe how you completed the task..."
                rows={4}
                {...register("proof")}
                className={errors.proof ? "border-destructive" : ""}
              />
              {errors.proof && (
                <p className="text-sm text-destructive">{errors.proof.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveAppUrl">Live URL (optional)</Label>
              <Input
                id="liveAppUrl"
                type="url"
                placeholder="https://..."
                {...register("liveAppUrl")}
              />
              {errors.liveAppUrl && (
                <p className="text-sm text-destructive">{errors.liveAppUrl.message}</p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid}>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
