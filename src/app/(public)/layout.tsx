import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user?.role} />
      <div className="flex-1 flex flex-col">
        <Header user={user ? { name: user.name, role: user.role } : null} />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
