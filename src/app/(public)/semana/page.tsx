import SemanaGrid from "@/components/semana/SemanaGrid";
import FiltroNombre from "@/components/semana/FiltroNombre";

const mockEmpleados = [
  { id: "1", nombre: "Paloma Sánchez", lob: "COORDINACION", horario: "08:00 - 15:00" },
  { id: "2", nombre: "Alicia Casas Muñoz", lob: "COORDINACION", horario: "08:00 - 14:00" },
  { id: "3", nombre: "Mimuna Harchaoui", lob: "COORDINACION", horario: "09:00 - 15:00" },
  { id: "4", nombre: "Daniel Santamaria", lob: "COORDINACION", horario: "07:00 - 15:00" },
  { id: "5", nombre: "Sonia Tor Oliu", lob: "FRANCIA", horario: "06:00 - 14:00" },
  { id: "6", nombre: "Yolanda Toro Gomez", lob: "ESPAÑA", horario: "07:00 - 15:00" },
  { id: "7", nombre: "Nuria Canalda", lob: "IRLANDA", horario: "07:00 - 15:00" },
];

const mockTareas = {
  "1": { 1: ["REVISION INFORME ATRAPAMIENTO", "OFICINA"], 2: ["REVISION INFORME ATRAPAMIENTO"], 3: [], 4: ["INFORME 17:15"], 5: ["INFORME 17:15"] },
  "2": { 1: ["TESTA", "REVISIÓN BUZÓN FR"], 2: ["TESTA", "OFICINA"], 3: ["TESTA"], 4: [], 5: [] },
  "5": { 1: ["DISPONIBLE"], 2: ["DISPONIBLE"], 3: [], 4: ["REASIGNAR MAÑANAS"], 5: ["DISPONIBLE"] },
  "6": { 1: ["OFICINA", "RECEPCION"], 2: ["FESTIVOS"], 3: [], 4: ["OFICINA"], 5: [] },
  "7": { 1: [], 2: ["DISPONIBLE"], 3: ["DISPONIBLE"], 4: [], 5: ["DISPONIBLE"] },
};

export default function SemanaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Planificación Semanal
      </h1>
      <FiltroNombre empleados={mockEmpleados} tareas={mockTareas} />
    </div>
  );
}