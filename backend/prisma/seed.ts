import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Procedencias iniciales
  const procedencias = await Promise.all([
    prisma.procedencia.upsert({
      where: { nombre: 'Ciudad de Dios' },
      update: {},
      create: {
        nombre: 'Ciudad de Dios',
        distrito: 'Guadalupe',
        provincia: 'Pacasmayo',
        departamento: 'La Libertad',
      },
    }),
    prisma.procedencia.upsert({
      where: { nombre: 'Tolón' },
      update: {},
      create: {
        nombre: 'Tolón',
        distrito: 'Guadalupe',
        provincia: 'Pacasmayo',
        departamento: 'La Libertad',
      },
    }),
    prisma.procedencia.upsert({
      where: { nombre: 'Pacanguilla' },
      update: {},
      create: {
        nombre: 'Pacanguilla',
        distrito: 'Guadalupe',
        provincia: 'Pacasmayo',
        departamento: 'La Libertad',
      },
    }),
    prisma.procedencia.upsert({
      where: { nombre: 'Chepén' },
      update: {},
      create: {
        nombre: 'Chepén',
        distrito: 'Chepén',
        provincia: 'Chepén',
        departamento: 'La Libertad',
      },
    }),
  ]);

  console.log('✅ Procedencias creadas');

  // Médicos iniciales
  const medicos = await Promise.all([
    prisma.medico.upsert({
      where: { nombre: 'Dr. José Pérez' },
      update: {},
      create: {
        nombre: 'Dr. José Pérez',
        especialidad: 'Medicina General',
        grado: 'Doctor',
        celular: '987654321',
      },
    }),
    prisma.medico.upsert({
      where: { nombre: 'Dra. María López' },
      update: {},
      create: {
        nombre: 'Dra. María López',
        especialidad: 'Ginecología',
        grado: 'Doctor',
        celular: '912345678',
      },
    }),
    prisma.medico.upsert({
      where: { nombre: 'Dr. Carlos Ramírez' },
      update: {},
      create: {
        nombre: 'Dr. Carlos Ramírez',
        especialidad: 'Radiología',
        grado: 'Doctor',
        celular: '998877665',
      },
    }),
  ]);

  console.log('✅ Médicos creados');

  // Tarifas iniciales
  const tarifas = await Promise.all([
    prisma.tarifa.upsert({
      where: { id: 1 },
      update: {},
      create: {
        categoria: 'Consulta',
        especialidad: 'Medicina General',
        descripcion: 'Consulta General',
        precioTotal: 80.00,
        tipoReparto: 'PORCENTAJE',
        comisionMedico: 40.00,
        comisionClinica: 40.00,
        requiereTecnico: false,
        comisionTecnico: 0.00,
      },
    }),
    prisma.tarifa.upsert({
      where: { id: 2 },
      update: {},
      create: {
        categoria: 'Ecografía',
        especialidad: 'Ginecología',
        descripcion: 'Ecografía Pélvica',
        precioTotal: 150.00,
        tipoReparto: 'PORCENTAJE',
        comisionMedico: 75.00,
        comisionClinica: 75.00,
        requiereTecnico: false,
        comisionTecnico: 0.00,
      },
    }),
    prisma.tarifa.upsert({
      where: { id: 3 },
      update: {},
      create: {
        categoria: 'Rayos X',
        especialidad: 'Radiología',
        descripcion: 'Radiografía de Tórax',
        precioTotal: 120.00,
        tipoReparto: 'FIJO',
        comisionMedico: 20.00,
        comisionClinica: 95.00,
        requiereTecnico: true,
        comisionTecnico: 5.00,
      },
    }),
  ]);

  console.log('✅ Tarifas creadas');
  console.log('✅ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
