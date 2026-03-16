"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, FileText, AlertCircle, Check, X, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import type { TaskType, Platform } from "@/lib/types"

type CSVRow = {
  type: TaskType
  title: string
  description: string
  details: string
  reward: number
  maxSubmissions: number
  campaignId: string
  platform?: Platform
  postContent?: string
  targetEmail?: string
  emailContent?: string
  postUrl?: string
}

type ParsedRow = {
  row: CSVRow
  errors: string[]
  index: number
}

const VALID_TYPES: TaskType[] = ["social_media_posting", "email_sending", "social_media_liking"]
const VALID_PLATFORMS: Platform[] = ["linkedin", "twitter", "instagram"]

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
  const results: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (handles quoted values with commas)
    const values: string[] = []
    let current = ""
    let inQuotes = false
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const errors: string[] = []
    const getValue = (key: string) => {
      const idx = headers.indexOf(key)
      return idx >= 0 ? values[idx]?.replace(/^"|"$/g, "") ?? "" : ""
    }

    const type = getValue("type") as TaskType
    if (!VALID_TYPES.includes(type)) {
      errors.push(`Invalid type: "${type}". Must be one of: ${VALID_TYPES.join(", ")}`)
    }

    const title = getValue("title")
    if (!title || title.length < 5) errors.push("Title must be at least 5 characters")

    const details = getValue("details")
    if (!details || details.length < 20) errors.push("Details must be at least 20 characters")

    const reward = parseFloat(getValue("reward"))
    if (isNaN(reward) || reward < 0.1) errors.push("Reward must be at least A$0.10")

    const maxSubmissions = parseInt(getValue("max_submissions") || getValue("maxsubmissions") || getValue("amount"), 10)
    if (isNaN(maxSubmissions) || maxSubmissions < 1) errors.push("Max submissions must be at least 1")

    // Type-specific validation
    let platform: Platform | undefined
    let postContent: string | undefined
    let targetEmail: string | undefined
    let emailContent: string | undefined
    let postUrl: string | undefined

    if (type === "social_media_posting") {
      platform = getValue("platform") as Platform
      if (!VALID_PLATFORMS.includes(platform)) {
        errors.push(`Invalid platform: "${platform}"`)
      }
      postContent = getValue("post_content") || getValue("postcontent")
      if (!postContent || postContent.length < 10) errors.push("Post content must be at least 10 characters")
    } else if (type === "email_sending") {
      targetEmail = getValue("target_email") || getValue("targetemail")
      if (!targetEmail || !targetEmail.includes("@")) errors.push("Invalid target email")
      emailContent = getValue("email_content") || getValue("emailcontent")
      if (!emailContent || emailContent.length < 10) errors.push("Email content must be at least 10 characters")
    } else if (type === "social_media_liking") {
      platform = getValue("platform") as Platform
      if (!VALID_PLATFORMS.includes(platform)) {
        errors.push(`Invalid platform: "${platform}"`)
      }
      postUrl = getValue("post_url") || getValue("posturl")
      if (!postUrl) errors.push("Post URL is required")
    }

    results.push({
      row: {
        type,
        title,
        description: getValue("description"),
        details,
        reward,
        maxSubmissions,
        campaignId: getValue("campaign_id") || getValue("campaignid"),
        platform,
        postContent,
        targetEmail,
        emailContent,
        postUrl,
      },
      errors,
      index: i,
    })
  }

  return results
}

type CSVUploadProps = {
  onTasksCreated: () => void
}

