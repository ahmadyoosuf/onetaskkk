"use client"

import { useEffect, useState } from "react"
import { ExternalLink, ImageIcon, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { getEvidenceFile } from "@/lib/store"

/**
 * Renders evidence screenshots, resolving `evidence://` references
 * from the separate IndexedDB files store on the fly.
 */
export function EvidenceImage({ screenshotUrl }: { screenshotUrl: string }) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (screenshotUrl.startsWith("evidence://")) {
      const submissionId = screenshotUrl.replace("evidence://", "")
      setLoading(true)
      getEvidenceFile(submissionId).then((base64) => {
        setResolvedUrl(base64)
        setLoading(false)
      })
    } else {
      setResolvedUrl(screenshotUrl)
    }
  }, [screenshotUrl])

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-3 w-3" />
        Evidence Screenshot
      </Label>
      {loading ? (
        <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/30 p-4 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading evidence...
        </div>
      ) : resolvedUrl?.startsWith("data:") ? (
        <div className="rounded-lg border border-border/30 overflow-hidden">
          <img
            src={resolvedUrl}
            alt="Evidence screenshot"
            className="w-full h-auto max-h-64 object-contain bg-muted/30"
          />
        </div>
      ) : resolvedUrl ? (
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
        >
          {resolvedUrl}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <p className="text-xs text-muted-foreground">No evidence available</p>
      )}
    </div>
  )
}
