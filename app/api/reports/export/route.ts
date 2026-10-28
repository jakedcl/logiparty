import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageJobs } from "@/lib/auth/permissions";
import { exportReportsCsv } from "@/lib/actions/reports";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageJobs(session.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = new Date(url.searchParams.get("from") ?? "");
  const to = new Date(url.searchParams.get("to") ?? "");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const csv = await exportReportsCsv(session.user.orgId, from, to);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reports.csv"',
    },
  });
}
