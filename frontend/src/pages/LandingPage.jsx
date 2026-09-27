import { Link } from "react-router-dom";
import {
  Navigation,
  ArrowRight,
  FileText,
  Brain,
  ListChecks,
  CalendarDays,
  ShieldCheck,
  Languages,
  Check,
  Upload,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary">
              <Navigation className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-medium text-sm tracking-tight">CampusPilot</span>
          </div>
          <nav className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 md:pt-20 md:pb-14">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4 gap-1.5 text-xs">
            <Sparkles className="size-3" />
            Built For College Students
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance leading-[1.15]">
            Your campus sends the information.
            <br />
            <span className="text-primary">CampusPilot turns it into action.</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
            Upload campus notices, placement updates and important documents. CampusPilot finds what matters, turns it into tasks, prioritizes your next steps and keeps your week organized.
          </p>
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Button size="lg" asChild>
              <Link to="/signup">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/dashboard">See how it works</Link>
            </Button>
          </div>
        </div>

        {/* Dashboard preview — matches the actual app */}
        <div className="mt-10 md:mt-12">
          <DashboardPreview />
        </div>
      </section>

      <Separator />

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-xl font-semibold tracking-tight mb-1">How it works</h2>
        <p className="text-sm text-muted-foreground mb-8">From campus notice to completed task in four steps.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Upload, title: "Upload", desc: "Drop any campus notice, PDF or document." },
            { icon: Brain, title: "Process", desc: "AI extracts tasks, deadlines and eligibility." },
            { icon: ListChecks, title: "Prioritize", desc: "Tasks ranked by urgency and your profile." },
            { icon: CalendarDays, title: "Act", desc: "Your weekly plan, ready to execute." },
          ].map((step, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center size-7 rounded bg-primary/10">
                  <step.icon className="size-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="font-medium text-sm mb-0.5">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Why CampusPilot */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-xl font-semibold tracking-tight mb-1">Why CampusPilot</h2>
        <p className="text-sm text-muted-foreground mb-8">Not a chatbot. A workflow tool built for action.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: ListChecks, title: "Action-oriented", desc: "Every notice becomes a specific task with a deadline — not a summary to read." },
            { icon: ShieldCheck, title: "Source-tracked", desc: "Every task links back to the exact page and section it was extracted from." },
            { icon: Brain, title: "Profile-aware", desc: "Tasks are filtered by your branch, year and CGPA so you only see what applies to you." },
          ].map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-center size-7 rounded bg-primary/10 mb-2.5">
                <item.icon className="size-3.5 text-primary" />
              </div>
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Example workflow */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-xl font-semibold tracking-tight mb-1">Example campus workflow</h2>
        <p className="text-sm text-muted-foreground mb-8">See how a placement notice becomes your next action.</p>
        <div className="rounded-lg border border-border p-5 bg-muted/20">
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            <div className="flex-1 rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Input</span>
              </div>
              <p className="text-sm font-medium">Placement_Schedule_2025-26.pdf</p>
              <p className="text-xs text-muted-foreground mt-0.5">6 pages · Uploaded by you</p>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Search className="size-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Extracted</span>
              </div>
              <p className="text-sm font-medium">Register for ABC Technologies Campus Drive</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px]">Placement</Badge>
                <Badge variant="outline" className="text-[10px] text-critical border-critical/30">High priority</Badge>
                <span className="text-xs text-muted-foreground">Due today, 6:00 PM</span>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 rounded-md border border-success/30 bg-success/5 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Check className="size-3.5 text-success" />
                <span className="text-xs font-medium text-success">Done</span>
              </div>
              <p className="text-sm font-medium">Registration submitted</p>
              <p className="text-xs text-muted-foreground mt-0.5">Resume uploaded · Form completed</p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Trust + Language */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="size-4 text-primary" />
              <h2 className="text-base font-semibold tracking-tight">Source citation</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every task CampusPilot extracts includes a link to the exact page and section of the source document. You can verify any detail with one click — no blind trust required.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Languages className="size-4 text-primary" />
              <h2 className="text-base font-semibold tracking-tight">Local language support</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CampusPilot understands notices in English, Hindi and Kannada. Switch your preferred language and task content adapts — not just navigation labels.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 py-14 pb-20">
        <div className="rounded-lg border border-border bg-muted/20 p-8 md:p-10 text-center">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
            Stop reading notices. Start acting on them.
          </h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Upload your first campus document and see your personalized task list in seconds.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-primary">
              <Navigation className="size-3 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-medium">CampusPilot</span>
          </div>
          <p className="text-xs text-muted-foreground">Demo build — mock data</p>
        </div>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-background">
      {/* Mock top bar */}
      <div className="flex items-center justify-between h-10 px-4 border-b border-border bg-muted/30">
        <span className="text-xs font-medium">Dashboard</span>
        <div className="size-4 rounded-full bg-muted" />
      </div>
      <div className="flex">
        {/* Mock sidebar */}
        <div className="hidden md:flex flex-col w-36 border-r border-border p-1.5 gap-px bg-sidebar">
          {["Dashboard", "Tasks", "This Week", "Documents", "Profile"].map((item, i) => (
            <div key={i} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px]", i === 0 ? "bg-muted font-medium" : "text-muted-foreground")}>
              <div className="size-2.5 rounded bg-muted-foreground/30" />
              {item}
            </div>
          ))}
        </div>
        {/* Mock content */}
        <div className="flex-1 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold">Welcome Back, Alex</p>
            <p className="text-xs text-muted-foreground">Here's what needs your attention.</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-critical font-medium">
              <span className="size-1.5 rounded-full bg-critical" />
              2 urgent
            </span>
            <span className="inline-flex items-center gap-1 text-warning-foreground">
              <span className="size-1.5 rounded-full bg-warning" />
              3 due soon
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
              9 active
            </span>
          </div>
          <div className="rounded-md border border-border overflow-hidden bg-card">
            <div className="flex items-stretch">
              <div className="w-0.5 bg-critical shrink-0" />
              <div className="flex-1 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-muted-foreground">Placement</span>
                  <span className="text-[10px] text-critical font-medium">High</span>
                </div>
                <p className="text-sm font-medium">Register for ABC Technologies Campus Drive</p>
                <p className="text-xs text-critical mt-0.5">6h left</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
