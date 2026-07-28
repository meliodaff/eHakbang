import { DocumentUploadScreen } from "@/components/journey/DocumentUploadScreen";

export default async function DocumentUploadPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  return <DocumentUploadScreen eventId={event} />;
}
