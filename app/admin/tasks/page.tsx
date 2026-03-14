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
  FileText, Mail, Heart, Plus, MoreHorizontal, Eye, Trash2,
  DollarSign, ListTodo, Clock, Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSubmissions, deleteTask, updateTaskStatus } from "@/lib/store"
import { useTasks } from "@/hooks/use-store"
import type { Task, TaskType, TaskStatus } from "@/lib/types"
import { TASK_TYPE_META } from "@/lib/types"

const TASK_ICONS: Record<TaskType, typeof FileText> = {
  form_submission: FileText,
  email_sending: Mail,
  social_media_liking: Heart,
}

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-success/10 text-success border-success/20" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-border/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

export default function TasksManagementPage() {
  const tasks = useTasks()
  const allSubmissions = getSubmissions()
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const handleDelete = (taskId: string) => {
    deleteTask(taskId)
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTaskStatus(taskId, newStatus)
  }

  const handleBulkStatusChange = (newStatus: TaskStatus) => {
    selectedTasks.forEach((taskId) => updateTaskStatus(taskId, newStatus))
  }

  const handleBulkDelete = () => {
    selectedTasks.forEach((taskId) => deleteTask(taskId))
    setSelectedTasks(new Set())
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

  // Stats
  const totalTasks = tasks.length
  const openTasks = tasks.filter((t) => t.status === "open").length
  const totalRewards = tasks.reduce((sum, t) => sum + t.reward * t.currentSubmissions, 0)
  const totalSubmissions = allSubmissions.length

  return (
    <AppShell>
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

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/30">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListTodo className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{openTasks}</p>
                <p className="text-sm text-muted-foreground">Open Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
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
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
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
                  const taskSubmissions = allSubmissions.filter((s) => s.taskId === task.id)
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
          </CardContent>
        </Card>

        {/* Tasks List - Mobile */}
        <div className="space-y-3 md:hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">All Tasks ({tasks.length})</h2>
          </div>
          {tasks.map((task) => {
            const Icon = TASK_ICONS[task.type]
            const meta = TASK_TYPE_META[task.type]
            const statusStyle = STATUS_STYLES[task.status]
            const progress = (task.currentSubmissions / task.maxSubmissions) * 100
            const taskSubmissions = allSubmissions.filter((s) => s.taskId === task.id)
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
