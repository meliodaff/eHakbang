export default function JourneyLoading() {
  return (
    <main className="flex flex-1 flex-col gap-3 px-5 py-4">
      <div className="h-24 animate-pulse rounded-egov bg-egov-blue-050" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-egov bg-background" />
      ))}
    </main>
  );
}
