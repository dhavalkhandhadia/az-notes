import { Badge } from "@/components/ui/badge";

type TopicChipsProps = {
  topics: readonly string[];
};

export function TopicChips({ topics }: TopicChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {topics.map((topic) => (
        <Badge key={topic} variant="outline" className="h-7 px-3 text-xs">
          {topic}
        </Badge>
      ))}
    </div>
  );
}
