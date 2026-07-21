import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { LivenessCheckScreen } from "@/components/verification/LivenessCheckScreen";

export default async function JourneyLivenessPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  const backHref = event
    ? `/journey/verify?event=${encodeURIComponent(event)}`
    : "/journey/verify";
  return (
    <>
      <EhakbangHeader backHref={backHref} />
      <LivenessCheckScreen eventId={event} />
    </>
  );
}
