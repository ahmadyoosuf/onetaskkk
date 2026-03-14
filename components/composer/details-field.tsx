"use client"

import { useCallback } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $convertToMarkdownString, $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { CodeNode } from "@lexical/code"
import { LinkNode } from "@lexical/link"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import type { EditorState } from "lexical"
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical"
import { $createHeadingNode } from "@lexical/rich-text"
import { $wrapNodes } from "@lexical/selection"
import { $getSelection, $isRangeSelection } from "lexical"
import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import type { TaskFormData } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import {
  Bold, Italic, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, Quote, Undo, Redo,
} from "lucide-react"

// ─── Nodes registered with Lexical ──────────────────────────
const EDITOR_NODES = [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode]

// ─── Theme: maps Lexical node types to Tailwind classes ──────
const EDITOR_THEME = {
  heading: {
    h1: "text-2xl font-bold mt-4 mb-2",
    h2: "text-xl font-semibold mt-3 mb-2",
    h3: "text-lg font-semibold mt-2 mb-1",
  },
  paragraph: "mb-2 leading-relaxed",
  quote: "border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-2",
  list: {
    ul: "list-disc list-inside mb-2 space-y-1",
    ol: "list-decimal list-inside mb-2 space-y-1",
    listitem: "ml-2",
  },
  code: "font-mono bg-muted rounded px-1 py-0.5 text-sm",
  text: {
    bold: "font-bold",
    italic: "italic",
    strikethrough: "line-through",
    code: "font-mono bg-muted rounded px-1 py-0.5 text-sm",
  },
  link: "text-primary underline underline-offset-2 hover:opacity-80",
}

// ─── Toolbar Plugin ───────────────────────────────────────────
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const format = useCallback((fmt: Parameters<typeof editor.dispatchCommand>[1]) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, fmt as any)
  }, [editor])

  const wrapHeading = useCallback((tag: "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createHeadingNode(tag))
      }
    })
  }, [editor])

  const wrapQuote = useCallback(() => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left" as any)
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => {
          const { $createQuoteNode } = require("@lexical/rich-text")
          return $createQuoteNode()
        })
      }
    })
  }, [editor])

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-b-0 border-border/60 bg-muted/40 px-2 py-1.5">
      {/* History */}
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Undo"
        onPressedChange={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Undo className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Redo"
        onPressedChange={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Redo className="h-3.5 w-3.5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Text format */}
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Bold"
        onPressedChange={() => format("bold")}
      >
        <Bold className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Italic"
        onPressedChange={() => format("italic")}
      >
        <Italic className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Strikethrough"
        onPressedChange={() => format("strikethrough")}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Inline code"
        onPressedChange={() => format("code")}
      >
        <Code className="h-3.5 w-3.5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Block format */}
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Heading 2"
        onPressedChange={() => wrapHeading("h2")}
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Heading 3"
        onPressedChange={() => wrapHeading("h3")}
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Bulleted list"
        onPressedChange={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left" as any)}
      >
        <List className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Ordered list"
        onPressedChange={() => {}}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        className="h-7 w-7 p-0 data-[state=on]:bg-accent touch-target-sm"
        aria-label="Blockquote"
        onPressedChange={wrapQuote}
      >
        <Quote className="h-3.5 w-3.5" />
      </Toggle>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────
export function DetailsField() {
  const { control, formState: { errors } } = useFormContext<TaskFormData>()
  const error = errors.details

  return (
    <Controller
      control={control}
      name="details"
      render={({ field }) => {
        // Build initialConfig once per mount — value from form default
        const initialConfig = {
          namespace: "DetailsEditor",
          theme: EDITOR_THEME,
          nodes: EDITOR_NODES,
          onError: (err: Error) => console.error("[Lexical]", err),
          editorState: field.value
            ? () => $convertFromMarkdownString(field.value, TRANSFORMERS)
            : undefined,
        }

        const handleChange = (editorState: EditorState) => {
          editorState.read(() => {
            const markdown = $convertToMarkdownString(TRANSFORMERS)
            field.onChange(markdown)
          })
        }

        return (
          <div className="space-y-2">
            <Label className={cn(error && "text-destructive")}>Details</Label>

            <div
              className={cn(
                "rounded-md border border-border/60 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 transition-shadow",
                error && "border-destructive focus-within:ring-destructive/40"
              )}
            >
              <LexicalComposer initialConfig={initialConfig}>
                <ToolbarPlugin />

                <div className="relative min-h-[160px]">
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        className="min-h-[160px] w-full rounded-b-md px-3 py-2.5 text-sm leading-relaxed outline-none"
                        aria-label="Task details"
                      />
                    }
                    placeholder={
                      <div className="pointer-events-none absolute left-3 top-2.5 select-none text-sm text-muted-foreground">
                        Write detailed instructions...{"\n\n"}
                        Tip: use **bold**, *italic*, ## headings, - lists
                      </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                </div>

                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
              </LexicalComposer>
            </div>

            <p className="text-xs text-muted-foreground">
              Supports Markdown shortcuts: **bold**, *italic*, ## heading, - list, {'>'} quote, {'`'}code{'`'}
            </p>
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        )
      }}
    />
  )
}
