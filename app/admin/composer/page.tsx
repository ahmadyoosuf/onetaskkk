"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { FileText, Mail, Heart, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { createTask } from "@/lib/store"
import { taskFormSchema, type TaskFormData } from "@/lib/schemas"
import { TASK_TYPE_META, type TaskType } from "@/lib/types"

// Field Components
import { TitleField } from "@/components/composer/title-field"
import { DescriptionField } from "@/components/composer/description-field"
import { RewardField } from "@/components/composer/reward-field"
import { MaxSubmissionsField } from "@/components/composer/max-submissions-field"
import { DeadlineField } from "@/components/composer/deadline-field"
import { FormSubmissionFields } from "@/components/composer/form-submission-fields"
import { EmailSendingFields } from "@/components/composer/email-sending-fields"
import { SocialMediaFields } from "@/components/composer/social-media-fields"

const TASK_TYPES: { value: TaskType; icon: typeof FileText }[] = [
  { value: "form_submission", icon: FileText },
  { value: "email_sending", icon: Mail },
  { value: "social_media_liking", icon: Heart },
]

export default function TaskComposerPage() {
  const router = useRouter()
  const [taskType, setTaskType] = useState<TaskType>("form_submission")

  const methods = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      type: "form_submission",
      title: "",
      description: "",
      reward: 5,
      maxSubmissions: 100,
      targetUrl: "",
      formFields: "",
    },
    mode: "onBlur",
  })

  const { handleSubmit, setValue, formState: { isSubmitting, errors } } = methods

  const handleTypeChange = (newType: TaskType) => {
    setTaskType(newType)
    setValue("type", newType, { shouldValidate: false })
  }

  const onSubmit = (data: TaskFormData) => {
    if (data.type === "form_submission") {
      createTask({
        type: "form_submission",
        title: data.title,
        description: data.description,
        reward: data.reward,
        maxSubmissions: data.maxSubmissions,
        deadline: data.deadline,
        details: {
          targetUrl: data.targetUrl,
          formFields: data.formFields.split(",").map((f) => f.trim()).filter(Boolean),
        },
      })
    } else if (data.type === "email_sending") {
      createTask({
        type: "email_sending",
        title: data.title,
        description: data.description,
        reward: data.reward,
        maxSubmissions: data.maxSubmissions,
        deadline: data.deadline,
        details: {
          targetEmail: data.targetEmail,
          emailContent: data.emailContent,
        },
      })
    } else if (data.type === "social_media_liking") {
      createTask({
        type: "social_media_liking",
        title: data.title,
        description: data.description,
        reward: data.reward,
        maxSubmissions: data.maxSubmissions,
        deadline: data.deadline,
        details: {
          postUrl: data.postUrl,
          platform: data.platform,
        },
      })
    }

    router.push("/admin/tasks")
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Task Composer</h1>
          <p className="text-muted-foreground">Create a new task for workers to complete.</p>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Task Type Selection */}
            <Card className="border-border/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Task Type</CardTitle>
                <CardDescription>Select the type of task you want to create.</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={taskType}
                  onValueChange={(v) => handleTypeChange(v as TaskType)}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {TASK_TYPES.map(({ value, icon: Icon }) => {
                    const meta = TASK_TYPE_META[value]
                    const isSelected = taskType === value
                    return (
                      <Label
                        key={value}
                        htmlFor={value}
                        className={cn(
                          "relative flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-all touch-feedback",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/30 hover:border-border/60 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={value} id={value} className="sr-only" />
                          <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                            isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected && "text-primary"
                          )}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {meta.description}
                        </p>
                        {isSelected && (
                          <div className="absolute -right-px -top-px h-3 w-3 rounded-bl-lg rounded-tr-lg bg-primary" />
                        )}
                      </Label>
                    )
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Basic Details */}
            <Card className="border-border/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Basic Details</CardTitle>
                <CardDescription>Provide the task title, description, and reward.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TitleField />
                <DescriptionField />
                <div className="grid gap-4 sm:grid-cols-2">
                  <RewardField />
                  <MaxSubmissionsField />
                </div>
                <DeadlineField />
              </CardContent>
            </Card>

            {/* Type-Specific Fields */}
            <Card className="border-border/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">
                  {TASK_TYPE_META[taskType].label} Details
                </CardTitle>
                <CardDescription>
                  Configure the specific requirements for this task type.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {taskType === "form_submission" && <FormSubmissionFields />}
                {taskType === "email_sending" && <EmailSendingFields />}
                {taskType === "social_media_liking" && <SocialMediaFields />}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                className="w-full sm:w-auto h-11"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-11">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  )
}
