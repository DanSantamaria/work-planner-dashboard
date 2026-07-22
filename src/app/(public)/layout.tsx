import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
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
      <div className="flex h-screen bg-[#F2F2F2]">
        <Sidebar user={headerUser} />
        <div className="flex-1 flex flex-col">
          <Header user={headerUser} />
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </div>
    </BusquedaProvider>
  );
}
