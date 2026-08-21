import { auth } from "@/auth";
import Shell from "@/components/Shell";
import { BusquedaProvider } from "@/context/BusquedaContext";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  const headerUser = user ? { name: user.name, role: user.role } : null;

  return (
    <BusquedaProvider>
      <Shell user={headerUser}>{children}</Shell>
    </BusquedaProvider>
  );
}
