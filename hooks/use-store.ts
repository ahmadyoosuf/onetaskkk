"use client"

import { useSyncExternalStore } from "react"
import { subscribe, getTasksSnapshot, getSubmissionsSnapshot } from "@/lib/store"
import type { Task, Submission } from "@/lib/types"

export function useTasks(): Task[] {
  return useSyncExternalStore(subscribe, getTasksSnapshot, getTasksSnapshot)
}

export function useSubmissions(): Submission[] {
  return useSyncExternalStore(subscribe, getSubmissionsSnapshot, getSubmissionsSnapshot)
}
