"use client"

import { useFormContext, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TaskFormData } from "@/lib/schemas"

export function MaxSubmissionsField() {
  const { control, formState: { errors } } = useFormContext<TaskFormData>()
  const error = errors.maxSubmissions

  return (
    <div className="space-y-2">
      <Label htmlFor="maxSubmissions" className={error ? "text-destructive" : ""}>
        Max Submissions
      </Label>
      <Controller
        name="maxSubmissions"
        control={control}
        render={({ field }) => (
          <Input
            id="maxSubmissions"
            type="number"
            min="1"
            placeholder="100"
            className={error ? "border-destructive focus-visible:ring-destructive" : ""}
            {...field}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          />
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
