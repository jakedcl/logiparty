const FAQ = [
  {
    q: "Is there a self-serve signup?",
    a: "No. Logiparty is invite-only during early access. Request access on the homepage or email hello@logiparty.com. We onboard each 3PL with roles, catalogs, and branding before go-live.",
  },
  {
    q: "Do my clients see Logiparty?",
    a: "No. Staff and clients work on your subdomain with your logo and color. Logiparty appears only on the public marketing site and the apex sign-in page where you enter your org slug.",
  },
  {
    q: "How does pricing work?",
    a: "We quote per organization based on team size, job volume, and portal needs. There is no public checkout. Stripe billing is wired in the codebase and enabled when your contract is in place.",
  },
  {
    q: "What happens on a live job?",
    a: "When a job moves to upcoming or ready, assigned client inventory and fleet lock to that job until load-out ends. Loaded quantities stay on the run sheet.",
  },
  {
    q: "Can I try it without an account?",
    a: "Yes. The /demo tour walks through jobs, inventory, fleet, crew, notifications, and the client portal with sample Northline Logistics data — no login.",
  },
] as const;

export function MarketingFaq() {
  return (
    <section id="faq" className="m-panel m-rise p-5 sm:p-6">
      <h2 className="m-section-title">FAQ</h2>
      <dl className="mt-5 divide-y divide-[var(--m-line)]">
        {FAQ.map((item) => (
          <div key={item.q} className="py-4 first:pt-0 last:pb-0">
            <dt className="text-sm font-semibold text-[var(--m-fg)]">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-[var(--m-muted)]">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
