"use client"

import { useRef, useState } from "react"
import { ImageIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string
  onChange: (objectUrl: string | undefined) => void
  error?: string
  label?: string
  required?: boolean
  className?: string
}

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

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    // Revoke previous object URL to avoid memory leaks
    if (value?.startsWith("blob:")) {
      URL.revokeObjectURL(value)
    }
    onChange(URL.createObjectURL(file))
  }

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
    if (value?.startsWith("blob:")) URL.revokeObjectURL(value)
    onChange(undefined)
  }

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

      {value ? (
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
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP supported</p>
          </div>
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
