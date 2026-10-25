import { useStore } from "@/lib/store";

export function PartnerMarquee() {
  const companies = useStore((s) => s.companies).filter((c) => c.approved);
  return <section aria-label="Partner companies" className="mt-6">
    <h3 className="mb-3 font-display text-2xl text-muted-foreground">Partner Companies</h3>
    <div className="partner-window -mx-4 overflow-hidden">
      <div className="partner-track flex w-max">
        {[0, 1].map((copy) => <div key={copy} aria-hidden={copy === 1 ? true : undefined} className="flex shrink-0 gap-3 pr-3">
          {companies.map((company) => <div key={company.id} className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-secondary px-3 text-center text-sm font-bold">
            {company.logo ? <img src={company.logo} alt={company.name} loading="lazy" width={100} height={48} className="max-h-12 max-w-full object-contain" /> : company.name}
          </div>)}
        </div>)}
      </div>
    </div>
  </section>;
}