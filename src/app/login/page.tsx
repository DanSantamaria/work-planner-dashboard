"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/semana");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Iniciar Sesión
        </h1>
        <p className="text-blue-500 mb-6">Panel de administración CAC</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="tu@email.com"
          />

          <Input
            label="Contraseña"
            name="password"
            type="password"
            placeholder="••••••••"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <Link
          href="/semana"
          className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 mb-4 mt-8">
          ← Volver al inicio
        </Link>
      </Card>
    </main>
  );
}
