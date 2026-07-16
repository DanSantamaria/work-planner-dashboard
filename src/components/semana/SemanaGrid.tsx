const DAY_LETTERS = ["L", "M", "X", "J", "V"];

function getMonday(date: Date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDays() {
  const monday = getMonday(new Date());

  return DAY_LETTERS.map((letter, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return { label: `${letter} / ${dd}.${mm}.${yyyy}` };
  });
}

type Props = {
  empleados: { id: string; nombre: string; lob: string; horario: string }[];
  tareas: Record<string, Record<number, string[]>>;
};

export default function SemanaGrid({ empleados, tareas }: Props) {
  const weekDays = getWeekDays();

  function getLobColor(lob: string) {
    if (lob === "ESPAÑA") return "bg-red-100 text-gray-500";
    if (lob === "FRANCIA") return "bg-blue-100 text-gray-500";
    if (lob === "IRLANDA") return "bg-green-100 text-gray-500";
    return "bg-gray-200 text-gray-500";
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="sticky left-0 z-20 w-48 border border-blue-500 bg-blue-600 px-4 py-3 text-left">
              Nombre
            </th>
            <th className="sticky left-48 z-20 w-32 border border-blue-500 bg-blue-600 px-4 py-3 text-left">
              Horario
            </th>
            {weekDays.map((day) => (
              <th
                key={day.label}
                className="whitespace-nowrap border border-blue-500 px-4 py-3 text-left">
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empleados.map((empleado, index) => {
            const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";

            return (
              <tr key={empleado.id} className={rowBg}>
                <td className={`font-semibold px-2 border border-white ${getLobColor(empleado.lob)}`}>
                  {empleado.nombre}
                </td>
                <td
                  className={`sticky left-48 z-10 w-32 border border-gray-200 px-4 py-2 text-gray-600 ${rowBg}`}>
                  {empleado.horario}
                </td>
                {weekDays.map((_, dayIndex) => (
                  <td
                    key={dayIndex}
                    className="whitespace-nowrap border border-gray-200 px-4 py-2 text-gray-700">
                    {(tareas[empleado.id]?.[dayIndex] ?? []).map((tarea) => (
                      <span
                        key={tarea}
                        className="bg-gray-200 text-gray-700 rounded-md text-xs px-2 py-1 m-1">
                        {tarea}
                      </span>
                    ))}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
