"use client"

import { useEffect } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { TaskFormData } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { Bold, Italic, Link, List } from "lucide-react"

function Toolbar() {
  const [editor] = useLexicalComposerContext()

  return (
    <div className="flex items-center gap-2 border-b border-border/60 p-2">
      <Button type="button" size="sm" variant="ghost" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertText("\n• ")
            }
          })
        }}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => {
          const url = window.prompt("Enter link URL")
          if (!url) return
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              const selectedText = selection.getTextContent() || "link"
              selection.insertText(`${selectedText} (${url})`)
            }
          })
        }}
      >
        <Link className="h-4 w-4" />
      </Button>
    </div>
  )
}

function InitialValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.update(() => {
      const parser = new DOMParser()
      const parsed = parser.parseFromString(value || "<p></p>", "text/html")
      const text = parsed.body.textContent || ""

      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode(text))
      root.append(paragraph)
    })
  }, [editor, value])

  return null
}

function RichEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: "task-details-editor",
        onError: (error) => {
          throw error
        },
      }}
    >
      <div className="rounded-md border border-input bg-background">
        <Toolbar />
        <RichTextPlugin
          contentEditable={<ContentEditable className="min-h-36 p-3 text-sm outline-none" />}
          placeholder={<div className="p-3 text-sm text-muted-foreground">Add rich task instructions...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <InitialValuePlugin value={value} />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              const text = $getRoot().getTextContent().trim()
              const html = text
                .split("\n")
                .map((line) => `<p>${line || "<br/>"}</p>`)
                .join("")
              onChange(html)
            })
          }}
        />
      </div>
    </LexicalComposer>
  )
}

export function DetailsField() {
  const { control, formState: { errors } } = useFormContext<TaskFormData>()
  const error = errors.details

  return (
    <div className="space-y-2">
      <Label className={cn(error && "text-destructive")}>Details</Label>
      <Controller
        name="details"
        control={control}
        render={({ field }) => <RichEditor value={field.value || ""} onChange={field.onChange} />}
      />
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  )
}
