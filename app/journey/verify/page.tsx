import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { DocumentVerifyScreen } from "@/components/verification/DocumentVerifyScreen";

export default async function JourneyVerifyPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  const backHref = event
    ? `/journey/liveness?event=${encodeURIComponent(event)}`
    : "/journey/liveness";
  return (
    <>
      <EhakbangHeader backHref={backHref} />
      <DocumentVerifyScreen eventId={event} />
    </>
  );
}
