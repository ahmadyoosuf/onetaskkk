"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { EmailSendingData } from "@/lib/schemas"

export function EmailSendingFields() {
  const { register, formState: { errors } } = useFormContext<EmailSendingData>()
  const targetEmailError = errors.targetEmail
  const emailContentError = errors.emailContent

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="targetEmail" className={targetEmailError ? "text-destructive" : ""}>
          Target Email Address
        </Label>
        <Input
          id="targetEmail"
          type="email"
          placeholder="feedback@example.com"
          {...register("targetEmail")}
          className={targetEmailError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {targetEmailError && (
          <p className="text-sm text-destructive">{targetEmailError.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailContent" className={emailContentError ? "text-destructive" : ""}>
          Email Content / Instructions
        </Label>
        <Textarea
          id="emailContent"
          placeholder="Describe what the email should contain..."
          rows={4}
          {...register("emailContent")}
          className={emailContentError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {emailContentError && (
          <p className="text-sm text-destructive">{emailContentError.message}</p>
        )}
      </div>
    </>
  )
}
