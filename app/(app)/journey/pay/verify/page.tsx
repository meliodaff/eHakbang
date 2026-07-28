import { PayVerifyScreen } from "@/components/journey/PayVerifyScreen";

export default async function PayVerifyPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  return <PayVerifyScreen eventId={event} />;
}
