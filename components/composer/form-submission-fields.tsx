"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormSubmissionData } from "@/lib/schemas"

export function FormSubmissionFields() {
  const { register, formState: { errors } } = useFormContext<FormSubmissionData>()
  const targetUrlError = errors.targetUrl
  const formFieldsError = errors.formFields

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="targetUrl" className={targetUrlError ? "text-destructive" : ""}>
          Target URL
        </Label>
        <Input
          id="targetUrl"
          type="url"
          placeholder="https://example.com/signup"
          {...register("targetUrl")}
          className={targetUrlError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {targetUrlError && (
          <p className="text-sm text-destructive">{targetUrlError.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="formFields" className={formFieldsError ? "text-destructive" : ""}>
          Form Fields
        </Label>
        <Input
          id="formFields"
          placeholder="Name, Email, Phone, Company"
          {...register("formFields")}
          className={formFieldsError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of fields workers need to fill out.
        </p>
        {formFieldsError && (
          <p className="text-sm text-destructive">{formFieldsError.message}</p>
        )}
      </div>
    </>
  )
}
