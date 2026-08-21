"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { inventoryHref } from "@/lib/inventory/hub";

type Company = { id: string; name: string };

/**
 * Hero control for the Client inventory tab: selected company name as a large
 * title with clear dropdown affordance (chevron) to switch clients.
 * Selection lives in the URL (`?tab=client&companyId=`).
 */
export function ClientCompanyTitleSelect({
  companies,
  selectedId,
}: {
  companies: Company[];
  selectedId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = companies.find((c) => c.id === selectedId);
  const label = selected?.name ?? "Select a client";

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(id: string) {
    setOpen(false);
    if (id === selectedId) return;
    router.push(inventoryHref({ tab: "client", companyId: id }));
  }

  return (
    <div ref={rootRef} className="relative max-w-full">
      <button
        type="button"
        className="group inline-flex max-w-full items-start gap-2 rounded-md text-left -ml-1.5 px-1.5 py-0.5 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={
          selected
            ? `Client company: ${selected.name}. Change client.`
            : "Select a client company"
        }
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={`text-[1.75rem] font-semibold tracking-tight leading-tight sm:text-[2rem] text-balance break-words ${
            selected ? "text-neutral-900" : "text-neutral-400"
          }`}
        >
          {label}
        </span>
        <ChevronDown
          className={`mt-2 h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:text-neutral-600 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Client companies"
          className="absolute left-0 top-full z-50 mt-1 max-h-72 min-w-[14rem] max-w-[min(100vw-2rem,22rem)] overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 shadow-md"
        >
          {companies.map((c) => {
            const active = c.id === selectedId;
            return (
              <li key={c.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                    active
                      ? "font-medium text-neutral-900 bg-neutral-50"
                      : "text-neutral-800"
                  }`}
                  onClick={() => select(c.id)}
                >
                  {c.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
