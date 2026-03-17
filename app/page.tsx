import { FallingHeartsBackground } from "./components/falling-hearts-background";
import { RiceCelebrationSection } from "./components/rice-celebration-section";
import { ThemeToggle } from "./components/theme-toggle";
import { WishWall } from "./components/wish-wall";
import { GallerySection } from "./components/gallery-section";
import { createClient } from "@/lib/supabase/server";
import type { Wish, GalleryItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

async function getWishes(): Promise<Wish[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []) as Wish[];
  } catch (e) {
    console.error("Failed to fetch wishes:", e);
    return [];
  }
}

async function getGalleryItems(): Promise<{
  items: GalleryItem[];
  count: number;
}> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("gallery_items")
      .select("*", { count: "exact", head: true });

    const { data } = await supabase
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return {
      items: (data ?? []) as GalleryItem[],
      count: count ?? 0,
    };
  } catch (e) {
    console.error("Failed to fetch gallery items:", e);
    return { items: [], count: 0 };
  }
}

export default async function Home() {
  const [wishes, gallery] = await Promise.all([
    getWishes(),
    getGalleryItems(),
  ]);

  const palette = [
    { name: "Mint", hex: "#99FFDA", className: "bg-mint" },
    { name: "Periwinkle", hex: "#A1A2DF", className: "bg-periwinkle" },
    { name: "Blush", hex: "#F5D0E3", className: "bg-blush" },
    { name: "Apricot", hex: "#FACDAA", className: "bg-apricot" },
    { name: "Pistachio", hex: "#D2FAC3", className: "bg-pistachio" },
  ];

  return (
    <main className="relative overflow-hidden">
      <div className="pastel-sheen absolute inset-0 opacity-80" />
      <FallingHeartsBackground />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
              Wedding Party
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Soft color system for a joyful celebration site
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:py-16">
          <div className="space-y-8">
            <div className="soft-chip inline-flex rounded-full px-4 py-2 text-sm text-ink-soft shadow-sm">
              Pastel foundation: mint, periwinkle, blush, apricot, pistachio
            </div>

            <div className="space-y-5">
              <h1 className=" text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
                A softer, more romantic visual direction for the whole project.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-ink-soft sm:text-xl">
                The app is organized around reusable pastel design tokens so
                future sections, buttons, cards, and accents can stay consistent
                without repeating raw hex values.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                className="hero-accent-button rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                href="#wishes"
              >
                Leave a wish
              </a>
              <a
                className="hero-accent-button rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                href="#gallery"
              >
                Photo album
              </a>
            </div>
          </div>

        </section>

        <RiceCelebrationSection />

        <section
          id="palette"
          className="pastel-panel rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8"
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
                Color palette
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                Pastel tokens ready for reuse
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-ink-soft">
              Each color is defined once in <code>app/globals.css</code> and
              exposed to Tailwind utility classes, so we can style new UI pieces
              consistently from here on out.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {palette.map((color) => (
              <article
                key={color.hex}
                className="soft-card rounded-[1.5rem] p-4"
              >
                <div
                  className={`h-36 rounded-[1.2rem] ${color.className} shadow-[inset_0_-20px_40px_rgba(255,255,255,0.18)]`}
                />
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {color.name}
                    </h3>
                    <p className="text-sm text-ink-soft">{color.hex}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="system"
          className="grid gap-4 py-8 text-sm leading-7 text-ink-soft lg:grid-cols-3"
        >
          <article className="soft-card rounded-[1.75rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">
              Foundations
            </p>
            <p className="mt-3">
              Global CSS now owns the palette, surface colors, text tones,
              borders, and soft shadows.
            </p>
          </article>
          <article className="soft-card rounded-[1.75rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">
              Components
            </p>
            <p className="mt-3">
              Buttons, panels, and color cards use semantic utilities instead of
              ad hoc grayscale classes.
            </p>
          </article>
          <article className="soft-card rounded-[1.75rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">
              Direction
            </p>
            <p className="mt-3">
              The project now has a clear visual base for invitation pages,
              schedules, RSVPs, and guest details.
            </p>
          </article>
        </section>

        <WishWall initialWishes={wishes} />

        <GallerySection
          initialItems={gallery.items}
          initialCount={gallery.count}
        />
      </div>
    </main>
  );
}
