import { DocumentUploadScreen } from "@/components/journey/DocumentUploadScreen";

export default async function DocumentUploadPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string; target?: string; title?: string; description?: string }>;
}) {
  const { event, target, title, description } = await searchParams;
  return (
    <DocumentUploadScreen eventId={event} target={target} title={title} description={description} />
  );
}
