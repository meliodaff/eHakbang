import { EhakbangHeader } from "@/components/layout/EhakbangHeader";

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col bg-surface">
      <EhakbangHeader />
      <div className="flex flex-1 flex-col gap-4 px-6 py-8">
        <h1 className="text-2xl font-bold text-egov-navy">About eHakbang</h1>
        <p className="text-muted">
          eHakbang is an AI-powered government journey planner for Filipino
          citizens. After a major life event, it gives you an ordered, personalized
          checklist of government steps — each with the reason, the documents you
          need, and a link to the official service.
        </p>
        <p className="rounded-egov bg-egov-blue-050 px-4 py-3 text-sm text-egov-blue-dark">
          Walang personal na impormasyon ang kinokolekta. No personal information
          is collected.
        </p>
      </div>
    </main>
  );
}
