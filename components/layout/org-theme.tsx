import { cn } from "@/lib/utils";
import { tenantThemeStyle } from "@/lib/theme/primary-color";

type Props = {
  primaryColor?: string | null;
  className?: string;
  children: React.ReactNode;
};

/**
 * Sets tenant `--primary` (and derived accents) on the app chrome.
 * All product UI should live inside this so buttons/links pick up org brand.
 */
export function OrgTheme({ primaryColor, className, children }: Props) {
  return (
    <div
      className={cn("lp-app min-h-screen", className)}
      style={tenantThemeStyle(primaryColor) as React.CSSProperties}
    >
      {children}
    </div>
  );
}
