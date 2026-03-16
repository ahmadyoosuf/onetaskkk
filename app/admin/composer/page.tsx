"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AppShell } from "@/components/app-shell"
import { ErrorBoundary } from "@/components/error-boundary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Share2, Mail, Heart, Plus, Save, Check, RotateCcw, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/store"
import { taskFormSchema, type TaskFormData } from "@/lib/schemas"
import { TASK_TYPE_META, type TaskType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

// Phase 2 Components
import { PhasesEditor, type PhaseEntry } from "@/components/composer/phases-editor"
import { DripFeedField } from "@/components/composer/drip-feed-field"
import { CSVUpload } from "@/components/composer/csv-upload"

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdTaskTitle, setCreatedTaskTitle] = useState("")
  
  // Phase 2: Phases state
  const [phasesEnabled, setPhasesEnabled] = useState(false)
  const [phases, setPhases] = useState<PhaseEntry[]>([])
  
  // Phase 2: Drip feed state
  const [dripFeedEnabled, setDripFeedEnabled] = useState(false)
  const [dripAmount, setDripAmount] = useState(5)
  const [dripInterval, setDripInterval] = useState(6)

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
    
    const loadTask = async () => {
    const task = await api.tasks.get(editTaskId)
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
      description: task.description ?? "",
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
    
    // Phase 2: Load phases & drip feed state
    if (task.phases && task.phases.length > 0) {
      setPhasesEnabled(true)
      setPhases(task.phases.map((p) => ({
        id: `phase-edit-${p.phaseIndex}`,
        phaseName: p.phaseName,
        slots: p.slots,
        instructions: p.instructions,
        reward: p.reward,
      })))
    }
    if (task.dripFeed?.enabled) {
      setDripFeedEnabled(true)
      setDripAmount(task.dripFeed.dripAmount)
      setDripInterval(task.dripFeed.dripInterval)
    }
    
    setIsLoadingTask(false)
    }
    loadTask()
  }, [editTaskId, reset, router, toast])

  const handleTypeChange = (newType: TaskType) => {
    setTaskType(newType)
    setValue("type", newType, { shouldValidate: false })
  }

  const handleCreateAnother = () => {
    reset({
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
    })
    setTaskType("social_media_posting")
    setShowSuccessDialog(false)
    setCreatedTaskTitle("")
    // Phase 2: Reset phases & drip feed
    setPhasesEnabled(false)
    setPhases([])
    setDripFeedEnabled(false)
    setDripAmount(5)
    setDripInterval(6)
  }

  const handleViewTasks = () => {
    setShowSuccessDialog(false)
    router.push("/admin/tasks")
  }

  const onSubmit = async (data: TaskFormData) => {
    try {
      // Build task payload based on type
      let taskPayload: Parameters<typeof api.tasks.create>[0]

      const desc = data.description || undefined

      // Phase 2: Build phases array if enabled
      const phasesPayload = phasesEnabled && phases.length >= 2
        ? phases.map((p, i) => ({
            phaseIndex: i + 1,
            phaseName: p.phaseName,
            slots: p.slots,
            instructions: p.instructions,
            reward: p.reward,
          }))
        : undefined

      // Phase 2: Build drip feed config if enabled
      const dripFeedPayload = dripFeedEnabled && dripAmount > 0 && dripInterval > 0
        ? {
            enabled: true as const,
            dripAmount,
            dripInterval,
            startedAt: new Date(),
          }
        : undefined

      if (data.type === "social_media_posting") {
        taskPayload = {
          type: "social_media_posting",
          title: data.title,
          description: desc,
          details: data.details,
          reward: data.reward,
          maxSubmissions: data.maxSubmissions,
          allowMultipleSubmissions: data.allowMultipleSubmissions,
          deadline: data.deadline,
          campaignId: data.campaignId || undefined,
          phases: phasesPayload,
          dripFeed: dripFeedPayload,
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
          description: desc,
          details: data.details,
          reward: data.reward,
          maxSubmissions: data.maxSubmissions,
          allowMultipleSubmissions: data.allowMultipleSubmissions,
          deadline: data.deadline,
          campaignId: data.campaignId || undefined,
          phases: phasesPayload,
          dripFeed: dripFeedPayload,
          taskDetails: {
            targetEmail: data.targetEmail,
            emailContent: data.emailContent,
          },
        }
      } else {
        taskPayload = {
          type: "social_media_liking",
          title: data.title,
          description: desc,
          details: data.details,
          reward: data.reward,
          maxSubmissions: data.maxSubmissions,
          allowMultipleSubmissions: data.allowMultipleSubmissions,
          deadline: data.deadline,
          campaignId: data.campaignId || undefined,
          phases: phasesPayload,
          dripFeed: dripFeedPayload,
          taskDetails: {
            postUrl: data.postUrl,
            platform: data.platform,
          },
        }
      }

      // Edit mode: update existing task
      if (isEditMode && editTaskId) {
        await api.tasks.update(editTaskId, taskPayload)
        toast({
          title: "Task updated",
          description: `"${data.title}" has been updated successfully.`,
        })
        router.push("/admin/tasks")
      } else {
        // Create mode: create new task and show success dialog
        await api.tasks.create(taskPayload)
        setCreatedTaskTitle(data.title)
        setShowSuccessDialog(true)
      }
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
        
        {/* Phase 2: Bulk CSV Upload (only in create mode) */}
        {!isEditMode && (
          <Card className="border-border/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Bulk Upload</CardTitle>
              <CardDescription>Create multiple tasks at once by uploading a CSV file.</CardDescription>
            </CardHeader>
            <CardContent>
              <CSVUpload onTasksCreated={() => router.push("/admin/tasks")} />
            </CardContent>
          </Card>
        )}

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

            {/* Phase 2: Task Phases */}
            <Card className="border-border/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Task Phases</CardTitle>
                <CardDescription>
                  Optionally break this task into sequential stages with different instructions and rewards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhasesEditor
                  enabled={phasesEnabled}
                  onEnabledChange={setPhasesEnabled}
                  phases={phases}
                  onPhasesChange={setPhases}
                />
              </CardContent>
            </Card>

            {/* Phase 2: Drip Feed */}
            <Card className="border-border/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Drip Feed</CardTitle>
                <CardDescription>
                  Control the rate of slot releases to pace worker completions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DripFeedField
                  enabled={dripFeedEnabled}
                  onEnabledChange={setDripFeedEnabled}
                  dripAmount={dripAmount}
                  onDripAmountChange={setDripAmount}
                  dripInterval={dripInterval}
                  onDripIntervalChange={setDripInterval}
                />
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

        {/* Success Dialog with Reset Option */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Check className="h-6 w-6 text-success" />
              </div>
              <DialogTitle>Task Created Successfully</DialogTitle>
              <DialogDescription>
                &ldquo;{createdTaskTitle}&rdquo; is now live and accepting submissions.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={handleViewTasks} className="w-full h-11">
                <ArrowRight className="mr-2 h-4 w-4" />
                View All Tasks
              </Button>
              <Button variant="outline" onClick={handleCreateAnother} className="w-full h-11">
                <RotateCcw className="mr-2 h-4 w-4" />
                Create Another Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
      <ErrorBoundary>
        <TaskComposerContent />
      </ErrorBoundary>
    </Suspense>
  )
}
