import { SearchIcon, Link2Icon, ListFilterIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Instant Search",
    description: "Jump to a session by title, topic, or subtopic in one pass.",
    icon: SearchIcon,
  },
  {
    title: "Linked Notes",
    description: "Keep notes, lecture recordings, and sheets connected.",
    icon: Link2Icon,
  },
  {
    title: "Topic Filters",
    description: "Narrow the index quickly without pagination or clutter.",
    icon: ListFilterIcon,
  },
];

export function FeatureStrip() {
  return (
    <section className="py-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {features.map(({ title, description, icon: Icon }) => (
          <Card
            key={title}
            size="sm"
            className="group overflow-hidden rounded-[1.7rem] border border-[#e5ebf8] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.92))] py-0 shadow-[0_14px_48px_rgba(15,23,42,0.05)] transition-[transform,box-shadow,border-color] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#d7e4ff] hover:shadow-[0_24px_80px_rgba(59,130,246,0.08)]"
          >
            <CardHeader className="relative px-5 pt-5">
              <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.18),rgba(255,255,255,0)_72%)] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex size-11 items-center justify-center rounded-[1rem] border border-[#dbe6fb] bg-white shadow-[0_10px_24px_rgba(52,102,214,0.08)] transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]">
                <Icon className="size-4 text-slate-600" />
              </div>
              <CardTitle className="pt-2 text-[1.02rem] text-slate-900">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 text-sm leading-6 text-slate-500">
              {description}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
