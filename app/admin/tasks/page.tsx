"use client"

import { useState, useMemo, Suspense } from "react"
import Link from "next/link"
import { useQueryState, parseAsStringLiteral, parseAsString } from "nuqs"
import { AppShell } from "@/components/app-shell"
import { ErrorBoundary } from "@/components/error-boundary"
import { TasksTable } from "@/components/admin/tasks-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Share2, Mail, Heart, Plus, MoreHorizontal, Eye, Trash2,
  DollarSign, ListTodo, Clock, Users, Edit2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSubmissions, useTasks, useDeleteTask, useUpdateTaskStatus, useUpdateTask } from "@/hooks/use-store"
import { useToast } from "@/hooks/use-toast"
import type { Task, TaskType, TaskStatus } from "@/lib/types"
import { TASK_TYPE_META } from "@/lib/types"

const TASK_ICONS: Record<TaskType, typeof Share2> = {
  social_media_posting: Share2,
  email_sending: Mail,
  social_media_liking: Heart,
}

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
}

// URL state parsers for nuqs
const statusFilterParser = parseAsStringLiteral(["all", "open", "completed", "cancelled"] as const).withDefault("all")
const sortByParser = parseAsStringLiteral(["newest", "oldest", "reward", "submissions"] as const).withDefault("newest")

