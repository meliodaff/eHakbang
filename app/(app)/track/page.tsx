import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { TrackTabs } from "@/components/track/TrackTabs";

export default async function TrackPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ journey?: string; from?: string }>;
}) {
  const { journey, from } = await searchParams;
  // "View Track" from My Journeys carries from=journeys so back returns
  // there instead of the dashboard; every other entry point (dashboard
  // banners, bottom nav) keeps the dashboard as the default back target.
  const backHref = from === "journeys" ? "/journeys" : "/ehakbang";

  return (
    <main className="flex flex-1 flex-col bg-surface">
      <EhakbangHeader backHref={backHref} />
      <header className="rounded-b-egov-lg bg-gradient-to-b from-egov-navy to-egov-blue px-5 pb-6 pt-8 text-white">
        <h1 className="text-2xl font-bold">Track Applications</h1>
        <p className="mt-1 text-sm text-egov-blue-050">
          Tingnan ang mga isinumite mong update habang hinihintay ang tugon ng
          mga ahensya.
        </p>
      </header>

      <TrackTabs journeyId={journey} />
    </main>
  );
}
