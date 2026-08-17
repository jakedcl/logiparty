import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { postAuthPath } from "@/lib/auth/redirect";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(postAuthPath(session.user));
  }
  redirect("/login");
}
