import { auth } from "@/auth";
import { LogOut } from "lucide-react";

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8">
      <div />
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
        <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 cursor-pointer">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}