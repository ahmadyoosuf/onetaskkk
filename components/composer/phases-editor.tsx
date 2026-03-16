"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Plus, Trash2, ChevronDown, GripVertical, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskPhaseFormData } from "@/lib/schemas"

export type PhaseEntry = TaskPhaseFormData & { id: string }

type PhasesEditorProps = {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  phases: PhaseEntry[]
  onPhasesChange: (phases: PhaseEntry[]) => void
}

function createEmptyPhase(index: number): PhaseEntry {
  return {
    id: `phase-${Date.now()}-${index}`,
    phaseName: `Phase ${index}`,
    slots: 50,
    instructions: "",
    reward: 5,
  }
}

export function PhasesEditor({ enabled, onEnabledChange, phases, onPhasesChange }: PhasesEditorProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({})

  const handleToggle = (newEnabled: boolean) => {
    onEnabledChange(newEnabled)
    if (newEnabled && phases.length === 0) {
      onPhasesChange([createEmptyPhase(1), createEmptyPhase(2)])
      setExpandedPhase(`phase-${Date.now()}-1`)
    }
  }

  const addPhase = () => {
    const newPhase = createEmptyPhase(phases.length + 1)
    onPhasesChange([...phases, newPhase])
    setExpandedPhase(newPhase.id)
  }

  const removePhase = (id: string) => {
    const updated = phases.filter((p) => p.id !== id)
    // Renumber phase names
    const renumbered = updated.map((p, i) => ({
      ...p,
      phaseName: p.phaseName.startsWith("Phase ") ? `Phase ${i + 1}` : p.phaseName,
    }))
    onPhasesChange(renumbered)
    if (expandedPhase === id) setExpandedPhase(null)
    // Clean up errors
    setErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const updatePhase = (id: string, field: keyof TaskPhaseFormData, value: string | number) => {
    onPhasesChange(
      phases.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
    // Clear field error on edit
    setErrors((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev, [id]: { ...prev[id] } }
      delete next[id][field]
      return next
    })
  }

  const validatePhases = (): boolean => {
    const newErrors: Record<string, Record<string, string>> = {}
    let isValid = true
    for (const phase of phases) {
      const errs: Record<string, string> = {}
      if (!phase.phaseName || phase.phaseName.length < 2) {
        errs.phaseName = "Phase name must be at least 2 characters"
        isValid = false
      }
      if (!phase.slots || phase.slots < 1) {
        errs.slots = "At least 1 slot required"
        isValid = false
      }
      if (!phase.instructions || phase.instructions.length < 10) {
        errs.instructions = "Instructions must be at least 10 characters"
        isValid = false
      }
      if (!phase.reward || phase.reward < 0.1) {
        errs.reward = "Minimum reward is A$0.10"
        isValid = false
      }
      if (Object.keys(errs).length > 0) {
        newErrors[phase.id] = errs
      }
    }
    setErrors(newErrors)
    return isValid
  }

  // Expose validate via data attribute for parent form
  // (parent calls this before submitting)
  const totalSlots = phases.reduce((sum, p) => sum + (p.slots || 0), 0)
  const totalReward = phases.reduce((sum, p) => sum + (p.reward || 0), 0)

  return (
    <div className="space-y-4" data-phases-validate={validatePhases}>
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <Label htmlFor="phases-toggle" className="text-sm font-medium">Task Phases</Label>
            <p className="text-xs text-muted-foreground">Break this task into sequential stages</p>
          </div>
        </div>
        <Switch
          id="phases-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {enabled && (
        <div className="space-y-3">
          {/* Summary Bar */}
          {phases.length > 0 && (
            <div className="flex items-center gap-4 rounded-lg border border-border/30 bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                {phases.length} phase{phases.length !== 1 ? "s" : ""}
              </span>
              <span className="text-muted-foreground">
                {totalSlots} total slots
              </span>
              <span className="text-muted-foreground">
                Avg. A${phases.length > 0 ? (totalReward / phases.length).toFixed(2) : "0.00"}/phase
              </span>
            </div>
          )}

          {/* Phase Cards */}
          {phases.map((phase, index) => {
            const phaseErrors = errors[phase.id] || {}
            const isExpanded = expandedPhase === phase.id
            const hasErrors = Object.keys(phaseErrors).length > 0

            return (
              <Collapsible
                key={phase.id}
                open={isExpanded}
                onOpenChange={(open) => setExpandedPhase(open ? phase.id : null)}
              >
                <Card className={cn(
                  "border-border/30 transition-colors",
                  hasErrors && "border-destructive/30",
                  isExpanded && "border-primary/30"
                )}>
                  <CollapsibleTrigger asChild>
                    <div className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/30 transition-colors rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{phase.phaseName || `Phase ${index + 1}`}</span>
                          {!isExpanded && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {phase.slots} slots / A${(phase.reward || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {hasErrors && (
                          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                            Invalid
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {phases.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              removePhase(phase.id)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <ChevronDown className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 border-t border-border/20 px-3 pb-3 pt-3">
                      {/* Phase Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`phase-name-${phase.id}`} className={cn("text-xs", phaseErrors.phaseName && "text-destructive")}>
                          Phase Name
                        </Label>
                        <Input
                          id={`phase-name-${phase.id}`}
                          placeholder={`Phase ${index + 1} — Launch`}
                          value={phase.phaseName}
                          onChange={(e) => updatePhase(phase.id, "phaseName", e.target.value)}
                          className={cn("h-9", phaseErrors.phaseName && "border-destructive")}
                        />
                        {phaseErrors.phaseName && <p className="text-xs text-destructive">{phaseErrors.phaseName}</p>}
                      </div>

                      {/* Slots + Reward */}
                      <div className="grid gap-3 grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`phase-slots-${phase.id}`} className={cn("text-xs", phaseErrors.slots && "text-destructive")}>
                            Slots
                          </Label>
                          <Input
                            id={`phase-slots-${phase.id}`}
                            type="number"
                            min={1}
                            placeholder="50"
                            value={phase.slots || ""}
                            onChange={(e) => updatePhase(phase.id, "slots", e.target.value ? parseInt(e.target.value, 10) : 0)}
                            className={cn("h-9", phaseErrors.slots && "border-destructive")}
                          />
                          {phaseErrors.slots && <p className="text-xs text-destructive">{phaseErrors.slots}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`phase-reward-${phase.id}`} className={cn("text-xs", phaseErrors.reward && "text-destructive")}>
                            Reward (A$)
                          </Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <Input
                              id={`phase-reward-${phase.id}`}
                              type="number"
                              step="0.01"
                              min={0.1}
                              placeholder="5.00"
                              value={phase.reward || ""}
                              onChange={(e) => updatePhase(phase.id, "reward", e.target.value ? parseFloat(e.target.value) : 0)}
                              className={cn("h-9 pl-6", phaseErrors.reward && "border-destructive")}
                            />
                          </div>
                          {phaseErrors.reward && <p className="text-xs text-destructive">{phaseErrors.reward}</p>}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`phase-instructions-${phase.id}`} className={cn("text-xs", phaseErrors.instructions && "text-destructive")}>
                          Instructions
                        </Label>
                        <Textarea
                          id={`phase-instructions-${phase.id}`}
                          placeholder="Phase-specific instructions for workers..."
                          value={phase.instructions}
                          onChange={(e) => updatePhase(phase.id, "instructions", e.target.value)}
                          className={cn("min-h-20 resize-none text-sm", phaseErrors.instructions && "border-destructive")}
                        />
                        {phaseErrors.instructions && <p className="text-xs text-destructive">{phaseErrors.instructions}</p>}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}

          {/* Add Phase Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPhase}
            className="w-full border-dashed h-9"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Phase
          </Button>
        </div>
      )}
    </div>
  )
}