export function CSVUpload({ onTasksCreated }: CSVUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (rows.length === 0) {
        toast({ title: "Empty file", description: "The CSV file contains no data rows.", variant: "destructive" })
        return
      }
      setParsedRows(rows)
      setShowPreviewDialog(true)
    }
    reader.readAsText(file)
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so same file can be re-uploaded
    e.target.value = ""
  }

  const validRows = parsedRows.filter((r) => r.errors.length === 0)
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0)

  const handleBulkCreate = async () => {
    if (validRows.length === 0) return
    setIsCreating(true)
    let created = 0
    try {
      for (const { row } of validRows) {
        let taskPayload: Parameters<typeof api.tasks.create>[0]
        const base = {
          title: row.title,
          description: row.description || undefined,
          details: row.details,
          reward: row.reward,
          maxSubmissions: row.maxSubmissions,
          allowMultipleSubmissions: false,
          campaignId: row.campaignId || undefined,
        }

        if (row.type === "social_media_posting") {
          taskPayload = {
            ...base,
            type: "social_media_posting",
            taskDetails: {
              platform: row.platform!,
              postContent: row.postContent!,
            },
          }
        } else if (row.type === "email_sending") {
          taskPayload = {
            ...base,
            type: "email_sending",
            taskDetails: {
              targetEmail: row.targetEmail!,
              emailContent: row.emailContent!,
            },
          }
        } else {
          taskPayload = {
            ...base,
            type: "social_media_liking",
            taskDetails: {
              postUrl: row.postUrl!,
              platform: row.platform!,
            },
          }
        }

        await api.tasks.create(taskPayload)
        created++
      }
      toast({
        title: "Bulk upload complete",
        description: `${created} task${created !== 1 ? "s" : ""} created successfully.`,
      })
      setShowPreviewDialog(false)
      setParsedRows([])
      onTasksCreated()
    } catch {
      toast({
        title: "Bulk upload failed",
        description: `Created ${created} of ${validRows.length} tasks before encountering an error.`,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const downloadTemplate = () => {
    const headers = "type,title,description,details,reward,max_submissions,campaign_id,platform,post_content,target_email,email_content,post_url"
    const example1 = '"social_media_posting","Share Our Launch Post","Post about our product launch on LinkedIn","**Instructions:** Share our product launch announcement on your LinkedIn profile. Include the hashtag #ProductLaunch2026 and tag our official page.",5.00,100,"spring-launch","linkedin","Excited about the launch of onetaskkk! Check it out #ProductLaunch2026","","",""'
    const example2 = '"email_sending","Send Feedback Email","Email our feedback team","**Instructions:** Send an email to our feedback team sharing your experience with our platform. Include at least 3 specific features you like.",3.50,50,"q2-feedback","","","feedback@acme.com","Dear Team, I wanted to share my experience...",""'
    const example3 = '"social_media_liking","Like Our Instagram Post","Engage with our latest post","**Instructions:** Like our latest Instagram post about the product launch. Must be from a personal account.",1.00,200,"engagement-2026","instagram","","","","https://instagram.com/p/acme-launch"'
    const csv = `${headers}\n${example1}\n${example2}\n${example3}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "onetaskkk-tasks-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/60"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Drop CSV file here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">Upload multiple tasks at once from a CSV file</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); downloadTemplate() }} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Download Template
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Preview</DialogTitle>
            <DialogDescription>
              {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""} found
              {invalidRows.length > 0 && ` (${invalidRows.length} with errors)`}
            </DialogDescription>
          </DialogHeader>

          {/* Summary */}
          <div className="flex items-center gap-3">
            {validRows.length > 0 && (
              <Badge variant="approved" className="gap-1">
                <Check className="h-3 w-3" />
                {validRows.length} valid
              </Badge>
            )}
            {invalidRows.length > 0 && (
              <Badge variant="rejected" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {invalidRows.length} invalid
              </Badge>
            )}
          </div>

          {/* Table Preview */}
          <div className="rounded-lg border border-border/30 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Slots</TableHead>
                  <TableHead>Campaign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.map(({ row, errors, index }) => (
                  <TableRow key={index} className={errors.length > 0 ? "bg-destructive/5" : ""}>
                    <TableCell className="text-xs text-muted-foreground">{index}</TableCell>
                    <TableCell>
                      {errors.length === 0 ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                          <span className="text-[10px] text-destructive truncate max-w-32">{errors[0]}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {row.type === "social_media_posting" ? "Posting" :
                         row.type === "email_sending" ? "Email" : "Liking"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm">{row.title}</TableCell>
                    <TableCell className="text-sm font-mono">A${(row.reward || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{row.maxSubmissions || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.campaignId || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkCreate}
              disabled={validRows.length === 0 || isCreating}
              loading={isCreating}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Create {validRows.length} Task{validRows.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
