"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"
import { 
  subscribe, 
  getTasksSnapshot, 
  getSubmissionsSnapshot,
  fetchTasks,
  fetchSubmissions,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  createSubmission,
  updateSubmissionStatus,
} from "@/lib/store"
import type { Task, Submission, TaskStatus, SubmissionStatus } from "@/lib/types"

/**
 * TanStack Query-powered tasks hook with proper data flow:
 * - TanStack Query handles async fetching, caching, revalidation, and loading/error states
 * - useSyncExternalStore provides instant reactivity for local mutations
 * - Mutations automatically invalidate queries on success
 */
export function useTasks(): { 
  tasks: Task[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  // Live snapshot for instant UI updates after local mutations
  const snapshot = useSyncExternalStore(subscribe, getTasksSnapshot, getTasksSnapshot)
  
  // TanStack Query for async fetching, caching, and loading states
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    initialData: snapshot.length > 0 ? snapshot : undefined,
  })

  // Prefer live snapshot over query cache for immediate reactivity
  // Query data is used during initial load before snapshot is populated
  const tasks = snapshot.length > 0 ? snapshot : (data ?? [])

  return { 
    tasks,
    isLoading: isLoading && snapshot.length === 0,
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
  const snapshot = useSyncExternalStore(subscribe, getSubmissionsSnapshot, getSubmissionsSnapshot)
  
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["submissions"],
    queryFn: fetchSubmissions,
    initialData: snapshot.length > 0 ? snapshot : undefined,
  })

  const submissions = snapshot.length > 0 ? snapshot : (data ?? [])

  return { 
    submissions,
    isLoading: isLoading && snapshot.length === 0,
    error: error ?? null,
    refetch,
  }
}

/**
 * Mutation hooks for task operations with automatic cache invalidation
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
