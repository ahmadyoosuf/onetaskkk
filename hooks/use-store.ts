"use client"

import useSWR from "swr"
import { useSyncExternalStore } from "react"
import { 
  subscribe, 
  getTasksSnapshot, 
  getSubmissionsSnapshot,
  fetchTasks,
  fetchSubmissions 
} from "@/lib/store"
import type { Task, Submission } from "@/lib/types"

// Subscribe to the external store for authoritative live data.
// We still kick off the async fetchers so the mocked loading/error path remains exercised.
export function useTasks(): { tasks: Task[]; isLoading: boolean; error: Error | undefined } {
  const snapshot = useSyncExternalStore(subscribe, getTasksSnapshot, getTasksSnapshot)
  const { error, isLoading } = useSWR("tasks", fetchTasks, {
    revalidateOnFocus: false,
  })

  return { 
    tasks: snapshot,
    isLoading,
    error 
  }
}

export function useSubmissions(): { submissions: Submission[]; isLoading: boolean; error: Error | undefined } {
  const snapshot = useSyncExternalStore(subscribe, getSubmissionsSnapshot, getSubmissionsSnapshot)
  const { error, isLoading } = useSWR("submissions", fetchSubmissions, {
    revalidateOnFocus: false,
  })

  return { 
    submissions: snapshot,
    isLoading,
    error 
  }
}
