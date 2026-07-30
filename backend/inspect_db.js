const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== CAJAS DIARIAS ===");
  const cajas = await prisma.cajaDiaria.findMany({
    orderBy: { fecha: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(cajas, null, 2));

  console.log("=== PACIENTES RECIENTES ===");
  const pacientes = await prisma.paciente.findMany({
    orderBy: { id: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(pacientes, null, 2));

  console.log("=== TICKETS RECIENTES ===");
  const tickets = await prisma.ticket.findMany({
    orderBy: { id: 'desc' },
    take: 5,
    include: { paciente: true }
  });
  console.log(JSON.stringify(tickets, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
