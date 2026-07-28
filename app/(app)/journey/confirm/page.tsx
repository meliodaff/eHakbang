import { ConfirmLifeEventScreen } from "@/components/journey/ConfirmLifeEventScreen";

export default async function ConfirmLifeEventPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  return <ConfirmLifeEventScreen eventId={event} />;
}
