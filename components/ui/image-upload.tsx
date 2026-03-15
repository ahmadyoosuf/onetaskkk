"use client"

import { useRef, useState, useCallback } from "react"
import { ImageIcon, Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string
  onChange: (dataUri: string | undefined) => void
  error?: string
  label?: string
  required?: boolean
  className?: string
}

/**
 * Image upload component that converts files to base64 data URIs.
 * 
 * Benefits over blob: URLs:
 * - Persists across sessions (no ephemeral object URLs)
 * - Can be stored directly in IndexedDB
 * - Serializable for form state
 * 
 * Note: For large images, consider compression before conversion.
 */
export function ImageUpload({
  value,
  onChange,
  error,
  label = "Screenshot",
  required,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result)
        } else {
          reject(new Error("Failed to convert file to base64"))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return
    
    // Validate file size (max 5MB to avoid IndexedDB bloat)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) return
    
    setIsConverting(true)
    try {
      const dataUri = await fileToBase64(file)
      onChange(dataUri)
    } catch {
      // Silently ignore conversion errors — the upload UI will remain in its empty state
    } finally {
      setIsConverting(false)
    }
  }, [fileToBase64, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  // Check if value is a valid data URI or URL
  const hasImage = value && (value.startsWith("data:image/") || value.startsWith("http"))

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label} {required && <span className="text-destructive">*</span>}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleInputChange}
        aria-label={`Upload ${label}`}
      />

      {isConverting ? (
        // Converting state
        <div className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing image...</p>
        </div>
      ) : hasImage ? (
        // Preview state
        <div className="relative overflow-hidden rounded-lg border border-border/40 bg-muted/30">
          <img
            src={value}
            alt="Uploaded screenshot preview"
            className="h-48 w-full object-contain p-2"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium shadow transition-colors hover:bg-background"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md bg-destructive/90 px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow transition-colors hover:bg-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        // Drop zone state
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary/60 bg-primary/5"
              : "border-border/40 bg-muted/20 hover:border-border/60 hover:bg-muted/40",
            error && "border-destructive/50"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {isDragging ? (
              <Upload className="h-5 w-5 text-primary" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Drop to upload" : "Click or drag & drop"}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (max 5MB)</p>
          </div>
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
