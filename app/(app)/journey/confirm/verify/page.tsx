import { FaceVerifyScreen } from "@/components/journey/FaceVerifyScreen";

export default async function FaceVerifyPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string; target?: string; title?: string; description?: string }>;
}) {
  const { event, target, title, description } = await searchParams;
  return <FaceVerifyScreen eventId={event} target={target} title={title} description={description} />;
}
