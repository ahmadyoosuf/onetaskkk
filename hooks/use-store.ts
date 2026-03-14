"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  fetchTasks,
  fetchSubmissions,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  createSubmission,
  updateSubmissionStatus,
} from "@/lib/store"
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
    queryFn: fetchTasks,
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
    queryFn: fetchSubmissions,
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
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => 
      updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => 
      updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

/**
 * Mutation hooks for submission operations
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSubmission,
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
      updateSubmissionStatus(id, status, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] })
    },
  })
}
