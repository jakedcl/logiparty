/**
 * Destructive action tucked behind a ⋯ control so list rows stay dense.
 * Uses native <details> — no extra client JS.
 */
export function QuietRemove({
  children,
  label = "Remove",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <details className="relative group/qr">
      <summary
        className="list-none cursor-pointer select-none rounded px-1.5 py-0.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 [&::-webkit-details-marker]:hidden"
        aria-label="More actions"
      >
        <span aria-hidden className="text-base leading-none tracking-tighter">
          ⋯
        </span>
      </summary>
      <div className="absolute right-0 top-full z-20 mt-1 min-w-[7.5rem] rounded-md border border-neutral-200 bg-white py-1 shadow-sm">
        <div className="px-1 [&_button]:block [&_button]:w-full [&_button]:rounded [&_button]:px-2.5 [&_button]:py-1.5 [&_button]:text-left [&_button]:text-sm [&_button]:text-red-600 [&_button]:hover:bg-red-50">
          {children}
        </div>
        <p className="sr-only">{label}</p>
      </div>
    </details>
  );
}
