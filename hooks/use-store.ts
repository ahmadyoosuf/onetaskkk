"use client"

import { useSyncExternalStore, useCallback } from "react"
import { subscribe, getTasks, getSubmissions } from "@/lib/store"
import type { Task, Submission } from "@/lib/types"

export function useTasks(): Task[] {
  return useSyncExternalStore(
    subscribe,
    () => getTasks(),
    () => getTasks()
  )
}

export function useSubmissions(taskId?: string): Submission[] {
  const getSnapshot = useCallback(() => getSubmissions(taskId), [taskId])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