function TasksManagementContent() {
  const { tasks, isLoading } = useTasks()
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions()
  const { toast } = useToast()
  
  // Mutation hooks
  const deleteTaskMutation = useDeleteTask()
  const updateTaskStatusMutation = useUpdateTaskStatus()
  const updateTaskMutation = useUpdateTask()
  
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  
  // URL state management with nuqs
  const [statusFilter, setStatusFilter] = useQueryState("status", statusFilterParser)
  const [campaignFilter, setCampaignFilter] = useQueryState("campaign", parseAsString.withDefault("all"))
  const [sortBy, setSortBy] = useQueryState("sort", sortByParser)
  
  // Bulk edit dialog state (PRD requirement)
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false)
  const [bulkEditField, setBulkEditField] = useState<"amount" | "campaignId">("amount")
  const [bulkEditValue, setBulkEditValue] = useState("")
  const isDataLoading = isLoading || isLoadingSubmissions

  // Get unique campaigns for filter dropdown
  const uniqueCampaigns = useMemo(() => {
    const campaigns = tasks
      .map(t => t.campaignId)
      .filter((c): c is string => !!c)
    return [...new Set(campaigns)].sort()
  }, [tasks])

  // Filter and sort tasks (PRD: "Admin should be able to filter & sort")
  const filteredTasks = useMemo(() => {
    let result = tasks
    
    // Apply campaign filter
    if (campaignFilter !== "all") {
      if (campaignFilter === "none") {
        result = result.filter(t => !t.campaignId)
      } else {
        result = result.filter(t => t.campaignId === campaignFilter)
      }
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(t => t.status === statusFilter)
    }
    
    // Apply sorting
    switch (sortBy) {
      case "newest":
        result = [...result].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
      case "oldest":
        result = [...result].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        break
      case "reward":
        result = [...result].sort((a, b) => b.reward - a.reward)
        break
      case "submissions":
        result = [...result].sort((a, b) => b.currentSubmissions - a.currentSubmissions)
        break
    }
    
    return result
  }, [tasks, campaignFilter, statusFilter, sortBy])

  // Check if any mutation is in progress
  const isMutating = deleteTaskMutation.isPending || updateTaskStatusMutation.isPending || updateTaskMutation.isPending

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId)
      setSelectedTasks((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
      toast({ title: "Task deleted", description: "The task has been permanently removed." })
    } catch {
      toast({ title: "Delete failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ id: taskId, status: newStatus })
      toast({ title: "Status updated", description: `Task marked as ${newStatus}.` })
    } catch {
      toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    }
  }

  const handleBulkStatusChange = async (newStatus: TaskStatus) => {
    try {
      await Promise.all(Array.from(selectedTasks).map((taskId) => 
        updateTaskStatusMutation.mutateAsync({ id: taskId, status: newStatus })
      ))
      toast({ title: "Status updated", description: `${selectedTasks.size} tasks marked as ${newStatus}.` })
    } catch {
      toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedTasks).map((taskId) => deleteTaskMutation.mutateAsync(taskId)))
      const count = selectedTasks.size
      setSelectedTasks(new Set())
      toast({ title: "Tasks deleted", description: `${count} task${count > 1 ? "s" : ""} permanently removed.` })
    } catch {
      toast({ title: "Delete failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    }
  }

  // PRD requirement: Bulk edit amount and campaign ID
  const handleBulkEdit = async () => {
    if (!bulkEditValue.trim()) return
    try {
      const updates = bulkEditField === "amount"
        ? { maxSubmissions: parseInt(bulkEditValue, 10) }
        : { campaignId: bulkEditValue.trim() || undefined }
      
      await Promise.all(Array.from(selectedTasks).map((taskId) => 
        updateTaskMutation.mutateAsync({ id: taskId, updates })
      ))
      const count = selectedTasks.size
      toast({ 
        title: "Tasks updated", 
        description: `${count} task${count > 1 ? "s" : ""} ${bulkEditField === "amount" ? "amount" : "campaign ID"} updated.` 
      })
      setShowBulkEditDialog(false)
      setBulkEditValue("")
    } catch {
      toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    }
  }

  const openBulkEditDialog = (field: "amount" | "campaignId") => {
    setBulkEditField(field)
    setBulkEditValue("")
    setShowBulkEditDialog(true)
  }

  // Stats
  const totalTasks = filteredTasks.length
  const openTasks = filteredTasks.filter((t) => t.status === "open").length
  const totalRewards = filteredTasks.reduce((sum, t) => sum + t.reward * t.currentSubmissions, 0)
  const totalSubmissions = submissions.length

  return (
      <AppShell role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tasks Management</h1>
            <p className="text-sm text-muted-foreground">Manage all tasks and track submissions.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-row sm:items-center">
            {/* Status Filter (PRD requirement) */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | TaskStatus)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Campaign Filter */}
            <Select value={campaignFilter} onValueChange={(v) => setCampaignFilter(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="none">No Campaign</SelectItem>
                {uniqueCampaigns.map((campaign) => (
                  <SelectItem key={campaign} value={campaign}>
                    {campaign}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Sort (PRD requirement) */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="reward">Highest Reward</SelectItem>
                <SelectItem value="submissions">Most Submissions</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/admin/composer">
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards with Trend Indicators */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListTodo className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Clock className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{openTasks}</p>
                <p className="text-sm text-muted-foreground">Open Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                <Users className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">${totalRewards.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Paid Out</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTasks.size > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
              <span className="text-sm font-medium">
                {selectedTasks.size} task{selectedTasks.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("open")}>
                      Set to Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("completed")}>
                      Set to Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange("cancelled")}>
                      Set to Cancelled
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* PRD: Bulk edit amount and campaign ID */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" loading={isMutating}>
                      <Edit2 className="mr-1 h-3 w-3" />
                      Bulk Edit
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => openBulkEditDialog("amount")}>
                      Edit Amount
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openBulkEditDialog("campaignId")}>
                      Edit Campaign ID
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} loading={isMutating}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTasks(new Set())}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Table - Desktop (TanStack Table) */}
        <Card className="border-border/30 hidden md:block">
          <CardHeader>
            <CardTitle className="text-lg">All Tasks</CardTitle>
            <CardDescription>View and manage all created tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/5 rounded bg-muted animate-pulse" />
                <div className="h-20 rounded bg-muted animate-pulse" />
                <div className="h-20 rounded bg-muted animate-pulse" />
              </div>
            ) : (
              <TasksTable
                tasks={filteredTasks}
                submissions={submissions}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                selectedTasks={selectedTasks}
                onSelectionChange={setSelectedTasks}
              />
            )}
          </CardContent>
        </Card>

        {/* Tasks List - Mobile */}
        <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">
              {campaignFilter !== "all" ? `${campaignFilter} Tasks` : "All Tasks"} ({filteredTasks.length})
            </h2>
          </div>
          {isDataLoading ? (
            <Card className="border-border/30 border-dashed">
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-2/5 rounded bg-muted animate-pulse" />
                <div className="h-20 rounded bg-muted animate-pulse" />
                <div className="h-20 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ) : filteredTasks.map((task) => {
            const Icon = TASK_ICONS[task.type]
            const meta = TASK_TYPE_META[task.type]
            const progress = (task.currentSubmissions / task.maxSubmissions) * 100
            const taskSubmissions = submissions.filter((s) => s.taskId === task.id)
            const pendingCount = taskSubmissions.filter((s) => s.status === "pending").length

            return (
              <Card 
                key={task.id} 
                status={task.status}
                className={cn(
                  "border-border/30 touch-feedback",
                  selectedTasks.has(task.id) && "border-primary/50 bg-primary/5"
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => {
                        setSelectedTasks((prev) => {
                          const next = new Set(prev)
                          if (next.has(task.id)) {
                            next.delete(task.id)
                          } else {
                            next.add(task.id)
                          }
                          return next
                        })
                      }}
                      className="mt-1"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{task.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-border/30 text-xs">
                      {meta.label}
                    </Badge>
                    <Badge variant={task.status} className="text-xs">
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                    <span className="text-sm font-mono font-medium text-success">${task.reward.toFixed(2)}</span>
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/20">
                        {pendingCount} pending
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {task.currentSubmissions}/{task.maxSubmissions}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/admin/submissions?task=${task.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-9">
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Submissions
                      </Button>
                    </Link>
                    <Link href={`/admin/composer?edit=${task.id}`}>
                      <Button variant="outline" size="sm" className="h-9 px-3">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 px-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "open")}
                          className={task.status === "open" ? "bg-muted" : ""}>
                          Set to Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completed")}
                          className={task.status === "completed" ? "bg-muted" : ""}>
                          Set to Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "cancelled")}
                          className={task.status === "cancelled" ? "bg-muted" : ""}>
                          Set to Cancelled
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Bulk Edit Dialog (PRD requirement) */}
      <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Bulk Edit {bulkEditField === "amount" ? "Amount" : "Campaign ID"}
            </DialogTitle>
            <DialogDescription>
              Update {selectedTasks.size} selected task{selectedTasks.size > 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {bulkEditField === "amount" ? (
              <div className="space-y-2">
                <Label htmlFor="bulkAmount">Amount</Label>
                <Input
                  id="bulkAmount"
                  type="number"
                  min={1}
                  max={10000}
                  placeholder="e.g. 100"
                  value={bulkEditValue}
                  onChange={(e) => setBulkEditValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will update the maximum number of submissions for all selected tasks.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="bulkCampaignId">Campaign ID</Label>
                <Input
                  id="bulkCampaignId"
                  placeholder="e.g. spring-launch"
                  value={bulkEditValue}
                  onChange={(e) => setBulkEditValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Group tasks together by assigning them to the same campaign.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkEdit} 
              disabled={!bulkEditValue.trim() || isMutating}
            >
              {isMutating ? "Updating..." : `Update ${selectedTasks.size} Task${selectedTasks.size > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export default function TasksManagementPage() {
  return (
    <Suspense fallback={
      <AppShell role="admin">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </AppShell>
    }>
      <ErrorBoundary>
        <TasksManagementContent />
      </ErrorBoundary>
    </Suspense>
  )
}
