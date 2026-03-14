"use client"

import { useFormContext } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { TaskFormData } from "@/lib/schemas"

export function DescriptionField() {
  const { register, formState: { errors }, watch } = useFormContext<TaskFormData>()
  const error = errors.description
  const value = watch("description") || ""
  const charCount = value.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="description" className={error ? "text-destructive" : ""}>
          Description
        </Label>
        <span className="text-xs text-muted-foreground">
          {charCount}/500
        </span>
      </div>
      <Textarea
        id="description"
        placeholder="Describe what workers need to do in detail..."
        rows={3}
        {...register("description")}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
