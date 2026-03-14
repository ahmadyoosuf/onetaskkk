"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Share2, Mail, Heart, Plus, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { createTask, updateTask, getTask } from "@/lib/store"
import { taskFormSchema, type TaskFormData } from "@/lib/schemas"
import { TASK_TYPE_META, type TaskType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

// Field Components
import { TitleField } from "@/components/composer/title-field"
import { DescriptionField } from "@/components/composer/description-field"
import { DetailsField } from "@/components/composer/details-field"
import { RewardField } from "@/components/composer/reward-field"
import { MaxSubmissionsField } from "@/components/composer/max-submissions-field"
import { AllowMultipleSubmissionsField } from "@/components/composer/allow-multiple-submissions-field"
import { DeadlineField } from "@/components/composer/deadline-field"
import { CampaignIdField } from "@/components/composer/campaign-id-field"
import { SocialMediaPostingFields } from "@/components/composer/social-media-posting-fields"
import { EmailSendingFields } from "@/components/composer/email-sending-fields"
import { SocialMediaFields } from "@/components/composer/social-media-fields"

const TASK_TYPES: { value: TaskType; icon: typeof Share2 }[] = [
  { value: "social_media_posting", icon: Share2 },
  { value: "email_sending", icon: Mail },
  { value: "social_media_liking", icon: Heart },
]

function TaskComposerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // Edit mode: Check for taskId in query params (PRD requirement)
  const editTaskId = searchParams.get("edit")
  const isEditMode = !!editTaskId
  
  const [taskType, setTaskType] = useState<TaskType>("social_media_posting")
  const [isLoadingTask, setIsLoadingTask] = useState(isEditMode)

  const methods = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      type: "social_media_posting",
      title: "",
      description: "",
      details: "",
      reward: 5,
      maxSubmissions: 100,
      allowMultipleSubmissions: false,
      platform: undefined,
      postContent: "",
      accountHandle: "",
      campaignId: "",
    },
    mode: "onBlur",
  })

  const { handleSubmit, setValue, reset, formState: { isSubmitting } } = methods

  // Load existing task data for edit mode
  useEffect(() => {
    if (!editTaskId) return
    
    const task = getTask(editTaskId)
    if (!task) {
      toast({ title: "Task not found", description: "The task you're trying to edit doesn't exist.", variant: "destructive" })
      router.push("/admin/tasks")
      return
    }
    
    setTaskType(task.type)
    
    // Reset form with task data
    const formData: Partial<TaskFormData> = {
      type: task.type,
      title: task.title,
      description: task.description,
      details: task.details,
      reward: task.reward,
      maxSubmissions: task.maxSubmissions,
      allowMultipleSubmissions: task.allowMultipleSubmissions,
      deadline: task.deadline,
      campaignId: task.campaignId || "",
    }
    
    // Add type-specific fields
    if (task.type === "social_media_posting") {
      Object.assign(formData, {
        platform: task.taskDetails.platform,
        postContent: task.taskDetails.postContent,
        accountHandle: task.taskDetails.accountHandle || "",
      })
    } else if (task.type === "email_sending") {
      Object.assign(formData, {
        targetEmail: task.taskDetails.targetEmail,
        emailContent: task.taskDetails.emailContent,
      })
    } else if (task.type === "social_media_liking") {
      Object.assign(formData, {
        postUrl: task.taskDetails.postUrl,
        platform: task.taskDetails.platform,
      })
    }
    
    reset(formData as TaskFormData)
    setIsLoadingTask(false)
  }, [editTaskId, reset, router, toast])

  const handleTypeChange = (newType: TaskType) => {
    setTaskType(newType)
    setValue("type", newType, { shouldValidate: false })
  }

  const onSubmit = async (data: TaskFormData) => {
    try {
      // Build task payload based on type
      let taskPayload: Parameters<typeof createTask>[0]

      if (data.type === "social_media_posting") {
        taskPayload = {
          type: "social_media_posting",
          title: data.title,
          description: data.description,
          details: data.details,
          reward: data.reward,
          maxSubmissions: data.maxSubmissions,
          allowMultipleSubmissions: data.allowMultipleSubmissions,
          deadline: data.deadline,
          campaignId: data.campaignId || undefined,
          taskDetails: {
            platform: data.platform,
            postContent: data.postContent,
            accountHandle: data.accountHandle || undefined,
          },
        }
      } else if (data.type === "email_sending") {
        taskPayload = {
          type: "email_sending",
          title: data.title,
          description: data.description,
          details: data.details,
          reward: data.reward,
          maxSubmissions: data.maxSubmissions,
          allowMultipleSubmissions: data.allowMultipleSubmissions,
          deadline: data.deadline,
          campaignId: data.campaignId || undefined,
          taskDetails: {
            targetEmail: data.targetEmail,
            emailContent: data.emailContent,
          },
        }
      } else {
        taskPayload = {
          type: "social_media_liking",
          title: data.title,
          description: data.description,
          details: data.details,
          reward: data.reward,
          maxSubmissions: data.maxSubmissions,
          allowMultipleSubmissions: data.allowMultipleSubmissions,
          deadline: data.deadline,
          campaignId: data.campaignId || undefined,
          taskDetails: {
            postUrl: data.postUrl,
            platform: data.platform,
          },
        }
      }

      // Edit mode: update existing task
      if (isEditMode && editTaskId) {
        await updateTask(editTaskId, taskPayload)
        toast({
          title: "Task updated",
          description: `"${data.title}" has been updated successfully.`,
        })
      } else {
        // Create mode: create new task
        await createTask(taskPayload)
        toast({
          title: "Task created",
          description: `"${data.title}" is now live and accepting submissions.`,
        })
      }

      router.push("/admin/tasks")
    } catch {
      toast({
        title: isEditMode ? "Failed to update task" : "Failed to create task",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <AppShell role="admin">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditMode ? "Edit Task" : "Task Composer"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Update the task details below." : "Create a new task for workers to complete."}
          </p>
        </div>
        
        {isLoadingTask && (
          <Card className="border-border/30 border-dashed">
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground animate-pulse">Loading task...</p>
            </CardContent>
          </Card>
        )}

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
                <DetailsField />
                <div className="grid gap-4 sm:grid-cols-2">
                  <RewardField />
                  <MaxSubmissionsField />
                </div>
                <AllowMultipleSubmissionsField />
                <div className="grid gap-4 sm:grid-cols-2">
                  <DeadlineField />
                  <CampaignIdField />
                </div>
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
                {taskType === "social_media_posting" && <SocialMediaPostingFields />}
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
              <Button type="submit" disabled={isSubmitting || isLoadingTask} className="w-full sm:w-auto h-11">
                {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Task")}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </AppShell>
  )
}

export default function TaskComposerPage() {
  return (
    <Suspense fallback={
      <AppShell role="admin">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </AppShell>
    }>
      <TaskComposerContent />
    </Suspense>
  )
}
