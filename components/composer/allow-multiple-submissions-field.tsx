"use client"

import { useFormContext, Controller } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { TaskFormData } from "@/lib/schemas"

export function AllowMultipleSubmissionsField() {
  const { control, watch } = useFormContext<TaskFormData>()
  const allowMultipleSubmissions = watch("allowMultipleSubmissions")

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border/30 p-4">
      <div className="space-y-1">
        <Label htmlFor="allowMultipleSubmissions">Allow Multiple Submissions Per Worker</Label>
        <p className="text-sm text-muted-foreground">
          When disabled, each worker can submit to this task only once.
        </p>
      </div>
      <Controller
        name="allowMultipleSubmissions"
        control={control}
        render={({ field }) => (
          <Switch
            id="allowMultipleSubmissions"
            checked={field.value}
            onCheckedChange={field.onChange}
            aria-label={
              allowMultipleSubmissions
                ? "Multiple submissions are allowed"
                : "Multiple submissions are not allowed"
            }
          />
        )}
      />
    </div>
  )
}
