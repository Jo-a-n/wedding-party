import type { Wish } from "@/lib/supabase/types";

const ACCENT_COLORS = [
  "bg-mint/30",
  "bg-periwinkle/30",
  "bg-blush/30",
  "bg-apricot/30",
  "bg-pistachio/30",
];

function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days}d ago`;
}

export function WishCard({
  wish,
  index,
  isNew,
}: {
  wish: Wish;
  index: number;
  isNew?: boolean;
}) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <article
      className={`soft-card rounded-[1.5rem] p-5 ${isNew ? "wish-card-enter" : ""}`}
    >
      <div className={`${accent} -mx-5 -mt-5 mb-4 rounded-t-[1.5rem] px-5 py-3`}>
        <p className="text-sm font-semibold text-foreground">{wish.name}</p>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{wish.message}</p>
      <p className="mt-3 text-xs text-ink-soft">{relativeTime(wish.created_at)}</p>
    </article>
  );
}
