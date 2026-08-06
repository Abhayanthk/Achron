import type { CoachingReport } from "@/lib/cp-trainer/agent";
import {
  Clock,
  AlertTriangle,
  Target,
  Dumbbell,
  Flag,
  Lightbulb,
} from "lucide-react";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-300 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black/20 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

export function CoachReport({ report }: { report: CoachingReport }) {
  const tw = report.timeWasted;

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5">
        <h2 className="text-lg font-bold leading-snug text-white">
          {report.headline}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Time wasted */}
        <Section icon={<Clock className="h-4 w-4" />} title="Time Wasted">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {tw.totalWastedMinutes}
            </span>
            <span className="text-sm text-zinc-400">minutes</span>
          </div>
          <p className="mb-3 text-sm text-zinc-300">{tw.summary}</p>
          {tw.breakdown.length > 0 && (
            <ul className="space-y-2">
              {tw.breakdown.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 border-t border-zinc-800 pt-2 text-sm"
                >
                  <span className="text-zinc-200">{b.problemName}</span>
                  <span className="shrink-0 text-right text-zinc-400">
                    <span className="font-semibold text-amber-300">
                      {b.wastedMinutes}m
                    </span>
                    <span className="ml-2 text-xs">{b.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Weaknesses */}
        <Section
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Weaknesses"
        >
          {report.weaknesses.length === 0 ? (
            <p className="text-sm text-zinc-400">No weaknesses flagged.</p>
          ) : (
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{w.area}</p>
                    <p className="text-xs text-zinc-400">{w.evidence}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      SEVERITY_STYLES[w.severity] ?? SEVERITY_STYLES.low
                    }`}
                  >
                    {w.severity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Root causes */}
      <Section icon={<Lightbulb className="h-4 w-4" />} title="Root Causes">
        <p className="text-sm leading-relaxed text-zinc-300">
          {report.rootCauses}
        </p>
      </Section>

      {/* Action plan */}
      <Section icon={<Target className="h-4 w-4" />} title="Action Plan">
        <ol className="space-y-3">
          {report.actionPlan.map((a, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{a.step}</p>
                <p className="text-xs text-zinc-400">
                  <span className="text-zinc-500">Why:</span> {a.why}
                </p>
                <p className="text-xs text-zinc-300">
                  <span className="text-zinc-500">How:</span> {a.how}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Drills */}
        <Section icon={<Dumbbell className="h-4 w-4" />} title="Drills">
          {report.drills.length === 0 ? (
            <p className="text-sm text-zinc-400">No drills suggested.</p>
          ) : (
            <ul className="space-y-2">
              {report.drills.map((d, i) => (
                <li key={i} className="border-t border-zinc-800 pt-2 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-100">
                      {d.topic}
                    </span>
                    <span className="text-xs text-indigo-300">
                      ~{d.targetRating}
                    </span>
                  </div>
                  {d.examples.length > 0 && (
                    <p className="text-xs text-zinc-400">
                      e.g. {d.examples.join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Next contest strategy */}
        <Section icon={<Flag className="h-4 w-4" />} title="Next Contest Strategy">
          <p className="text-sm leading-relaxed text-zinc-300">
            {report.nextContestStrategy}
          </p>
        </Section>
      </div>
    </div>
  );
}
