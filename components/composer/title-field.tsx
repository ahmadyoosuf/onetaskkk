"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TaskFormData } from "@/lib/schemas"

export function TitleField() {
  const { register, formState: { errors } } = useFormContext<TaskFormData>()
  const error = errors.title

  return (
    <div className="space-y-2">
      <Label htmlFor="title" className={error ? "text-destructive" : ""}>
        Task Title
      </Label>
      <Input
        id="title"
        placeholder="e.g., Complete Beta Signup Form"
        {...register("title")}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
