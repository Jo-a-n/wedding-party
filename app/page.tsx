import { FallingHeartsBackground } from "./components/falling-hearts-background";
import { RiceCelebrationSection } from "./components/rice-celebration-section";
// import { ThemeToggle } from "./components/theme-toggle";
import { WishWall } from "./components/wish-wall";
import { GallerySection } from "./components/gallery-section";
import { CountdownTimer } from "./components/countdown-timer";
import { AdminPanel } from "./components/admin-panel";
import { AdminFavicon } from "./components/admin-favicon";
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
  large_upload_album_url: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  ceremony_start: "2026-03-21T19:30:00+02:00",
  ceremony_end: "2026-03-21T20:00:00+02:00",
  wish_deadline: "2026-03-22T11:00:00+03:00",
  gallery_deadline: "2026-03-22T11:00:00+03:00",
  large_upload_album_url: "",
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

  return (
    <main
      className={`relative overflow-hidden ${isAdmin ? "ring-4 ring-inset ring-red-500/60" : ""}`}
    >
      {isAdmin && <AdminFavicon />}
      <FallingHeartsBackground />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col items-center py-4">
          <p className="font-arima text-[16px] font-[200] text-jneutral">
            Κωνσταντίνος & Αντωνία-Ντανιέλα
          </p>
          <p className="font-arima text-[16px] font-[200] text-jneutral">
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
            <div className="wiggle font-playpen inline-flex items-center gap-3">
              <span className="inline-flex h-[42px] w-[40px] items-center justify-center bg-[url('/date-blob.svg')] bg-contain bg-center bg-no-repeat">
                <span className="text-[16px] font-[800] tracking-[0.02em] text-dark">
                  21
                </span>
              </span>
              <span className="text-[14px] font-[500] tracking-[0.02em] text-jyellow">
                Μαρτίου 2026
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="font-gb-mama-beba wiggle wiggle-delay-1 wiggle-hover text-[40px] font-[400] text-jneutral">
                Η Ντανιέλα κι ο Κωνσταντίνος {verb}!
              </h1>
              <p className="font-playpen mx-auto max-w-2xl px-12 text-[15px] font-[200] text-jneutral opacity-90">
                Η Ντανιέλα κι ο Κωνσταντίνος {verb}! Οι σκύλοι ακόμα αποφασίζουν
                αν εγκρίνουν. Ρίξτε ρύζι, αφήστε ευχές, βγάλτε φωτογραφίες!
              </p>
            </div>

            <WeddingDogs />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                className="wiggle wiggle-delay-2 wiggle-hover relative flex items-center justify-center px-4 py-2 transition-transform duration-200 hover:-translate-y-0.5"
                href="#wishes"
              >
                <img
                  src="/btn-wish.svg"
                  alt=""
                  className="absolute inset-0 h-full w-full"
                />
                <span className="font-playpen relative text-[17px] font-[500] text-jneutral">
                  Άσε μια ευχή
                </span>
              </a>
              <a
                className="wiggle wiggle-delay-3 wiggle-hover relative flex items-center justify-center px-4 py-2 transition-transform duration-200 hover:-translate-y-0.5"
                href="#gallery"
              >
                <img
                  src="/btn-gallery.svg"
                  alt=""
                  className="absolute inset-0 h-full w-full"
                />
                <span className="font-playpen relative text-[17px] font-[500] text-jneutral">
                  Φωτογραφίες
                </span>
              </a>
            </div>
          </div>
        </section>

        {isAdmin && <AdminPanel settings={settings} />}

        <CountdownTimer settings={settings} />

        <RiceCelebrationSection initialCount={riceTossCount} />

        {/* <section
          id="palette"
          className="pastel-panel rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8"
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
                Color palette
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-jneutral">
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
                    <h3 className="text-lg font-semibold text-jneutral">
                      {color.name}
                    </h3>
                    <p className="text-sm text-ink-soft">{color.hex}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section> */}

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
          largeUploadAlbumUrl={settings.large_upload_album_url}
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
