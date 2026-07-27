import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { ApplicationDetailScreen } from "@/components/track/ApplicationDetailScreen";

export default async function TrackApplicationPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ journey?: string; step?: string }>;
}) {
  const { journey, step } = await searchParams;
  const stepNumber = step ? Number(step) : Number.NaN;

  return (
    <main className="flex flex-1 flex-col bg-surface">
      <EhakbangHeader backHref="/track" />
      <header className="rounded-b-egov-lg bg-gradient-to-b from-egov-navy to-egov-blue px-5 pb-6 pt-8 text-white">
        <h1 className="text-2xl font-bold">Application Details</h1>
        <p className="mt-1 text-sm text-egov-blue-050">
          Lahat ng detalye ng iyong isinumiteng update sa ahensya.
        </p>
      </header>

      <ApplicationDetailScreen journeyId={journey ?? ""} stepNumber={stepNumber} />
    </main>
  );
}
