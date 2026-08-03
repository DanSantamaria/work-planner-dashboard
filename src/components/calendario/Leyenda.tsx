import Badge from "@/components/ui/Badge";

export default function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <Badge variant="feriado">Feriado / fin de semana</Badge>
      <Badge variant="vacacion">Vacación (año actual)</Badge>
      <Badge variant="vacacionAnterior">Vacación (año anterior)</Badge>
      <Badge variant="ausente">Ausencia</Badge>
      <Badge variant="nota">Nota</Badge>
    </div>
  );
}
