const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function standardizeSpecialty(esp) {
  if (!esp) return 'Medicina General';
  const norm = esp.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
  const map = {
    'MEDICINA GENERAL': 'Medicina General',
    'GINECOLOGIA': 'Ginecología',
    'RADIOLOGIA': 'Radiología',
    'CARDIOLOGIA': 'Cardiología',
    'OFTALMOLOGIA': 'Oftalmología',
    'TRAUMATOLOGIA': 'Traumatología',
    'PEDIATRIA': 'Pediatría',
    'ODONTOLOGIA': 'Odontología',
    'PSICOLOGIA': 'Psicología',
    'NUTRICION': 'Nutrición',
    'ENFERMERIA': 'Enfermería',
    'ANESTESISTA': 'Anestesista',
    'CIRUGIA': 'Cirugía',
    'SOP': 'SOP',
    'CERTIFICADOS': 'Certificados',
    'ADMINISTRACION': 'Administración',
  };
  return map[norm] || esp.trim().replace(/\s+/g, ' ');
}

function standardizeCategory(cat) {
  if (!cat) return 'Consulta';
  const norm = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');
  const map = {
    'CONSULTA': 'Consulta',
    'ECOGRAFIA': 'Ecografía',
    'ECOGRAFIA/S': 'Ecografía',
    'ECOGRAFIAS': 'Ecografía',
    'RAYOS X': 'Rayos X',
    'RAYOS': 'Rayos X',
    'CERTIFICADO': 'Certificado',
    'SERVICIOS': 'Servicios',
    'SOP': 'SOP',
    'HISTORIA': 'Historia',
    'DIETAS': 'Dietas',
  };
  return map[norm] || cat.trim().replace(/\s+/g, ' ');
}

async function main() {
  console.log('--- Cleaning up existing database fields with accents/tildes ---');

  // 1. Clean Medicos
  const medicos = await prisma.medico.findMany();
  console.log(`Checking ${medicos.length} medicos...`);
  for (const m of medicos) {
    const std = standardizeSpecialty(m.especialidad);
    if (m.especialidad !== std) {
      console.log(`Updating Medico "${m.nombre}": "${m.especialidad}" -> "${std}"`);
      await prisma.medico.update({
        where: { id: m.id },
        data: { especialidad: std }
      });
    }
  }

  // 2. Clean Tarifas and merge duplicates
  const tarifas = await prisma.tarifa.findMany();
  console.log(`Checking ${tarifas.length} tarifas...`);
  const uniqueTarifas = new Map();

  for (const t of tarifas) {
    const stdCat = standardizeCategory(t.categoria);
    const stdEsp = standardizeSpecialty(t.especialidad);
    const key = `${stdCat.toUpperCase()}|${stdEsp.toUpperCase()}`;

    const stdDesc = `${stdCat} de ${stdEsp}`;

    if (!uniqueTarifas.has(key)) {
      // First time we see this standardized pair, save it and update if fields changed
      uniqueTarifas.set(key, t.id);
      if (t.categoria !== stdCat || t.especialidad !== stdEsp) {
        console.log(`Standardizing Tarifa [ID ${t.id}]: "${t.categoria}|${t.especialidad}" -> "${stdCat}|${stdEsp}"`);
        await prisma.tarifa.update({
          where: { id: t.id },
          data: {
            categoria: stdCat,
            especialidad: stdEsp,
            descripcion: stdDesc
          }
        });
      }
    } else {
      // Duplicate found! We need to merge this duplicate Tarifa ID into the main Tarifa ID
      const mainId = uniqueTarifas.get(key);
      console.log(`⚠️ Duplicate Tarifa found [ID ${t.id}] ("${t.categoria}|${t.especialidad}") is a duplicate of [ID ${mainId}]. Merging...`);

      // Reassign all tickets pointing to duplicate Tarifa to main Tarifa
      const updatedTickets = await prisma.ticket.updateMany({
        where: { tarifaId: t.id },
        data: { tarifaId: mainId }
      });
      console.log(`   Reassigned ${updatedTickets.count} tickets to main Tarifa ID ${mainId}.`);

      // Delete the duplicate Tarifa record
      await prisma.tarifa.delete({
        where: { id: t.id }
      });
      console.log(`   Deleted duplicate Tarifa ID ${t.id}.`);
    }
  }

  console.log('Database cleanup complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
