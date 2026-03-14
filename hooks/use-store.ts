"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { useSyncExternalStore, useCallback } from "react"
import { 
  subscribe, 
  getTasksSnapshot, 
  getSubmissionsSnapshot,
  fetchTasks,
  fetchSubmissions 
} from "@/lib/store"
import type { Task, Submission } from "@/lib/types"

/**
 * SWR-powered tasks hook with proper data flow:
 * - SWR handles async fetching, caching, revalidation, and loading/error states
 * - useSyncExternalStore provides instant reactivity for local mutations
 * - mutate() allows manual revalidation after mutations
 */
export function useTasks(): { 
  tasks: Task[]
  isLoading: boolean
  error: Error | undefined
  mutate: () => Promise<Task[] | undefined>
} {
  // Live snapshot for instant UI updates after local mutations
  const snapshot = useSyncExternalStore(subscribe, getTasksSnapshot, getTasksSnapshot)
  
  // SWR for async fetching, caching, and loading states
  const { data, error, isLoading, mutate } = useSWR("tasks", fetchTasks, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    // Use snapshot as fallback for instant rendering
    fallbackData: snapshot.length > 0 ? snapshot : undefined,
  })

  // Prefer live snapshot over SWR cache for immediate reactivity
  // SWR data is used during initial load before snapshot is populated
  const tasks = snapshot.length > 0 ? snapshot : (data ?? [])

  return { 
    tasks,
    isLoading: isLoading && snapshot.length === 0,
    error,
    mutate,
  }
}

export function useSubmissions(): { 
  submissions: Submission[]
  isLoading: boolean
  error: Error | undefined
  mutate: () => Promise<Submission[] | undefined>
} {
  const snapshot = useSyncExternalStore(subscribe, getSubmissionsSnapshot, getSubmissionsSnapshot)
  
  const { data, error, isLoading, mutate } = useSWR("submissions", fetchSubmissions, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    fallbackData: snapshot.length > 0 ? snapshot : undefined,
  })

  const submissions = snapshot.length > 0 ? snapshot : (data ?? [])

  return { 
    submissions,
    isLoading: isLoading && snapshot.length === 0,
    error,
    mutate,
  }
}

/**
 * Hook to revalidate all SWR caches after mutations.
 * Call this after createTask, updateTask, createSubmission, etc.
 */
export function useRevalidate() {
  return useCallback(() => {
    globalMutate("tasks")
    globalMutate("submissions")
  }, [])
}
