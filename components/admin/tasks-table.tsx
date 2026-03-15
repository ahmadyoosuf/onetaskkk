"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
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
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit2, Eye, Heart, Mail, MoreHorizontal, Share2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus, TaskType, Submission } from "@/lib/types"
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

type TasksTableProps = {
  tasks: Task[]
  submissions: Submission[]
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onDelete: (taskId: string) => void
  selectedTasks: Set<string>
  onSelectionChange: (selectedTasks: Set<string>) => void
}

const PAGE_SIZE = 10

export function TasksTable({
  tasks,
  submissions,
  onStatusChange,
  onDelete,
  selectedTasks,
  onSelectionChange,
}: TasksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })

  // Convert Set to RowSelectionState
  const rowSelection = useMemo(() => {
    const selection: RowSelectionState = {}
    tasks.forEach((task, index) => {
      if (selectedTasks.has(task.id)) {
        selection[index] = true
      }
    })
    return selection
  }, [selectedTasks, tasks])

  // Convert RowSelectionState back to Set
  const handleRowSelectionChange = (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
    const newSelection = typeof updater === "function" ? updater(rowSelection) : updater
    const newSet = new Set<string>()
    Object.entries(newSelection).forEach(([index, isSelected]) => {
      if (isSelected && tasks[Number(index)]) {
        newSet.add(tasks[Number(index)].id)
      }
    })
    onSelectionChange(newSet)
  }

  const columns: ColumnDef<Task>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.title}`}
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Task
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const task = row.original
          const Icon = TASK_ICONS[task.type]
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const meta = TASK_TYPE_META[row.original.type]
          return (
            <Badge variant="outline" className="border-border/30">
              {meta.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "campaignId",
        header: "Campaign",
        cell: ({ row }) => {
          const campaignId = row.original.campaignId
          return campaignId ? (
            <Badge variant="secondary" className="text-xs">
              {campaignId}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const task = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge variant={task.status} className="cursor-pointer hover:opacity-80 transition-opacity">
                  {TASK_STATUS_LABELS[task.status]}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, "open")}
                  className={task.status === "open" ? "bg-muted" : ""}
                >
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, "completed")}
                  className={task.status === "completed" ? "bg-muted" : ""}
                >
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onStatusChange(task.id, "cancelled")}
                  className={task.status === "cancelled" ? "bg-muted" : ""}
                >
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
      {
        accessorKey: "reward",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Reward
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono">A${row.original.reward.toFixed(2)}</span>
        ),
      },
      {
        id: "progress",
        header: "Progress",
        cell: ({ row }) => {
          const task = row.original
          const progress = (task.currentSubmissions / task.maxSubmissions) * 100
          const taskSubmissions = submissions.filter((s) => s.taskId === task.id)
          const pendingCount = taskSubmissions.filter((s) => s.status === "pending").length

          return (
            <div className="flex items-center gap-2">
              <Progress value={progress} className="w-20 h-2" />
              <Link href={`/admin/submissions?task=${task.id}`} className="text-xs text-muted-foreground whitespace-nowrap hover:text-foreground transition-colors hover:underline">
                {task.currentSubmissions}/{task.maxSubmissions}
              </Link>
              {pendingCount > 0 && (
                <Link href={`/admin/submissions?task=${task.id}&status=pending`}>
                  <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors">
                    {pendingCount} pending
                  </Badge>
                </Link>
              )}
            </div>
          )
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const task = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/composer?edit=${task.id}`}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Task
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/submissions?task=${task.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Submissions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        size: 40,
      },
    ],
    [submissions, onStatusChange, onDelete]
  )

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: handleRowSelectionChange,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(header.id === "select" && "w-10", header.id === "actions" && "w-10")}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className={row.getIsSelected() ? "bg-primary/5" : ""}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No tasks found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Pagination Controls */}
      {tasks.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, tasks.length)} of {tasks.length} tasks
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm">
              Page {pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
