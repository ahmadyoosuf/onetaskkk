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

// SWR hooks with 2-second fetch delay (per PRD)
export function useTasks(): { tasks: Task[]; isLoading: boolean; error: Error | undefined } {
  const { data, error, isLoading } = useSWR("tasks", fetchTasks, {
    fallbackData: getTasksSnapshot(),
    revalidateOnFocus: false,
  })
  
  // Also subscribe to local changes for immediate optimistic updates
  const snapshot = useSyncExternalStore(subscribe, getTasksSnapshot, getTasksSnapshot)
  
  return { 
    tasks: data || snapshot, 
    isLoading: isLoading && !data,
    error 
  }
}

export function useSubmissions(): { submissions: Submission[]; isLoading: boolean; error: Error | undefined } {
  const { data, error, isLoading } = useSWR("submissions", fetchSubmissions, {
    fallbackData: getSubmissionsSnapshot(),
    revalidateOnFocus: false,
  })
  
  // Also subscribe to local changes for immediate optimistic updates
  const snapshot = useSyncExternalStore(subscribe, getSubmissionsSnapshot, getSubmissionsSnapshot)
  
  return { 
    submissions: data || snapshot, 
    isLoading: isLoading && !data,
    error 
  }
}
