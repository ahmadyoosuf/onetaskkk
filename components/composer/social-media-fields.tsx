"use client"

import { useFormContext, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLATFORM_OPTIONS, type Platform } from "@/lib/types"
import type { SocialMediaLikingData } from "@/lib/schemas"

export function SocialMediaFields() {
  const { register, control, formState: { errors } } = useFormContext<SocialMediaLikingData>()
  const postUrlError = errors.postUrl
  const platformError = errors.platform

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="postUrl" className={postUrlError ? "text-destructive" : ""}>
          Post URL
        </Label>
        <Input
          id="postUrl"
          type="url"
          placeholder="https://linkedin.com/posts/..."
          {...register("postUrl")}
          className={postUrlError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {postUrlError && (
          <p className="text-sm text-destructive">{postUrlError.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className={platformError ? "text-destructive" : ""}>
          Platform
        </Label>
        <Controller
          name="platform"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={(v) => field.onChange(v as Platform)}>
              <SelectTrigger className={platformError ? "border-destructive focus-visible:ring-destructive" : ""}>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {platformError && (
          <p className="text-sm text-destructive">{platformError.message}</p>
        )}
      </div>
    </>
  )
}
