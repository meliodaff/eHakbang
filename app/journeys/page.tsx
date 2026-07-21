import { JourneysList } from "@/components/archive/JourneysList";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";

export default function JourneysPage() {
  return (
    <main className="flex flex-1 flex-col bg-surface">
      <EhakbangHeader />
      <header className="rounded-b-egov-lg bg-gradient-to-b from-egov-navy to-egov-blue px-5 pb-6 pt-8 text-white">
        <h1 className="text-2xl font-bold">My Journeys</h1>
        <p className="mt-1 text-sm text-egov-blue-050">
          Ipagpatuloy ang mga nasimulan mo, o tingnan ang mga natapos.
        </p>
      </header>

      <JourneysList />
    </main>
  );
}
