"use client"

import { useFormContext, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TaskFormData } from "@/lib/schemas"

export function RewardField() {
  const { control, formState: { errors } } = useFormContext<TaskFormData>()
  const error = errors.reward

  return (
    <div className="space-y-2">
      <Label htmlFor="reward" className={error ? "text-destructive" : ""}>
        Reward ($)
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <Controller
          name="reward"
          control={control}
          render={({ field }) => (
            <Input
              id="reward"
              type="number"
              step="0.01"
              min="0"
              placeholder="2.50"
              className={`pl-7 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
