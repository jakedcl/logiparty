import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { absoluteRedirectUrl, postAuthPath } from "@/lib/auth/redirect";

export default async function HomePage() {
  const session = await auth();
  const headersList = await headers();
  if (session?.user) {
    redirect(absoluteRedirectUrl(headersList, postAuthPath(session.user)));
  }
  redirect(absoluteRedirectUrl(headersList, "/login"));
}
