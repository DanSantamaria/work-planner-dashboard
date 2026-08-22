import { redirect } from "next/navigation";
import { auth } from "@/auth";

// The root path is a signpost, not a page: it never renders. Redirecting on
// the server means the browser is sent straight to the right place, with no
// flash of an in-between screen.
export default async function Home() {
  const session = await auth();

  redirect(session?.user ? "/semana" : "/login");
}
