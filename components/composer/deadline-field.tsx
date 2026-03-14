"use client"

import { useFormContext, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TaskFormData } from "@/lib/schemas"

export function DeadlineField() {
  const { control, formState: { errors } } = useFormContext<TaskFormData>()
  const error = errors.deadline

  // Get tomorrow's date for min attribute
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  return (
    <div className="space-y-2">
      <Label htmlFor="deadline" className={error ? "text-destructive" : ""}>
        Deadline <span className="text-muted-foreground font-normal">(optional)</span>
      </Label>
      <Controller
        name="deadline"
        control={control}
        render={({ field }) => (
          <Input
            id="deadline"
            type="date"
            min={minDate}
            className={error ? "border-destructive focus-visible:ring-destructive" : ""}
            value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
          />
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
