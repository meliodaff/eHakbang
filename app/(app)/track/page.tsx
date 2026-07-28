import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { TrackScreen } from "@/components/track/TrackScreen";

export default function TrackPage() {
  return (
    <main className="flex flex-1 flex-col bg-surface">
      <EhakbangHeader backHref="/ehakbang" />
      <header className="rounded-b-egov-lg bg-gradient-to-b from-egov-navy to-egov-blue px-5 pb-6 pt-8 text-white">
        <h1 className="text-2xl font-bold">Track Applications</h1>
        <p className="mt-1 text-sm text-egov-blue-050">
          Tingnan ang mga isinumite mong update habang hinihintay ang tugon ng
          mga ahensya.
        </p>
      </header>

      <TrackScreen />
    </main>
  );
}
