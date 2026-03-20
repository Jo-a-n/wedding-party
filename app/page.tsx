import { FallingHeartsBackground } from "./components/falling-hearts-background";
import { RiceCelebrationSection } from "./components/rice-celebration-section";
// import { ThemeToggle } from "./components/theme-toggle";
import { WishWall } from "./components/wish-wall";
import { GallerySection } from "./components/gallery-section";
import { CountdownTimer } from "./components/countdown-timer";
import { AdminPanel } from "./components/admin-panel";
import { WeddingDogs } from "./components/wedding-dogs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/admin";
import type { Wish, GalleryItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export type SiteSettings = {
  ceremony_start: string;
  ceremony_end: string;
  wish_deadline: string;
  gallery_deadline: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  ceremony_start: "2026-03-21T19:30:00+02:00",
  ceremony_end: "2026-03-21T20:00:00+02:00",
  wish_deadline: "2026-03-22T11:00:00+03:00",
  gallery_deadline: "2026-03-22T11:00:00+03:00",
};

async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("site_settings").select("*");
    const settings = { ...DEFAULT_SETTINGS };
    for (const row of data ?? []) {
      if (row.key in settings) {
        settings[row.key as keyof SiteSettings] = row.value;
      }
    }
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function getWishes(isAdmin: boolean): Promise<Wish[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!isAdmin) {
      query = query.eq("hidden", false);
    }

    const { data } = await query;
    return (data ?? []) as Wish[];
  } catch (e) {
    console.error("Failed to fetch wishes:", e);
    return [];
  }
}

async function getGalleryItems(isAdmin: boolean): Promise<{
  items: GalleryItem[];
  count: number;
}> {
  try {
    const supabase = await createClient();

    let countQuery = supabase
      .from("gallery_items")
      .select("*", { count: "exact", head: true });
    if (!isAdmin) {
      countQuery = countQuery.eq("hidden", false);
    }
    const { count } = await countQuery;

    let query = supabase
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!isAdmin) {
      query = query.eq("hidden", false);
    }
    const { data } = await query;

    return {
      items: (data ?? []) as GalleryItem[],
      count: count ?? 0,
    };
  } catch (e) {
    console.error("Failed to fetch gallery items:", e);
    return { items: [], count: 0 };
  }
}

async function getRiceTossCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("rice_tosses")
      .select("*", { count: "exact", head: true });

    return count ?? 0;
  } catch (e) {
    console.error("Failed to fetch rice toss count:", e);
    return 0;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isAdmin = params?.admin === "banana";

  const [wishes, gallery, riceTossCount, settings] = await Promise.all([
    getWishes(isAdmin),
    getGalleryItems(isAdmin),
    getRiceTossCount(),
    getSiteSettings(),
  ]);

  const now = new Date();
  const ceremonyStart = new Date(settings.ceremony_start);
  const ceremonyEnd = new Date(settings.ceremony_end);
  const verb =
    now < ceremonyStart
      ? "θα παντρευτούν"
      : now <= ceremonyEnd
        ? "παντρεύονται"
        : "παντρεύτηκαν";

  const palette = [
    { name: "Pink", hex: "#E789FA", className: "bg-pink" },
    { name: "Purple", hex: "#9946F7", className: "bg-purple" },
    { name: "Blue", hex: "#1DD0F0", className: "bg-blue" },
    { name: "Yellow", hex: "#FFD412", className: "bg-yellow" },
    { name: "Green", hex: "#1EF79A", className: "bg-green" },
    { name: "Neutral", hex: "#F2EAD5", className: "bg-neutral" },
    { name: "Black", hex: "#000000", className: "bg-dark" },
  ];

  return (
    <main
      className={`relative overflow-hidden ${isAdmin ? "ring-4 ring-inset ring-red-500/60" : ""}`}
    >
      <FallingHeartsBackground />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col items-center py-4">
          <p className="font-arima text-[14px] font-[300] text-jneutral">
            Κωνσταντίνος & Αντωνία-Ντανιέλα
          </p>
          <p className="font-arima text-[14px] font-[300] text-jneutral">
            Σάββατο, 21 Μαρτίου 2026
          </p>
          <div className="mt-3 flex items-center gap-3">
            {isAdmin && (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-500">
                Admin
              </span>
            )}
            {/* <ThemeToggle /> */}
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:py-16">
          <div className="space-y-8 text-center">
            <div className="wiggle soft-chip inline-flex rounded-full px-4 py-2 text-sm text-ink-soft shadow-sm">
              Σάββατο, 21 Μαρτίου 2026
            </div>

            <div className="space-y-5">
              <h1 className="font-gb-mama-beba wiggle wiggle-delay-1 wiggle-hover text-5xl text-pink sm:text-6xl lg:text-7xl">
                Η Ντανιέλα κι ο Κωνσταντίνος {verb}!
              </h1>
              <p className="font-playpen mx-auto max-w-2xl text-lg leading-8 text-neutral sm:text-xl">
                Η Ντανιέλα κι ο Κωνσταντίνος {verb} — οι σκύλοι ακόμα
                αποφασίζουν αν εγκρίνουν. Ρίξτε ρύζι, αφήστε ευχές, βγάλτε
                φωτογραφίες!
              </p>
            </div>

            <WeddingDogs />

            <div className="flex flex-wrap justify-center gap-4">
              <a
                className="wiggle wiggle-delay-2 wiggle-hover hero-accent-button rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                href="#wishes"
              >
                Άσε μια ευχή
              </a>
              <a
                className="wiggle wiggle-delay-3 wiggle-hover hero-accent-button rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                href="#gallery"
              >
                Φωτογραφίες
              </a>
            </div>
          </div>
        </section>

        {isAdmin && <AdminPanel settings={settings} />}

        <CountdownTimer settings={settings} />

        <RiceCelebrationSection initialCount={riceTossCount} />

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

        <WishWall
          initialWishes={wishes}
          isAdmin={isAdmin}
          deadline={settings.wish_deadline}
        />

        <GallerySection
          initialItems={gallery.items}
          initialCount={gallery.count}
          isAdmin={isAdmin}
          deadline={settings.gallery_deadline}
        />

        <footer className="py-10 text-center">
          <p className="text-sm italic text-ink-soft/60">
            Φτιαγμένο με <span className="not-italic text-lg">❤️🌈🦄🐘</span>
            <br /> Ιωάννα, Παύλος
          </p>
        </footer>
      </div>
    </main>
  );
}
