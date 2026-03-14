"use client"

import { useFormContext, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLATFORM_OPTIONS, type Platform } from "@/lib/types"
import type { SocialMediaPostingData } from "@/lib/schemas"

export function SocialMediaPostingFields() {
  const { register, control, formState: { errors } } = useFormContext<SocialMediaPostingData>()
  const platformError = errors.platform
  const postContentError = errors.postContent
  const accountHandleError = errors.accountHandle

  return (
    <>
      <div className="space-y-2">
        <Label className={platformError ? "text-destructive" : ""}>Platform</Label>
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

      <div className="space-y-2">
        <Label htmlFor="postContent" className={postContentError ? "text-destructive" : ""}>
          Post Content
        </Label>
        <Textarea
          id="postContent"
          placeholder="Write the exact content workers should post on their social media account..."
          rows={4}
          {...register("postContent")}
          className={postContentError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Workers will post this content verbatim on the selected platform.
        </p>
        {postContentError && (
          <p className="text-sm text-destructive">{postContentError.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountHandle" className={accountHandleError ? "text-destructive" : ""}>
          Account to Tag <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="accountHandle"
          placeholder="@yourbrand"
          {...register("accountHandle")}
          className={accountHandleError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Workers should tag this account in their post.
        </p>
        {accountHandleError && (
          <p className="text-sm text-destructive">{accountHandleError.message}</p>
        )}
      </div>
    </>
  )
}
