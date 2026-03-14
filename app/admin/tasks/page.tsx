"use client"

import { useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Share2, Mail, Heart, Plus, MoreHorizontal, Eye, Trash2,
  DollarSign, ListTodo, Clock, Users, TrendingUp, TrendingDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { deleteTask, updateTaskStatus } from "@/lib/store"
import { useSubmissions, useTasks } from "@/hooks/use-store"
import { useToast } from "@/hooks/use-toast"
import type { Task, TaskType, TaskStatus } from "@/lib/types"
import { TASK_TYPE_META } from "@/lib/types"

const TASK_ICONS: Record<TaskType, typeof Share2> = {
  social_media_posting: Share2,
  email_sending: Mail,
  social_media_liking: Heart,
}

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-success/10 text-success border-success/20" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-border/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

export default function TasksManagementPage() {
  const { tasks, isLoading } = useTasks()
  const { submissions, isLoading: isLoadingSubmissions } = useSubmissions()
  const { toast } = useToast()
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isMutating, setIsMutating] = useState(false)
  const isDataLoading = isLoading || isLoadingSubmissions

  const handleDelete = async (taskId: string) => {
    setIsMutating(true)
    try {
      await deleteTask(taskId)
      setSelectedTasks((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
      toast({ title: "Task deleted", description: "The task has been permanently removed." })
    } catch {
      toast({ title: "Delete failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    } finally {
      setIsMutating(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setIsMutating(true)
    try {
      await updateTaskStatus(taskId, newStatus)
      toast({ title: "Status updated", description: `Task marked as ${newStatus}.` })
    } catch {
      toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    } finally {
      setIsMutating(false)
    }
  }

  const handleBulkStatusChange = async (newStatus: TaskStatus) => {
    setIsMutating(true)
    try {
      await Promise.all(Array.from(selectedTasks).map((taskId) => updateTaskStatus(taskId, newStatus)))
      toast({ title: "Status updated", description: `${selectedTasks.size} tasks marked as ${newStatus}.` })
    } catch {
      toast({ title: "Update failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    } finally {
      setIsMutating(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsMutating(true)
    try {
      await Promise.all(Array.from(selectedTasks).map((taskId) => deleteTask(taskId)))
      const count = selectedTasks.size
      setSelectedTasks(new Set())
      toast({ title: "Tasks deleted", description: `${count} task${count > 1 ? "s" : ""} permanently removed.` })
    } catch {
      toast({ title: "Delete failed", description: "Something went wrong. Please try again.", variant: "destructive" })
    } finally {
      setIsMutating(false)
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const toggleAllSelection = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)))
    }
  }

  // Stats with mock trend data (simulating week-over-week changes)
  const totalTasks = tasks.length
  const openTasks = tasks.filter((t) => t.status === "open").length
  const totalRewards = tasks.reduce((sum, t) => sum + t.reward * t.currentSubmissions, 0)
  const totalSubmissions = submissions.length
  
  // Mock trend percentages (in a real app, these would be calculated from historical data)
  const tasksTrend = totalTasks > 0 ? Math.round((totalTasks / (totalTasks + 3)) * 100 - 85) : 0
  const openTasksTrend = openTasks > 0 ? Math.round((openTasks / totalTasks) * 100 - 60) : 0
  const submissionsTrend = totalSubmissions > 0 ? Math.round((totalSubmissions / (totalSubmissions + 8)) * 100 - 70) : 0
  const rewardsTrend = totalRewards > 0 ? 12.5 : 0 // Mock positive trend

  return (
      <AppShell role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tasks Management</h1>
            <p className="text-sm text-muted-foreground">Manage all tasks and track submissions.</p>
          </div>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/admin/composer">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>

        {/* Stats Cards with Trend Indicators */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListTodo className="h-5 w-5" />
                </div>
                {tasksTrend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    tasksTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {tasksTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(tasksTrend)}%
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Clock className="h-5 w-5" />
                </div>
                {openTasksTrend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    openTasksTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {openTasksTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(openTasksTrend)}%
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{openTasks}</p>
                <p className="text-sm text-muted-foreground">Open Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                  <Users className="h-5 w-5" />
                </div>
                {submissionsTrend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    submissionsTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {submissionsTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(submissionsTrend)}%
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <DollarSign className="h-5 w-5" />
                </div>
                {rewardsTrend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    rewardsTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {rewardsTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(rewardsTrend)}%
                  </div>
                )}
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
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isMutating}>
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

        {/* Tasks Table - Desktop */}
        <Card className="border-border/30 hidden md:block">
          <CardHeader>
            <CardTitle className="text-lg">All Tasks</CardTitle>
            <CardDescription>View and manage all created tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground animate-pulse">Loading tasks...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedTasks.size === tasks.length && tasks.length > 0}
                        onCheckedChange={toggleAllSelection}
                        aria-label="Select all tasks"
                      />
                    </TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Reward</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const Icon = TASK_ICONS[task.type]
                    const meta = TASK_TYPE_META[task.type]
                    const statusStyle = STATUS_STYLES[task.status]
                    const progress = (task.currentSubmissions / task.maxSubmissions) * 100
                    const taskSubmissions = submissions.filter((s) => s.taskId === task.id)
                    const pendingCount = taskSubmissions.filter((s) => s.status === "pending").length

                    return (
                      <TableRow key={task.id} className={selectedTasks.has(task.id) ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTasks.has(task.id)}
                            onCheckedChange={() => toggleTaskSelection(task.id)}
                            aria-label={`Select ${task.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border/30">
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={cn(statusStyle.className, "cursor-pointer hover:opacity-80 transition-opacity")}
                              >
                                {statusStyle.label}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(task.id, "open")}
                                className={task.status === "open" ? "bg-muted" : ""}
                              >
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(task.id, "completed")}
                                className={task.status === "completed" ? "bg-muted" : ""}
                              >
                                Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(task.id, "cancelled")}
                                className={task.status === "cancelled" ? "bg-muted" : ""}
                              >
                                Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${task.reward.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="w-20 h-2" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {task.currentSubmissions}/{task.maxSubmissions}
                            </span>
                            {pendingCount > 0 && (
                              <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/20">
                                {pendingCount} pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/submissions?task=${task.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Submissions
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(task.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Tasks List - Mobile */}
        <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">All Tasks ({tasks.length})</h2>
          </div>
          {isDataLoading ? (
            <Card className="border-border/30 border-dashed">
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground animate-pulse">Loading tasks...</p>
              </CardContent>
            </Card>
          ) : tasks.map((task) => {
            const Icon = TASK_ICONS[task.type]
            const meta = TASK_TYPE_META[task.type]
            const statusStyle = STATUS_STYLES[task.status]
            const progress = (task.currentSubmissions / task.maxSubmissions) * 100
            const taskSubmissions = submissions.filter((s) => s.taskId === task.id)
            const pendingCount = taskSubmissions.filter((s) => s.status === "pending").length

            return (
              <Card 
                key={task.id} 
                className={cn(
                  "border-border/30 touch-feedback",
                  selectedTasks.has(task.id) && "border-primary/50 bg-primary/5"
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
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
                    <Badge variant="outline" className={cn(statusStyle.className, "text-xs")}>
                      {statusStyle.label}
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
                    <Button variant="outline" size="sm" asChild className="flex-1 h-9">
                      <Link href={`/admin/submissions?task=${task.id}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Submissions
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 px-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, "open")}>
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completed")}>
                              Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, "cancelled")}>
                              Cancelled
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
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
    </AppShell>
  )
}
