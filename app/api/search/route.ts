import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { globalSearch, portalGlobalSearch } from "@/lib/actions/global-search";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const scope = url.searchParams.get("scope");

  try {
    if (scope === "portal" || session.user.isClient) {
      const groups = await portalGlobalSearch(session.user.orgId, q);
      return NextResponse.json({ groups });
    }
    const groups = await globalSearch(session.user.orgId, q);
    return NextResponse.json({ groups });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
