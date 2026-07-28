import { JourneyCompleteScreen } from "@/components/archive/JourneyCompleteScreen";

export default async function JourneyCompletePage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ id?: string; mode?: string }>;
}) {
  const { id, mode } = await searchParams;
  return <JourneyCompleteScreen id={id} mode={mode} />;
}
