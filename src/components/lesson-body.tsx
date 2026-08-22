import { MathExplanation, MathLine } from "@/components/practice/math-text";
import type { LessonBlock } from "@/lib/lessons";

/** Shared renderer used by the preview and the student lesson page. */
export function LessonBody({ blocks }: { blocks: LessonBlock[] }) {
  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>;
  }
  return (
    <div className="space-y-8">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <div key={i} className="space-y-3">
              <h2 className="font-display text-xl font-bold text-foreground">{block.value}</h2>
              <div className="h-px w-full bg-border" />
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc space-y-2 pl-6 text-[15px] leading-7 text-foreground">
              {block.value
                .split("\n")
                .filter((l) => l.trim())
                .map((item, li) => (
                  <li key={li}>
                    <MathLine line={item} index={li} />
                  </li>
                ))}
            </ul>
          );
        }
        if (block.type === "math") {
          return (
            <div key={i} className="text-[17px]">
              <MathExplanation lines={block.value.split("\n").filter((l) => l.trim())} />
            </div>
          );
        }
        return (
          <div key={i} className="space-y-3 text-[15px] leading-7 text-foreground">
            <MathExplanation lines={block.value.split("\n").filter((l) => l.trim())} />
          </div>
        );
      })}
    </div>
  );
}
