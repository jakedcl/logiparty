"use client";

import { useState, useTransition } from "react";
import { submitMarketingLead } from "@/lib/actions/leads";

export function LeadForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="m-lead-success border border-[var(--m-line)] bg-[var(--m-panel)] p-6 sm:p-8">
        <p className="text-lg font-medium text-[var(--m-fg)]">
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
    <form
      className="space-y-4"
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
      <label className="block text-sm">
        <span className="mb-1.5 block text-[var(--m-muted)]">Company</span>
        <input
          name="company"
          autoComplete="organization"
          className="m-input w-full"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block text-[var(--m-muted)]">Message</span>
        <textarea
          name="message"
          rows={4}
          className="m-input w-full resize-y min-h-[6rem]"
          placeholder="Events, clients, warehouse size — whatever helps us understand fit."
        />
      </label>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="m-btn-primary inline-flex items-center justify-center px-6 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request access"}
      </button>
    </form>
  );
}
