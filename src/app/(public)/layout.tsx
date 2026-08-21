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
      <div className="flex h-screen bg-page">
        <Sidebar user={headerUser} />
        <div className="flex-1 flex flex-col">
          <Header user={headerUser} />
          {/* Padding sits on the inner div, not on <main>: <main> is the
              scroll container, and a sticky table header offsets from its
              padding edge — leaving it here would park every sticky header
              8 units below the top bar, with rows visible in the gap. */}
          <main className="flex-1 overflow-auto">
            <div className="p-8">{children}</div>
          </main>
        </div>
      </div>
    </BusquedaProvider>
  );
}
