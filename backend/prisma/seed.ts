import { PrismaClient, RolUsuario, MetodoPago, EstadoTicket, TipoEgreso } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const EstadoAlquiler = {
  ACTIVO: 'ACTIVO',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
} as any;

const EstadoComprobante = {
  BORRADOR: 'BORRADOR',
  FIRMADO: 'FIRMADO',
  PAGADO: 'PAGADO',
  ANULADO: 'ANULADO',
} as any;

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando Seed Completo con gran volumen de datos...');

  // 1. Usuarios
  const adminHash = await bcrypt.hash('admin1234', 10);
  const userHash = await bcrypt.hash('user1234', 10);
  const farmaciaHash = await bcrypt.hash('farmacia1234', 10);

  const adminUser = await prisma.usuario.upsert({
    where: { usuario: 'admin' },
    update: { contrasena: adminHash },
    create: {
      nombre: 'Administrador Principal',
      usuario: 'admin',
      contrasena: adminHash,
      rol: RolUsuario.ADMINISTRADOR,
    },
  });

  const recepcionistaUser = await prisma.usuario.upsert({
    where: { usuario: 'user' },
    update: { contrasena: userHash },
    create: {
      nombre: 'Recepcionista',
      usuario: 'user',
      contrasena: userHash,
      rol: RolUsuario.RECEPCIONISTA,
    },
  });

  const farmaciaUser = await prisma.usuario.upsert({
    where: { usuario: 'farmacia' },
    update: { contrasena: farmaciaHash },
    create: {
      nombre: 'Encargado de Farmacia',
      usuario: 'farmacia',
      contrasena: farmaciaHash,
      rol: RolUsuario.FARMACIA,
    },
  });

  console.log('✅ Usuarios listos:', [adminUser.usuario, recepcionistaUser.usuario, farmaciaUser.usuario].join(', '));

  // 2. Procedencias
  const procedenciasData = [
    { nombre: 'Ciudad de Dios', distrito: 'Guadalupe', provincia: 'Pacasmayo', departamento: 'La Libertad' },
    { nombre: 'Guadalupe', distrito: 'Guadalupe', provincia: 'Pacasmayo', departamento: 'La Libertad' },
    { nombre: 'Chepén', distrito: 'Chepén', provincia: 'Chepén', departamento: 'La Libertad' },
    { nombre: 'Tolón', distrito: 'Pacanga', provincia: 'Chepén', departamento: 'La Libertad' },
    { nombre: 'Pacanguilla', distrito: 'Pacanga', provincia: 'Chepén', departamento: 'La Libertad' },
    { nombre: 'Jagüey', distrito: 'San José', provincia: 'Pacasmayo', departamento: 'La Libertad' },
    { nombre: 'Pueblo Nuevo', distrito: 'Pueblo Nuevo', provincia: 'Chepén', departamento: 'La Libertad' },
    { nombre: 'San Pedro de Lloc', distrito: 'San Pedro', provincia: 'Pacasmayo', departamento: 'La Libertad' },
    { nombre: 'Pacasmayo', distrito: 'Pacasmayo', provincia: 'Pacasmayo', departamento: 'La Libertad' },
    { nombre: 'Tembladera', distrito: 'Yonán', provincia: 'Contumazá', departamento: 'Cajamarca' },
  ];

  const procedencias: any[] = [];
  for (const p of procedenciasData) {
    const proc = await prisma.procedencia.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: p,
    });
    procedencias.push(proc);
  }
  console.log(`✅ ${procedencias.length} Procedencias configuradas`);

  // 3. Médicos
  const medicosData = [
    { nombre: 'Dr. Joseph Cabanillas', especialidad: 'Medicina General', grado: 'Doctor', celular: '987654321' },
    { nombre: 'Dr. Carlos Sánchez', especialidad: 'Ginecología y Obstetricia', grado: 'Doctor', celular: '912345678' },
    { nombre: 'Dra. María Fernandez', especialidad: 'Pediatría', grado: 'Doctora', celular: '945678123' },
    { nombre: 'Dr. Randy Rebaza', especialidad: 'Cirugía General', grado: 'Doctor', celular: '933221100' },
    { nombre: 'Dr. Carlos Ramírez', especialidad: 'Radiología', grado: 'Doctor', celular: '998877665' },
    { nombre: 'Dr. José Pérez', especialidad: 'Medicina General', grado: 'Doctor', celular: '976543210' },
    { nombre: 'Dra. Ana Mendoza', especialidad: 'Cardiología', grado: 'Doctora', celular: '955443322' },
    { nombre: 'Dr. Walter Thorne', especialidad: 'Traumatología', grado: 'Doctor', celular: '966778899' },
  ];

  const medicos: any[] = [];
  for (const m of medicosData) {
    const med = await prisma.medico.upsert({
      where: { nombre: m.nombre },
      update: {},
      create: m,
    });
    medicos.push(med);
  }
  console.log(`✅ ${medicos.length} Médicos configurados`);

  // 4. Tarifas
  const tarifasData = [
    { id: 1, categoria: 'Consulta', especialidad: 'Medicina General', descripcion: 'Consulta Médica General', precioTotal: 80, tipoReparto: 'PORCENTAJE', comisionMedico: 40, comisionClinica: 40, requiereTecnico: false, comisionTecnico: 0 },
    { id: 2, categoria: 'Consulta', especialidad: 'Ginecología', descripcion: 'Consulta Especializada Ginecología', precioTotal: 100, tipoReparto: 'PORCENTAJE', comisionMedico: 60, comisionClinica: 40, requiereTecnico: false, comisionTecnico: 0 },
    { id: 3, categoria: 'Consulta', especialidad: 'Pediatría', descripcion: 'Consulta Pediátrica Integral', precioTotal: 90, tipoReparto: 'PORCENTAJE', comisionMedico: 50, comisionClinica: 40, requiereTecnico: false, comisionTecnico: 0 },
    { id: 4, categoria: 'Consulta', especialidad: 'Cardiología', descripcion: 'Consulta Cardiológica + EKG', precioTotal: 140, tipoReparto: 'PORCENTAJE', comisionMedico: 90, comisionClinica: 50, requiereTecnico: false, comisionTecnico: 0 },
    { id: 5, categoria: 'Consulta', especialidad: 'Traumatología', descripcion: 'Consulta Traumatológica + Evaluación', precioTotal: 110, tipoReparto: 'PORCENTAJE', comisionMedico: 70, comisionClinica: 40, requiereTecnico: false, comisionTecnico: 0 },
    { id: 6, categoria: 'Ecografía', especialidad: 'Ginecología', descripcion: 'Ecografía Pélvica / Reno-Vesical', precioTotal: 120, tipoReparto: 'PORCENTAJE', comisionMedico: 70, comisionClinica: 50, requiereTecnico: false, comisionTecnico: 0 },
    { id: 7, categoria: 'Ecografía', especialidad: 'Ginecología', descripcion: 'Ecografía Obstétrica 4D/5D', precioTotal: 180, tipoReparto: 'PORCENTAJE', comisionMedico: 110, comisionClinica: 70, requiereTecnico: false, comisionTecnico: 0 },
    { id: 8, categoria: 'Rayos X', especialidad: 'Radiología', descripcion: 'Toma de Rayos X (Placa Torácica)', precioTotal: 120, tipoReparto: 'MIXTO', comisionMedico: 20, comisionClinica: 95, requiereTecnico: true, comisionTecnico: 5 },
    { id: 9, categoria: 'Rayos X', especialidad: 'Radiología', descripcion: 'Rayos X Columna Completa', precioTotal: 160, tipoReparto: 'MIXTO', comisionMedico: 30, comisionClinica: 120, requiereTecnico: true, comisionTecnico: 10 },
    { id: 10, categoria: 'SOP', especialidad: 'Cirugía', descripcion: 'Cirugía Menor Ambulatoria (SOP)', precioTotal: 450, tipoReparto: 'PORCENTAJE', comisionMedico: 250, comisionClinica: 200, requiereTecnico: false, comisionTecnico: 0 },
    { id: 11, categoria: 'Certificado', especialidad: 'General', descripcion: 'Certificado Médico Oficial', precioTotal: 50, tipoReparto: 'FIJO', comisionMedico: 10, comisionClinica: 40, requiereTecnico: false, comisionTecnico: 0 },
    { id: 12, categoria: 'Historia', especialidad: 'Administración', descripcion: 'Historia Clínica Copia Fedateada', precioTotal: 30, tipoReparto: 'FIJO', comisionMedico: 0, comisionClinica: 30, requiereTecnico: false, comisionTecnico: 0 },
  ];

  const tarifas: any[] = [];
  for (const t of tarifasData) {
    const tar = await prisma.tarifa.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
    tarifas.push(tar);
  }
  console.log(`✅ ${tarifas.length} Tarifas configuradas`);

  // 5. Pacientes (Generación de 40 pacientes diversos)
  const nombresPacientes = [
    'Juan Carlos Mendoza Soto', 'Rosa Elena Vargas Díaz', 'Luis Alberto Ramos Torres', 'Carmen Julia Flores Vega',
    'Pedro Pablo Alva Castillo', 'María Teresa Ruiz Saldaña', 'Jorge Luis Benites Paredes', 'Ana Patricia Cruz Herrera',
    'Víctor Manuel Quispe Rojas', 'Lucía Fernanda Gómez Silva', 'Carlos Eduardo Salazar León', 'Dora Isabel Morales Castro',
    'Raúl Antonio Cerna Delgado', 'Juana Marleni Córdova Vera', 'Felipe Santiago Miranda Gil', 'Gloria Esperanza Núñez Polo',
    'Guillermo Segundo Ríos Campos', 'Nancy Roxana Vásquez Mostacero', 'Segundo Teodoro Plasencia Cabrera', 'Yolanda Beatriz Chávez Luna',
    'Mario Renato Romero Ortiz', 'Katia Milagros Gutiérrez Cueva', 'Héctor Fernando Medina Aguilar', 'Patricia Elizabeth Reyes Bravo',
    'Oscar David Silva Pinedo', 'Diana Carolina Calderón Prieto', 'Manuel Enrique Zavaleta Correa', 'Sonia Maribel Tello Valderrama',
    'César Augusto Lozano Peña', 'Martha Cecilia Espinoza Marín', 'Hugo Javier Cabrera Acosta', 'Silvia Janet Bustamante Reyna',
    'Edgar Rolando Rivas Gálvez', 'Verónica Pilar Noriega Paz', 'Julio César Urbina Cárdenas', 'Gisella Marita Tapia Moncada',
    'Andrés Avelino Vera Villanueva', 'Elsa Noemí Valdivia Robles', 'Federico Guillermo Ponce Solano', 'Miriam Teresa Aguilar Viteri'
  ];

  const pacientes: any[] = [];
  for (let i = 0; i < nombresPacientes.length; i++) {
    const dni = `${70000000 + i * 137 + 54}`;
    const cel = `98${String(1000000 + i * 8321).slice(0, 7)}`;
    const proc = procedencias[i % procedencias.length];

    const pac = await prisma.paciente.create({
      data: {
        nombre: nombresPacientes[i],
        celular: cel,
        numeroHistoriaClinica: `HC-${202600 + i}`,
        procedenciaId: proc.id,
      },
    });
    pacientes.push(pac);
  }
  console.log(`✅ ${pacientes.length} Pacientes creados`);

  // 6. Cajas Diarias & Atenciones (Generar histórico de los últimos 20 días)
  const metodos: MetodoPago[] = [MetodoPago.EFECTIVO, MetodoPago.PLIN, MetodoPago.TRANSFERENCIA, MetodoPago.TARJETA];
  const fechaActual = new Date();

  let totalTicketsCreados = 0;
  let totalEgresosCreados = 0;

  for (let d = 20; d >= 0; d--) {
    const diaFecha = new Date(fechaActual);
    diaFecha.setDate(fechaActual.getDate() - d);
    diaFecha.setHours(8, 0, 0, 0);

    const esHoy = d === 0;

    // Crear Caja Diaria
    const caja = await prisma.cajaDiaria.create({
      data: {
        fecha: diaFecha,
        montoApertura: 100.00,
        montoEfectivoEsperado: 100.00,
        montoDigitalEsperado: 0.00,
        abierta: esHoy, // La caja de hoy queda abierta
        fechaApertura: diaFecha,
        fechaCierre: esHoy ? null : new Date(diaFecha.getTime() + 10 * 3600 * 1000),
        usuarioAperturaId: adminUser.id,
        usuarioCierreId: esHoy ? null : adminUser.id,
        montoEfectivoReal: esHoy ? null : 100.00,
        diferenciaCierre: 0.00,
      },
    });

    // Crear entre 4 y 9 tickets por día
    const cantidadTicketsDia = 4 + (d % 6);
    let acumuladoEfectivo = 100.00;
    let acumuladoDigital = 0.00;

    for (let t = 0; t < cantidadTicketsDia; t++) {
      totalTicketsCreados++;
      const paciente = pacientes[(t + d * 3) % pacientes.length];
      const medico = medicos[(t + d) % medicos.length];
      const tarifa = tarifas[(t * 2 + d) % tarifas.length];
      const metodo = metodos[(t + d) % metodos.length];

      const horaTicket = new Date(diaFecha);
      horaTicket.setHours(8 + Math.floor(t * 1.2), (t * 17) % 60, 0, 0);

      const montoPaciente = Number(tarifa.precioTotal);
      const montoMedico = Number(tarifa.comisionMedico);
      const montoClinica = Number(tarifa.comisionClinica);
      const montoTecnico = Number(tarifa.comisionTecnico);

      const numeroTicket = `${diaFecha.toISOString().split('T')[0]}-${String(t + 1).padStart(4, '0')}`;

      await prisma.ticket.upsert({
        where: { numeroTicket },
        update: {
          numeroBoleta: `B001-${String(totalTicketsCreados + 100).padStart(8, '0')}`,
          fecha: horaTicket,
          pacienteId: paciente.id,
          medicoId: medico.id,
          tarifaId: tarifa.id,
          descripcionAdicional: tarifa.descripcion,
          metodoPago: metodo,
          montoPaciente,
          montoMedico,
          montoClinica,
          montoTecnico,
          nombreTecnico: tarifa.requiereTecnico ? 'Samuel Placas' : null,
          estado: EstadoTicket.ACTIVO,
          cajaDiariaId: caja.id,
          usuarioCreadorId: recepcionistaUser.id,
        },
        create: {
          numeroTicket,
          numeroBoleta: `B001-${String(totalTicketsCreados + 100).padStart(8, '0')}`,
          fecha: horaTicket,
          pacienteId: paciente.id,
          medicoId: medico.id,
          tarifaId: tarifa.id,
          descripcionAdicional: tarifa.descripcion,
          metodoPago: metodo,
          montoPaciente,
          montoMedico,
          montoClinica,
          montoTecnico,
          nombreTecnico: tarifa.requiereTecnico ? 'Samuel Placas' : null,
          estado: EstadoTicket.ACTIVO,
          cajaDiariaId: caja.id,
          usuarioCreadorId: recepcionistaUser.id,
          creadoEn: horaTicket,
        },
      });

      if (metodo === MetodoPago.EFECTIVO) {
        acumuladoEfectivo += montoPaciente;
      } else {
        acumuladoDigital += montoPaciente;
      }
    }

    // Registrar 1 o 2 egresos por día (gastos operativos)
    if (d % 2 === 0) {
      totalEgresosCreados++;
      const montoEgreso = 25.00 + (d * 3.5);
      acumuladoEfectivo -= montoEgreso;

      await prisma.egreso.create({
        data: {
          fecha: diaFecha,
          tipoEgreso: TipoEgreso.GASTO,
          proveedor: d % 4 === 0 ? 'Farmacia Central' : 'Librería & Útiles',
          observaciones: d % 4 === 0 ? 'Compra de alcohol y gasas' : 'Papel bond térmico y lapiceros',
          monto: montoEgreso,
          cajaDiariaId: caja.id,
          usuarioEgresoId: adminUser.id,
        },
      });
    }

    // Actualizar montos esperados y cierre de la caja
    await prisma.cajaDiaria.update({
      where: { id: caja.id },
      data: {
        montoEfectivoEsperado: acumuladoEfectivo,
        montoDigitalEsperado: acumuladoDigital,
        montoEfectivoReal: esHoy ? null : acumuladoEfectivo,
      },
    });
  }

  console.log(`✅ ${totalTicketsCreados} Tickets clínicos históricos creados`);
  console.log(`✅ ${totalEgresosCreados} Egresos de caja registrados`);

  // 7. Alquileres de Espacios
  const alquileresData = [
    {
      nombre: 'Consultorio A — Campaña Dermatológica',
      fechaInicio: new Date(fechaActual.getTime() - 12 * 86400000),
      fechaFin: new Date(fechaActual.getTime() - 8 * 86400000),
      precioTotal: 650.00,
      estado: EstadoAlquiler.FINALIZADO,
      arrendatario: 'Dr. Fernando Zevallos (Dermatólogo)',
      contacto: '984512345',
      observaciones: 'Campaña de lunares y manchas 4 días',
    },
    {
      nombre: 'Quirófano / SOP — Cirugías Plásticas Menores',
      fechaInicio: new Date(fechaActual.getTime() - 2 * 86400000),
      fechaFin: new Date(fechaActual.getTime() + 2 * 86400000),
      precioTotal: 1200.00,
      estado: EstadoAlquiler.ACTIVO,
      arrendatario: 'Dra. Milagros Barba (Cirujana)',
      contacto: '998112233',
      observaciones: 'Reserva de turno quirúrgico fin de semana',
    },
    {
      nombre: 'Consultorio B — Campaña Oftalmológica',
      fechaInicio: new Date(fechaActual.getTime() + 3 * 86400000),
      fechaFin: new Date(fechaActual.getTime() + 6 * 86400000),
      precioTotal: 800.00,
      estado: EstadoAlquiler.ACTIVO,
      arrendatario: 'Óptica & Visión San José',
      contacto: '976554433',
      observaciones: 'Medición de vista computarizada',
    },
    {
      nombre: 'Sala de Procedimientos — Campaña Odontológica',
      fechaInicio: new Date(fechaActual.getTime() - 18 * 86400000),
      fechaFin: new Date(fechaActual.getTime() - 15 * 86400000),
      precioTotal: 500.00,
      estado: EstadoAlquiler.CANCELADO,
      arrendatario: 'Dr. Julio Tapia (Dentista)',
      contacto: '965412879',
      observaciones: 'Cancelado por viaje del especialista',
    },
  ];

  const cajaReciente = await prisma.cajaDiaria.findFirst({ orderBy: { fecha: 'desc' } });

  for (const alq of alquileresData) {
    await (prisma as any).alquilerEspacio.create({
      data: {
        ...alq,
        cajaDiariaId: cajaReciente!.id,
        usuarioCreadorId: adminUser.id,
      },
    });
  }
  console.log(`✅ ${alquileresData.length} Alquileres de espacios registrados`);

  // 8. Comprobantes de Pago Médico Históricos
  for (let mIdx = 0; mIdx < 3; mIdx++) {
    const med = medicos[mIdx];
    const fechaComp = new Date(fechaActual);
    fechaComp.setDate(fechaActual.getDate() - (mIdx * 3 + 1));

    await (prisma as any).comprobantePagoMedico.create({
      data: {
        medicoId: med.id,
        fecha: fechaComp,
        periodoInicio: new Date(fechaComp.getTime() - 7 * 86400000),
        periodoFin: fechaComp,
        montoTotal: 480.00 + (mIdx * 160),
        montoDescuento: 0.00,
        montoNeto: 480.00 + (mIdx * 160),
        cantidadServicios: 6 + (mIdx * 2),
        estado: mIdx === 0 ? EstadoComprobante.BORRADOR : EstadoComprobante.FIRMADO,
        firmaDigital: mIdx !== 0 ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' : null,
        documentoPdfPath: mIdx !== 0 ? `comprobante_${mIdx + 1}_demo.pdf` : null,
        observaciones: `Liquidación semanal de atenciones ${med.nombre}`,
        cajaDiariaId: cajaReciente!.id,
        usuarioCreadorId: adminUser.id,
      },
    });
  }
  console.log('✅ Comprobantes de Pago Médico generados');

  // 9. Ajustes de Configuración (WhatsApp, etc.)
  await (prisma as any).ajustes.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
      whatsappNumeroNegocio: process.env.WHATSAPP_NUMERO_NEGOCIO || '',
      whatsappGerentes: process.env.WHATSAPP_GERENTES || '',
      whatsappProvider: process.env.WHATSAPP_PROVIDER || 'dummy',
      whatsappToken: '',
      whatsappApiUrl: '',
    },
  });
  console.log('✅ Ajustes de configuración inicializados');

  console.log('🎉 SEED COMPLETADO AL 100%! La base de datos está cargada con abundante información real.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
