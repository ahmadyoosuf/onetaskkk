"use client"

import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { TaskFormData } from "@/lib/schemas"
import { cn } from "@/lib/utils"

export function DetailsField() {
  const { register, formState: { errors } } = useFormContext<TaskFormData>()
  const error = errors.details

  return (
    <div className="space-y-2">
      <Label htmlFor="details" className={cn(error && "text-destructive")}>Details</Label>
      <Textarea
        id="details"
        {...register("details")}
        placeholder="Enter detailed task instructions using Markdown formatting...

Example:
## Instructions
1. First step
2. Second step

**Important:** Remember to include screenshots"
        className={cn("min-h-36 font-mono text-sm", error && "border-destructive")}
      />
      <p className="text-xs text-muted-foreground">
        Supports Markdown: **bold**, *italic*, - lists, [links](url), ## headings
      </p>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  )
}
