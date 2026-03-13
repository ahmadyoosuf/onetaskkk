"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { FileText, Mail, Heart, DollarSign, Users, Clock, ExternalLink, Send, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTasks, createSubmission, getCurrentUser } from "@/lib/store"
import type { Task, TaskType } from "@/lib/types"
import { TASK_TYPE_META } from "@/lib/types"

const TASK_ICONS: Record<TaskType, typeof FileText> = {
  form_submission: FileText,
  email_sending: Mail,
  social_media_liking: Heart,
}

export default function TasksFeedPage() {
  const [tasks] = useState(() => getTasks())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all")
  const [sortBy, setSortBy] = useState<"newest" | "reward">("newest")
  const [proof, setProof] = useState("")
  const [liveAppUrl, setLiveAppUrl] = useState("")

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

  const handleSubmit = () => {
    if (!selectedTask || !proof) return
    
    const user = getCurrentUser()
    createSubmission({
      taskId: selectedTask.id,
      userId: user.id,
      userName: user.name,
      proof,
      liveAppUrl: liveAppUrl || undefined,
    })
    
    setShowSubmitDialog(false)
    setProof("")
    setLiveAppUrl("")
    setSelectedTask(null)
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Task List */}
        <div className="flex-1 space-y-4">
          {/* Header & Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Available Tasks</h1>
              <p className="text-muted-foreground">
                {filteredTasks.length} tasks available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TaskType | "all")}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
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
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="reward">Highest Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scrollable Task Feed */}
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-3 pr-4">
              {filteredTasks.map((task, index) => {
                const Icon = TASK_ICONS[task.type]
                const meta = TASK_TYPE_META[task.type]
                const isSelected = selectedTask?.id === task.id
                const spotsLeft = task.maxSubmissions - task.currentSubmissions
                
                return (
                  <Card
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      "cursor-pointer border-border/30 transition-all animate-fade-in-up hover:border-primary/30",
                      isSelected && "border-primary/50 bg-primary/5"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium leading-none">{task.title}</h3>
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            </div>
                            <Badge variant="secondary" className="shrink-0 bg-success/10 text-success border-success/20">
                              ${task.reward.toFixed(2)}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {spotsLeft} spots left
                            </span>
                            <Badge variant="outline" className="border-border/30 text-xs">
                              {meta.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Task Detail Panel */}
        <div className="w-full lg:w-96">
          {selectedTask ? (
            <Card className="sticky top-24 border-border/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {(() => {
                      const Icon = TASK_ICONS[selectedTask.type]
                      return <Icon className="h-5 w-5" />
                    })()}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedTask.title}</CardTitle>
                    <CardDescription>{TASK_TYPE_META[selectedTask.type].label}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                
                {/* Task Details */}
                <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                  {selectedTask.type === "form_submission" && selectedTask.details.targetUrl && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Target URL</span>
                        <a 
                          href={selectedTask.details.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {selectedTask.details.formFields && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Required Fields:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedTask.details.formFields.map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
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
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Send to</span>
                        <span className="font-mono text-xs">{selectedTask.details.targetEmail}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Email Content:</span>
                        <p className="mt-1 text-xs bg-background p-2 rounded border border-border/30">
                          {selectedTask.details.emailContent}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedTask.type === "social_media_liking" && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Platform</span>
                        <Badge variant="outline" className="capitalize">
                          {selectedTask.details.platform}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Post</span>
                        <a 
                          href={selectedTask.details.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          View Post <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/30 p-3 text-center">
                    <DollarSign className="mx-auto h-5 w-5 text-success" />
                    <p className="mt-1 text-lg font-semibold">${selectedTask.reward.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Reward</p>
                  </div>
                  <div className="rounded-lg border border-border/30 p-3 text-center">
                    <Users className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-lg font-semibold">
                      {selectedTask.maxSubmissions - selectedTask.currentSubmissions}
                    </p>
                    <p className="text-xs text-muted-foreground">Spots Left</p>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setShowSubmitDialog(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/30 border-dashed">
              <CardContent className="flex h-64 flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 font-medium">No task selected</p>
                <p className="text-sm text-muted-foreground">
                  Click on a task to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Task</DialogTitle>
            <DialogDescription>
              Provide proof of completion for "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proof">Proof of Completion *</Label>
              <Textarea
                id="proof"
                placeholder="Describe how you completed the task or paste a screenshot URL..."
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveAppUrl">Live App URL (optional)</Label>
              <Input
                id="liveAppUrl"
                type="url"
                placeholder="https://..."
                value={liveAppUrl}
                onChange={(e) => setLiveAppUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!proof}>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
