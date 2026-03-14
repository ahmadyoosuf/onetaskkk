"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TaskFormData } from "@/lib/schemas"

export function CampaignIdField() {
  const { register, formState: { errors } } = useFormContext<TaskFormData>()
  const error = errors.campaignId

  return (
    <div className="space-y-2">
      <Label htmlFor="campaignId" className={error ? "text-destructive" : ""}>
        Campaign ID <span className="text-muted-foreground text-xs">(optional)</span>
      </Label>
      <Input
        id="campaignId"
        placeholder="e.g., spring-launch, q2-marketing"
        {...register("campaignId")}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      <p className="text-xs text-muted-foreground">
        Group tasks by campaign for bulk operations and filtering
      </p>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}
