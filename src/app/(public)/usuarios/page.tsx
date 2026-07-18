import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import UsuariosTable from "@/components/usuarios/UsuariosTable";

export default async function UsuariosPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/semana");
  }

  const usuarios = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, role: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Usuarios</h1>
      <UsuariosTable initialUsuarios={usuarios} currentUserId={session.user.id} />
    </div>
  );
}
