import { LOB, Turno, Role } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // ─────────────────────────────────────────
  // USERS (Admin + Supervisors)
  // ─────────────────────────────────────────

  const hashedPassword = await bcrypt.hash("Admin1234!", 10);

  await prisma.user.upsert({
    where: { email: "paloma@cac.com" },
    update: {},
    create: {
      nombre: "Paloma Sánchez",
      email: "paloma@cac.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "daniel@cac.com" },
    update: {},
    create: {
      nombre: "Daniel Francisco Santamaria",
      email: "daniel@cac.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "alicia@cac.com" },
    update: {},
    create: {
      nombre: "Alicia Casas Muñoz",
      email: "alicia@cac.com",
      password: hashedPassword,
      role: Role.SUPERVISOR,
    },
  });

  await prisma.user.upsert({
    where: { email: "pilar@cac.com" },
    update: {},
    create: {
      nombre: "Pilar Rodriguez Otero",
      email: "pilar@cac.com",
      password: hashedPassword,
      role: Role.SUPERVISOR,
    },
  });

  await prisma.user.upsert({
    where: { email: "mimuna@cac.com" },
    update: {},
    create: {
      nombre: "Mimuna Harchaoui",
      email: "mimuna@cac.com",
      password: hashedPassword,
      role: Role.SUPERVISOR,
    },
  });

  console.log("✅ Users created");

  // ─────────────────────────────────────────
  // EMPLEADOS
  // ─────────────────────────────────────────

  const empleados = [
    { nombre: "Paloma Sánchez", lob: LOB.COORDINACION, turno: Turno.MANANA },
    { nombre: "Alicia Casas Muñoz", lob: LOB.COORDINACION, turno: Turno.MANANA },
    { nombre: "Pilar Rodriguez Otero", lob: LOB.COORDINACION, turno: Turno.MANANA },
    { nombre: "Mimuna Harchaoui", lob: LOB.COORDINACION, turno: Turno.MANANA },
    { nombre: "Daniel Francisco Santamaria", lob: LOB.COORDINACION, turno: Turno.MANANA },
    { nombre: "Sonia Tor Oliu", lob: LOB.FRANCIA, turno: Turno.MANANA },
    { nombre: "Dounia Bouchiba", lob: LOB.FRANCIA, turno: Turno.MANANA },
    { nombre: "Yolanda Toro Gomez", lob: LOB.ESPAÑA, turno: Turno.MANANA },
    { nombre: "Aroa Ruz Negro", lob: LOB.ESPAÑA, turno: Turno.MANANA },
    { nombre: "Barbara Nova Cuenca", lob: LOB.ESPAÑA, turno: Turno.MANANA },
    { nombre: "Natalia Divar Conde", lob: LOB.FRANCIA, turno: Turno.MANANA },
    { nombre: "Nuria Canalda", lob: LOB.IRLANDA, turno: Turno.MANANA },
    { nombre: "Diego Eduardo Fosch Acosta", lob: LOB.IRLANDA, turno: Turno.MANANA },
    { nombre: "Cristina Rodriguez Nuñez", lob: LOB.FRANCIA, turno: Turno.MANANA },
    { nombre: "Francisco Vargas Palomo", lob: LOB.ESPAÑA, turno: Turno.MEDIO },
    { nombre: "Simon Muñoz", lob: LOB.IRLANDA, turno: Turno.MEDIO },
    { nombre: "Claire Giménez Álvarez", lob: LOB.FRANCIA, turno: Turno.MEDIO },
    { nombre: "Sonia Cañadas Desbois", lob: LOB.FRANCIA, turno: Turno.MEDIO },
    { nombre: "Amal Berrami Stouti", lob: LOB.FRANCIA, turno: Turno.MEDIO },
    { nombre: "Javier Castro", lob: LOB.ESPAÑA, turno: Turno.MEDIO },
    { nombre: "Aaron Hernán Aramayo Velarde", lob: LOB.IRLANDA, turno: Turno.MEDIO },
    { nombre: "Adrian Delgado", lob: LOB.ESPAÑA, turno: Turno.MEDIO },
    { nombre: "Maria Dominguez", lob: LOB.ESPAÑA, turno: Turno.MEDIO },
    { nombre: "Angie Paola Ruiz Muñoz", lob: LOB.IRLANDA, turno: Turno.MEDIO },
    { nombre: "Francine Ngueya", lob: LOB.FRANCIA, turno: Turno.MEDIO },
    { nombre: "Alexandra Garcia", lob: LOB.FRANCIA, turno: Turno.MEDIO },
    { nombre: "Luisa Cardenas", lob: LOB.IRLANDA, turno: Turno.MEDIO },
    { nombre: "Denisse Del Castillo Shapiama", lob: LOB.IRLANDA, turno: Turno.MEDIO },
    { nombre: "Fátima Hammadi", lob: LOB.FRANCIA, turno: Turno.CIERRE },
    { nombre: "Andres Felipe Bautista Lopez", lob: LOB.IRLANDA, turno: Turno.CIERRE },
    { nombre: "Eva Pallares", lob: LOB.ESPAÑA, turno: Turno.CIERRE },
    { nombre: "Lorenzo Caballero", lob: LOB.IRLANDA, turno: Turno.CIERRE },
    { nombre: "Oumar Sarr Sarr", lob: LOB.FRANCIA, turno: Turno.CIERRE },
    { nombre: "Henrietto Mbuyi", lob: LOB.FRANCIA, turno: Turno.CIERRE },
    { nombre: "Wilnetson Content", lob: LOB.FRANCIA, turno: Turno.CIERRE },
    { nombre: "Omar Enrique Martínez Gil", lob: LOB.IRLANDA, turno: Turno.CIERRE },
    { nombre: "Jaime Lugo", lob: LOB.IRLANDA, turno: Turno.NOCTURNO },
    { nombre: "Mareme Fall", lob: LOB.FRANCIA, turno: Turno.NOCTURNO },
  ];

  for (const emp of empleados) {
    await prisma.empleado.upsert({
      where: { nombre: emp.nombre },
      update: {},
      create: emp,
    });
  }

  console.log(`✅ ${empleados.length} empleados created`);

  // ─────────────────────────────────────────
  // TAREAS
  // ─────────────────────────────────────────

  const tareas = [
    "REVISIÓN BUZÓN FR",
    "ENCUESTAS FRANCIA",
    "AVISOS SIN INICIAR",
    "REVISIÓN CANDIDATOS",
    "CORREO FRANCIA",
    "INFORMES IRLANDA",
    "FACTURAS",
    "OFICINA",
    "REVISION AVISOS SIN RECIBIR",
    "FESTIVOS",
    "COMPROBAR TECNICOS DE GUARDIA FIN DE SEMANA",
    "RECEPCION",
    "DEFENSOR DEL CLIENTE",
    "INFORME DE ATRAPAMIENTOS",
    "REASIGNAR AVISOS FRANCIA",
    "REASIGNAR MAÑANAS",
    "REVISIÓN BUZÓN ES",
    "CORREO DE CENTRALITA",
    "TWITTER/X",
    "AVISOS SIN ASIGNAR IRLANDA",
    "REVISION INFORME DE ATRAPAMIENTO",
    "TESTA",
    "FR RAPPORT",
    "CIERRE OFICINA",
    "DISPONIBLE CASOS",
    "INFORME AVISOS SIN INICIAR",
    "ENCUESTAS ATRAPAMIENTOS",
    "WHATSAPPS IRLANDA",
    "ENVIO PARTES DE TRABAJO",
    "KPIS",
    "DEFENSOR CLIENTE IRLANDA",
    "DISPATCHER TARDE",
    "REASIGNAR AVISOS MADRID",
    "REASIGNAR AVISOS VIP FRANCIA",
    "INFORME DE PARADOS",
    "ENCUESTAS IRLANDA",
    "REVISION LISTA COMERCIALES",
    "REVISION CASOS ALEATORIOS",
    "ALTAS FRANCIA FICHERO",
    "ASIGNACION ENCUESTAS",
  ];

  for (const nombre of tareas) {
    await prisma.tarea.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  console.log(`✅ ${tareas.length} tareas created`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });