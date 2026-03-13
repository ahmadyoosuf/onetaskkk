"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Layers,
  Palette,
  Type,
  Square,
  Zap,
  Bell,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  ChevronRight,
  Radar,
  Mail,
  Crosshair,
  History,
  Search,
  Download,
  Play,
  Loader2,
} from "lucide-react"

/* ─── Section heading ────────────────────────────────────────── */
function SectionHeading({ icon: Icon, title, subtitle }: { icon: typeof Layers; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ─── Color swatch ───────────────────────────────────────────── */
function Swatch({ label, className, textClass }: { label: string; className: string; textClass?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`h-12 w-12 rounded-lg border border-border/30 ${className}`} />
      <span className={`font-mono text-[10px] ${textClass ?? "text-muted-foreground"}`}>{label}</span>
    </div>
  )
}

/* ─── Severity badge row ─────────────────────────────────────── */
const severityConfig = {
  critical: "bg-severity-critical text-white border-0",
  high:     "bg-severity-high/80 text-white border-0",
  medium:   "bg-severity-medium text-warning-foreground border-0",
  low:      "bg-severity-low text-warning-foreground border-0",
  info:     "bg-info text-info-foreground border-0",
}

/* ─── Main component ─────────────────────────────────────────── */
export function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState("colors")
  const [inputVal, setInputVal] = useState("")

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky glass header ── */}
      <header className="sticky top-0 z-40 border-b border-border/30 glass">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            <span className="text-primary">◆</span> Yoke
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/15 text-success border-success/30 text-[10px] font-semibold">
              Design System
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
              v1.0
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-12">

        {/* ── Hero / Intro ── */}
        <div className="space-y-2 animate-fade-in-up">
          <h2 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            Yoke Design System
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            Adapted from SecDash. Space Grotesk for UI copy, IBM Plex Mono for data and code.
            Every token, pattern, and animation documented below.
          </p>
        </div>

        {/* ── Main tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-card border border-border/30 h-auto p-1">
            {[
              { value: "colors",     icon: Palette,  label: "Colors"     },
              { value: "typography", icon: Type,      label: "Type"       },
              { value: "components", icon: Square,    label: "Components" },
              { value: "patterns",   icon: Layers,    label: "Patterns"   },
              { value: "motion",     icon: Zap,       label: "Motion"     },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Colors ── */}
          <TabsContent value="colors" className="mt-6 space-y-8">
            <SectionHeading icon={Palette} title="Color Tokens" subtitle="HSL-based tokens; every value derived from --primary" />

            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Brand Scale</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-6">
                <Swatch label="primary"    className="bg-primary" />
                <Swatch label="primary/20" className="bg-primary/20" />
                <Swatch label="primary/10" className="bg-primary/10" />
                <Swatch label="accent"     className="bg-accent" />
                <Swatch label="secondary"  className="bg-secondary" />
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Semantic Colors</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-6">
                <Swatch label="success"     className="bg-success" />
                <Swatch label="warning"     className="bg-warning" />
                <Swatch label="info"        className="bg-info" />
                <Swatch label="destructive" className="bg-destructive" />
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Severity Scale</CardTitle>
                <CardDescription>Used for vulnerability / priority states</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-6">
                <Swatch label="critical" className="bg-severity-critical" />
                <Swatch label="high"     className="bg-severity-high" />
                <Swatch label="medium"   className="bg-severity-medium" />
                <Swatch label="low"      className="bg-severity-low" />
                <Swatch label="sev-info" className="bg-severity-info" />
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Surface & Chrome</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-6">
                <Swatch label="background"    className="bg-background border border-border/40" />
                <Swatch label="card"          className="bg-card border border-border/40" />
                <Swatch label="muted"         className="bg-muted" />
                <Swatch label="border"        className="bg-border" />
                <Swatch label="foreground"    className="bg-foreground" />
                <Swatch label="muted-fg"      className="bg-muted-foreground" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Typography ── */}
          <TabsContent value="typography" className="mt-6 space-y-6">
            <SectionHeading icon={Type} title="Typography Scale" subtitle="Space Grotesk + IBM Plex Mono" />

            <Card className="border-border/30 bg-card">
              <CardContent className="pt-6 space-y-5">
                <div className="border-b border-border/20 pb-5">
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Display / 3xl bold</p>
                  <p className="text-3xl font-bold text-foreground leading-tight text-balance">
                    Build something worth doing
                  </p>
                </div>
                <div className="border-b border-border/20 pb-5">
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Heading / 2xl semibold</p>
                  <p className="text-2xl font-semibold text-foreground">Task Marketplace Platform</p>
                </div>
                <div className="border-b border-border/20 pb-5">
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Title / xl semibold</p>
                  <p className="text-xl font-semibold text-foreground">Post tasks, find work, get paid</p>
                </div>
                <div className="border-b border-border/20 pb-5">
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Body / base</p>
                  <p className="text-base leading-relaxed text-foreground">
                    Yoke connects task posters with skilled finders. Browse the feed, pick up work,
                    submit deliverables — all from one clean interface.
                  </p>
                </div>
                <div className="border-b border-border/20 pb-5">
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Small / sm muted</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Deadline: Apr 30 · Budget: $500 · 3 submissions
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Mono / IBM Plex Mono</p>
                  <p className="font-mono text-sm text-foreground">
                    task-id: <span className="text-primary">tsk_j9x2k_01HQ</span> · status: <span className="text-success">open</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Components ── */}
          <TabsContent value="components" className="mt-6 space-y-8">
            <SectionHeading icon={Square} title="UI Components" subtitle="All from the same visual family" />

            {/* Buttons */}
            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Buttons</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
                <Button size="sm" className="gap-2"><Play className="h-3.5 w-3.5" /> Scan</Button>
                <Button size="sm" variant="outline" className="gap-2"><Download className="h-3.5 w-3.5" /> Export</Button>
                <Button size="sm" disabled className="gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning...
                </Button>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Badges — Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-success/15 text-success border-success/30">completed</Badge>
                <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">pending</Badge>
                <Badge variant="outline" className="bg-info/15 text-info border-info/30">running</Badge>
                <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">failed</Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">open</Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border/40">closed</Badge>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Badges — Severity</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {(Object.entries(severityConfig) as [string, string][]).map(([level, cls]) => (
                  <Badge key={level} className={`uppercase text-[10px] tracking-wider font-bold ${cls}`}>
                    {level}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            {/* Inputs */}
            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-w-md">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter a target URL or keyword…"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="bg-card border-border/30 font-mono text-sm"
                  />
                  <Button className="shrink-0 gap-2">
                    <Search className="h-4 w-4" /> Search
                  </Button>
                </div>
                <Input placeholder="Disabled input" disabled className="bg-card border-border/30" />
              </CardContent>
            </Card>

            {/* Icon containers */}
            <Card className="border-border/30 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Icon Containers</CardTitle>
                <CardDescription>Consistent icon framing — h-10 w-10 rounded-lg bg-primary/10</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {[
                  { icon: Radar,    label: "Port Scan",   color: "bg-primary/10 text-primary"     },
                  { icon: Mail,     label: "HIBP",        color: "bg-info/10 text-info"            },
                  { icon: Crosshair,label: "Nuclei",      color: "bg-destructive/10 text-destructive"},
                  { icon: History,  label: "History",     color: "bg-muted text-muted-foreground"  },
                  { icon: Shield,   label: "Secure",      color: "bg-success/10 text-success"      },
                  { icon: Bell,     label: "Alerts",      color: "bg-warning/10 text-warning"      },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Patterns ── */}
          <TabsContent value="patterns" className="mt-6 space-y-8">
            <SectionHeading icon={Layers} title="Compositional Patterns" subtitle="Card, list-item, and status-row patterns" />

            {/* History list-item */}
            <div className="space-y-2">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">History list-item</p>
              {[
                { icon: Radar,     label: "Port Scan",  target: "scanme.nmap.org",        status: "completed", summary: "3 open ports out of 17 scanned." },
                { icon: Mail,      label: "HIBP Check", target: "user@example.com",       status: "failed",    summary: "Scan failed: connection timeout" },
                { icon: Crosshair, label: "Nuclei Scan",target: "http://testphp.vulnweb.com", status: "running", summary: "12 findings so far…" },
              ].map(({ icon: Icon, label, target, status, summary }, i) => (
                <button
                  key={i}
                  className="animate-fade-in-up w-full text-left flex items-start gap-4 rounded-lg border border-border/20 bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                      <Badge variant="outline" className={
                        status === "completed" ? "bg-success/15 text-success border-success/30 text-[10px]" :
                        status === "failed"    ? "bg-destructive/15 text-destructive border-destructive/30 text-[10px]" :
                        "bg-warning/15 text-warning border-warning/30 text-[10px]"
                      }>
                        {status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground truncate">{target}</p>
                    <p className="mt-1 text-xs text-muted-foreground/80">{summary}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 mt-3 transition-colors" />
                </button>
              ))}
            </div>

            {/* Semantic result cards */}
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Semantic result cards</p>
              <Card className="animate-fade-in-up border-destructive/40 bg-destructive/10">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" /> SQL Injection Detected
                    </CardTitle>
                    <Badge className="bg-destructive text-destructive-foreground border-0 uppercase text-[10px] tracking-wider font-bold shrink-0">critical</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Unsanitized user input passed directly to SQL query on <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">/api/search</code>.</p>
                </CardContent>
              </Card>
              <Card className="animate-fade-in-up border-warning/40 bg-warning/10" style={{ animationDelay: "60ms" }}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base text-warning flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Outdated TLS Version
                    </CardTitle>
                    <Badge className="bg-severity-medium text-warning-foreground border-0 uppercase text-[10px] tracking-wider font-bold shrink-0">medium</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Server accepts TLS 1.0 connections which have known vulnerabilities.</p>
                </CardContent>
              </Card>
              <Card className="animate-fade-in-up border-success/40 bg-success/10" style={{ animationDelay: "120ms" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" /> No breaches found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-success/80">This email address was not found in any known data breaches. Stay safe!</p>
                </CardContent>
              </Card>
              <Card className="animate-fade-in-up border-info/40 bg-info/10" style={{ animationDelay: "180ms" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-info flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" /> HTTP Security Headers Missing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">X-Frame-Options and Content-Security-Policy headers are absent.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Motion ── */}
          <TabsContent value="motion" className="mt-6 space-y-8">
            <SectionHeading icon={Zap} title="Animation Tokens" subtitle="fadeInUp · breathe · Tailwind transitions" />

            <Card className="border-border/30 bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">animate-fade-in-up</CardTitle>
                <CardDescription>Staggered list entrance — each item offset by 60ms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {["First card — 0ms delay", "Second card — 60ms delay", "Third card — 120ms delay"].map((text, i) => (
                  <div
                    key={i}
                    className="animate-fade-in-up rounded-md border border-border/20 bg-muted/40 px-4 py-3 text-sm text-foreground"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {text}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">animate-breathe</CardTitle>
                <CardDescription>Live scan pulse indicator</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4 py-4">
                <span className="inline-block h-3 w-3 rounded-full bg-primary animate-breathe" />
                <span className="text-sm text-muted-foreground">
                  Scanning <strong className="text-foreground font-mono">http://testphp.vulnweb.com</strong> — 42s elapsed
                </span>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Hover transitions</CardTitle>
                <CardDescription>All interactive elements use transition-colors or transition-all</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <div className="rounded-lg border border-border/20 bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer text-sm text-muted-foreground">
                  hover:bg-accent/50
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 hover:bg-primary/15 transition-colors cursor-pointer text-sm text-primary">
                  hover:bg-primary/15
                </div>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 hover:bg-destructive/15 transition-colors cursor-pointer text-sm text-destructive">
                  hover:bg-destructive/15
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Glass effect</CardTitle>
                <CardDescription className="font-mono text-xs">.glass — backdrop-filter: blur(12px)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-lg overflow-hidden h-24">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-info/20 to-success/20" />
                  <div className="absolute inset-4 glass rounded-md border border-border/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-foreground">Glassmorphism surface</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Footer ── */}
        <footer className="border-t border-border/20 pt-6 pb-8 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-bold">◆ Yoke</span> design system — adapted from SecDash
          </p>
          <p className="font-mono text-xs text-muted-foreground">Space Grotesk · IBM Plex Mono</p>
        </footer>

      </main>
    </div>
  )
}
