import { JourneyScreen } from "@/components/journey/JourneyScreen";

export default async function JourneyPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  return <JourneyScreen eventId={event} />;
}
