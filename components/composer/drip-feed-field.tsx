"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Timer } from "lucide-react"
import { cn } from "@/lib/utils"

type DripFeedFieldProps = {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  dripAmount: number
  onDripAmountChange: (amount: number) => void
  dripInterval: number
  onDripIntervalChange: (interval: number) => void
}

const INTERVAL_PRESETS = [
  { value: "1", label: "Every 1 hour" },
  { value: "6", label: "Every 6 hours" },
  { value: "12", label: "Every 12 hours" },
  { value: "24", label: "Every 24 hours" },
  { value: "48", label: "Every 2 days" },
  { value: "custom", label: "Custom" },
]

export function DripFeedField({
  enabled,
  onEnabledChange,
  dripAmount,
  onDripAmountChange,
  dripInterval,
  onDripIntervalChange,
}: DripFeedFieldProps) {
  const isCustomInterval = !INTERVAL_PRESETS.some(
    (p) => p.value !== "custom" && parseFloat(p.value) === dripInterval
  )

  return (
    <div className="space-y-4">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <Label htmlFor="drip-feed-toggle" className="text-sm font-medium">Drip Feed</Label>
            <p className="text-xs text-muted-foreground">Release slots in controlled batches</p>
          </div>
        </div>
        <Switch
          id="drip-feed-toggle"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <div className="space-y-4 rounded-lg border border-border/30 bg-muted/20 p-3">
          {/* Drip Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="drip-amount" className="text-xs">
              Slots per release
            </Label>
            <Input
              id="drip-amount"
              type="number"
              min={1}
              max={10000}
              placeholder="5"
              value={dripAmount || ""}
              onChange={(e) => onDripAmountChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
              className="h-9"
            />
            <p className="text-[11px] text-muted-foreground">
              How many slots to release each interval
            </p>
          </div>

          {/* Drip Interval */}
          <div className="space-y-1.5">
            <Label className="text-xs">Release interval</Label>
            <Select
              value={isCustomInterval ? "custom" : String(dripInterval)}
              onValueChange={(v) => {
                if (v !== "custom") {
                  onDripIntervalChange(parseFloat(v))
                }
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCustomInterval && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0.5}
                  max={168}
                  step={0.5}
                  placeholder="6"
                  value={dripInterval || ""}
                  onChange={(e) => onDripIntervalChange(e.target.value ? parseFloat(e.target.value) : 0)}
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">hours</span>
              </div>
            )}
          </div>

          {/* Preview */}
          {dripAmount > 0 && dripInterval > 0 && (
            <div className="rounded-lg border border-border/20 bg-background p-2.5 text-xs text-muted-foreground">
              <p>
                Releases <span className="font-medium text-foreground">{dripAmount}</span> slot{dripAmount !== 1 ? "s" : ""}{" "}
                every <span className="font-medium text-foreground">
                  {dripInterval >= 24 ? `${(dripInterval / 24).toFixed(dripInterval % 24 === 0 ? 0 : 1)} day${dripInterval >= 48 ? "s" : ""}` : `${dripInterval}h`}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
