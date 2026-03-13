"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Mail, Heart, Plus, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { createTask } from "@/lib/store"
import type { TaskType } from "@/lib/types"
import { TASK_TYPE_META } from "@/lib/types"

const TASK_TYPES: { value: TaskType; icon: typeof FileText }[] = [
  { value: "form_submission", icon: FileText },
  { value: "email_sending", icon: Mail },
  { value: "social_media_liking", icon: Heart },
]

export default function TaskComposerPage() {
  const router = useRouter()
  const [taskType, setTaskType] = useState<TaskType>("form_submission")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [reward, setReward] = useState("")
  const [maxSubmissions, setMaxSubmissions] = useState("")
  
  // Type-specific fields
  const [targetUrl, setTargetUrl] = useState("")
  const [formFields, setFormFields] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [targetEmail, setTargetEmail] = useState("")
  const [postUrl, setPostUrl] = useState("")
  const [platform, setPlatform] = useState<"twitter" | "linkedin" | "instagram">("linkedin")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const details: Record<string, unknown> = {}
    
    if (taskType === "form_submission") {
      details.targetUrl = targetUrl
      details.formFields = formFields.split(",").map((f) => f.trim()).filter(Boolean)
    } else if (taskType === "email_sending") {
      details.emailContent = emailContent
      details.targetEmail = targetEmail
    } else if (taskType === "social_media_liking") {
      details.postUrl = postUrl
      details.platform = platform
    }

    createTask({
      type: taskType,
      title,
      description,
      details,
      reward: parseFloat(reward) || 0,
      maxSubmissions: parseInt(maxSubmissions) || 100,
    })

    router.push("/admin/tasks")
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Task Composer</h1>
          <p className="text-muted-foreground">Create a new task for workers to complete.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type Selection */}
          <Card className="border-border/30">
            <CardHeader>
              <CardTitle className="text-lg">Task Type</CardTitle>
              <CardDescription>Select the type of task you want to create.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={taskType}
                onValueChange={(v) => setTaskType(v as TaskType)}
                className="grid gap-4 sm:grid-cols-3"
              >
                {TASK_TYPES.map(({ value, icon: Icon }) => {
                  const meta = TASK_TYPE_META[value]
                  return (
                    <Label
                      key={value}
                      htmlFor={value}
                      className={cn(
                        "flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-all",
                        taskType === value
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/30 hover:border-border/60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={value} id={value} />
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          taskType === value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{meta.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-9">{meta.description}</p>
                    </Label>
                  )
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Basic Details */}
          <Card className="border-border/30">
            <CardHeader>
              <CardTitle className="text-lg">Basic Details</CardTitle>
              <CardDescription>Provide the task title, description, and reward information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Complete Beta Signup Form"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what workers need to do..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reward">Reward ($)</Label>
                  <Input
                    id="reward"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2.50"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSubmissions">Max Submissions</Label>
                  <Input
                    id="maxSubmissions"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={maxSubmissions}
                    onChange={(e) => setMaxSubmissions(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Type-Specific Fields */}
          <Card className="border-border/30">
            <CardHeader>
              <CardTitle className="text-lg">
                {TASK_TYPE_META[taskType].label} Details
              </CardTitle>
              <CardDescription>
                Configure the specific requirements for this task type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {taskType === "form_submission" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="targetUrl">Target URL</Label>
                    <Input
                      id="targetUrl"
                      type="url"
                      placeholder="https://example.com/form"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formFields">Form Fields (comma-separated)</Label>
                    <Input
                      id="formFields"
                      placeholder="Name, Email, Phone, Company"
                      value={formFields}
                      onChange={(e) => setFormFields(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      List the fields workers need to fill out.
                    </p>
                  </div>
                </>
              )}

              {taskType === "email_sending" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="targetEmail">Target Email Address</Label>
                    <Input
                      id="targetEmail"
                      type="email"
                      placeholder="feedback@example.com"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailContent">Email Content / Instructions</Label>
                    <Textarea
                      id="emailContent"
                      placeholder="Describe what the email should contain..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                </>
              )}

              {taskType === "social_media_liking" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="postUrl">Post URL</Label>
                    <Input
                      id="postUrl"
                      type="url"
                      placeholder="https://linkedin.com/posts/..."
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="twitter">Twitter / X</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
