"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/store"
import type { Task, Submission, TaskStatus } from "@/lib/types"

/**
 * TanStack Query-powered hooks with PRD-mandated 1-3s simulated fetch delays.
 * 
 * Architecture:
 * - TanStack Query is the single source of truth for async state
 * - No useSyncExternalStore or pub/sub - Query handles caching & revalidation
 * - isLoading reflects actual async fetch state (respects simulated delays)
 * - Mutations invalidate queries, triggering re-fetch with delays
 */

export function useTasks(): { 
  tasks: Task[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: api.tasks.list,
    staleTime: 30_000, // Consider data fresh for 30s
    gcTime: 5 * 60_000, // Keep in cache for 5 min
  })

  return { 
    tasks: data ?? [],
    isLoading,
    error: error ?? null,
    refetch,
  }
}

export function useSubmissions(): { 
  submissions: Submission[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["submissions"],
    queryFn: api.submissions.list,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  return { 
    submissions: data ?? [],
    isLoading,
    error: error ?? null,
    refetch,
  }
}

/**
 * Mutation hooks for task operations with automatic cache invalidation.
 * Mutations use optimistic updates where appropriate.
 */
export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => 
      api.tasks.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => 
      api.tasks.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.tasks.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

/**
 * Mutation hooks for submission operations (via unified API)
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.submissions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] }) // Task count updates
    },
  })
}

export function useUpdateSubmissionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: "approved" | "rejected"; adminNotes?: string }) => 
      api.submissions.updateStatus(id, status, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
    },
  })
}

/**
 * Phase 2: Worker earnings — computed from approved submissions.
 * Uses optimistic updates so earnings reflect immediately when a task is submitted.
 */
export function useWorkerEarnings(userId: string | undefined) {
  const { submissions } = useSubmissions()
  const { tasks } = useTasks()

  // Build a task lookup map once
  const taskMap = new Map(tasks.map((t) => [t.id, t]))

  // Approved earnings
  let approvedEarnings = 0
  // Pending (optimistic) earnings — submitted but not yet reviewed
  let pendingEarnings = 0
  let totalSubmitted = 0
  let totalApproved = 0

  if (userId) {
    for (const s of submissions) {
      if (s.userId !== userId) continue
      totalSubmitted++
      const task = taskMap.get(s.taskId)
      // For phased tasks, use the phase-level reward
      let reward = task?.reward ?? 0
      if (task?.phases && s.phaseIndex) {
        const phase = task.phases.find((p) => p.phaseIndex === s.phaseIndex)
        if (phase) reward = phase.reward
      }
      if (s.status === "approved") {
        approvedEarnings += reward
        totalApproved++
      } else if (s.status === "pending") {
        pendingEarnings += reward
      }
    }
  }

  return {
    approvedEarnings,
    pendingEarnings,
    totalEarnings: approvedEarnings + pendingEarnings,
    totalSubmitted,
    totalApproved,
  }
}

/**
 * Phase 2: Worker's past submissions list for the submissions screen.
 */
export function useWorkerSubmissions(userId: string | undefined) {
  const { submissions, isLoading, error, refetch } = useSubmissions()
  const workerSubs = userId 
    ? submissions.filter((s) => s.userId === userId) 
    : []
  return { submissions: workerSubs, isLoading, error, refetch }
}
