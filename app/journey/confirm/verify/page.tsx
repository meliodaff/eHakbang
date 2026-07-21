import { FaceVerifyScreen } from "@/components/journey/FaceVerifyScreen";

export default async function FaceVerifyPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  return <FaceVerifyScreen eventId={event} />;
}
