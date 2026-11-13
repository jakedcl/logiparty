"use client";

import { useState, useTransition } from "react";
import { submitMarketingLead } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";

export function LeadForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="m-lead-success" role="status">
        <p className="text-base font-bold text-[var(--m-fg)]">
          Thanks — we got your request.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--m-muted)]">
          We&apos;ll review your details and follow up by email to discuss
          early access.
        </p>
      </div>
    );
  }

  return (
    <div className="m-inquiry">
      <form
        className="m-inquiry-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            try {
              const result = await submitMarketingLead({
                name: String(fd.get("name") ?? ""),
                email: String(fd.get("email") ?? ""),
                company: String(fd.get("company") ?? "") || undefined,
                message: String(fd.get("message") ?? "") || undefined,
              });
              if (result.ok) setDone(true);
              else setError(result.error);
            } catch {
              setError("We couldn’t send your request. Try again or email hello@logiparty.com.");
            }
          });
        }}
      >
        <fieldset className="m-inquiry-fields" disabled={pending}>
          <legend className="mb-5 text-base font-semibold">Tell us about your operation</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-[var(--m-muted)]">Name</span>
              <input
                name="name"
                maxLength={120}
                required
                autoComplete="name"
                className="m-input w-full"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-[var(--m-muted)]">Email</span>
              <input
                name="email"
                maxLength={254}
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
              maxLength={160}
              autoComplete="organization"
              className="m-input w-full"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block text-[var(--m-muted)]">Message</span>
            <textarea
              name="message"
              maxLength={2000}
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
        <Button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm"
        >
          {pending ? "Sending…" : "Request access"}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-[var(--m-muted)]">
          This is an early-access inquiry. No payment details needed.
        </p>
      </form>
    </div>
  );
}
