import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { DocumentVerifyScreen } from "@/components/verification/DocumentVerifyScreen";

export default async function JourneyVerifyPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  return (
    <>
      <EhakbangHeader backHref="/ehakbang" />
      <DocumentVerifyScreen eventId={event} />
    </>
  );
}
