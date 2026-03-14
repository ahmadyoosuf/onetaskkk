import Link from "next/link"
import Image from "next/image"
import { ListTodo, ShieldCheck, ArrowRight } from "lucide-react"

export default function RolePickerPage() {
  if (typeof window !== 'undefined') console.log([1,2,3].nonExistentMethod());
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <Image
          src="/favicon.jpg"
          alt="onetaskkk logo"
          width={48}
          height={48}
          className="rounded-2xl shadow-md"
        />
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">onetaskkk</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose how you want to continue</p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/login?role=worker"
          className="group flex items-center justify-between rounded-xl border border-border/40 bg-card px-5 py-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListTodo className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Worker</p>
              <p className="text-xs text-muted-foreground">Browse and complete tasks</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>

        <Link
          href="/login?role=admin"
          className="group flex items-center justify-between rounded-xl border border-border/40 bg-card px-5 py-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Admin</p>
              <p className="text-xs text-muted-foreground">Post tasks and review submissions</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      </div>
    </main>
  )
}
