"use client";

import { useState, useTransition } from "react";
import { submitMarketingLead } from "@/lib/actions/leads";

const TABS = [
  { id: "details", label: "Details", enabled: true },
  { id: "billing", label: "Billing", enabled: false },
  { id: "review", label: "Review", enabled: false },
] as const;

export function LeadForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("details");

  if (done) {
    return (
      <div className="m-lead-success">
        <p className="text-base font-bold text-[var(--m-fg)]">
          Thanks — we got your request.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--m-muted)]">
          Invite-only for now. We&apos;ll follow up by email if there&apos;s a
          fit.
        </p>
      </div>
    );
  }

  return (
    <div className="m-access-dialog">
      <div className="m-access-tabs" role="tablist" aria-label="Access request">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            disabled={!t.enabled}
            className={`m-access-tab${tab === t.id ? " m-access-tab-active" : ""}${!t.enabled ? " m-access-tab-disabled" : ""}`}
            onClick={() => t.enabled && setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form
        className="m-access-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const result = await submitMarketingLead({
              name: String(fd.get("name") ?? ""),
              email: String(fd.get("email") ?? ""),
              company: String(fd.get("company") ?? "") || undefined,
              message: String(fd.get("message") ?? "") || undefined,
            });
            if (result.ok) setDone(true);
            else setError(result.error);
          });
        }}
      >
        <fieldset className="m-access-fieldset">
          <legend className="sr-only">Request details</legend>
          <div className="m-access-barcode" aria-hidden>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="m-access-stamp">INVITE ONLY · LP-ACCESS</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-[var(--m-muted)]">Name</span>
              <input
                name="name"
                required
                autoComplete="name"
                className="m-input w-full"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-[var(--m-muted)]">Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="m-input w-full"
              />
            </label>
          </div>
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block text-[var(--m-muted)]">Company</span>
            <input
              name="company"
              autoComplete="organization"
              className="m-input w-full"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block text-[var(--m-muted)]">Message</span>
            <textarea
              name="message"
              rows={4}
              className="m-input w-full resize-y min-h-[6rem]"
              placeholder="Events, clients, warehouse size — whatever helps us understand fit."
            />
          </label>
        </fieldset>
        {error ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="m-btn-primary inline-flex items-center justify-center px-4 py-2 text-sm disabled:opacity-60"
        >
          {pending ? "Sending…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
