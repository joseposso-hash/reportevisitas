const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creando datos de prueba...');

  // 1. Buscar al admin
  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
  if (!admin) {
    console.error('❌ No se encontró un usuario ADMIN. Primero crea el admin.');
    return;
  }

  // 2. Crear el técnico si no existe
  let tecnico = await prisma.tecnico.findUnique({ where: { usuarioId: admin.id } });
  if (!tecnico) {
    tecnico = await prisma.tecnico.create({
      data: { usuarioId: admin.id, telefono: '300-000-0000' }
    });
  }

  // 3. Buscar o crear cliente (si ya existe, lo reutiliza)
  let cliente = await prisma.cliente.findUnique({ where: { nit: '900.123.456-7' } });
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        razonSocial: 'Banco XYZ S.A.',
        nit: '900.123.456-7',
        contactoNom: 'Laura Gómez',
        contactoTel: '300-123-4567',
        contactoMail: 'n24seguridadelectronica@gmail.com',
        direccion: 'Cra 45 #12-34',
        ciudad: 'Bogotá'
      }
    });
    console.log('✅ Cliente creado');
  } else {
    console.log('ℹ️ Cliente ya existía, reutilizando...');
  }

  // 4. Buscar o crear sede
  let sede = await prisma.sede.findFirst({ where: { clienteId: cliente.id, nombre: 'Sede Norte' } });
  if (!sede) {
    sede = await prisma.sede.create({
      data: {
        clienteId: cliente.id,
        nombre: 'Sede Norte',
        direccion: 'Cra 45 #12-34',
        ciudad: 'Bogotá'
      }
    });
    console.log('✅ Sede creada');
  } else {
    console.log('ℹ️ Sede ya existía, reutilizando...');
  }

  // 5. Verificar si ya hay equipos en esa sede
  const equiposExistentes = await prisma.equipo.count({ where: { sedeId: sede.id } });
  if (equiposExistentes === 0) {
    await prisma.equipo.createMany({
      data: [
        { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', serial: 'CAM-001', ubicacion: 'Entrada Principal', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' },
        { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', serial: 'CAM-002', ubicacion: 'Parqueadero', estadoFisico: 'REGULAR', estadoFuncional: 'OPERATIVO' },
        { sedeId: sede.id, tipo: 'NVR', marca: 'Hikvision', modelo: 'DS-7608', serial: 'NVR-001', ubicacion: 'Rack de Comunicaciones', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' },
        { sedeId: sede.id, tipo: 'PANEL_ALARMA', marca: 'Ajax', modelo: 'Hub 2', serial: 'ALM-001', ubicacion: 'Recepción', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' }
      ]
    });
    console.log('✅ Equipos creados');
  } else {
    console.log('ℹ️ Equipos ya existían en la sede, omitiendo...');
  }

  // 6. Verificar si ya existe la visita
  const visitaExistente = await prisma.visita.findUnique({ where: { folio: 'RT-2026-000001' } });
  if (!visitaExistente) {
    await prisma.visita.create({
      data: {
        folio: 'RT-2026-000001',
        clienteId: cliente.id,
        sedeId: sede.id,
        tecnicoId: tecnico.id,
        tipoServicio: 'PREVENTIVO',
        estado: 'ASIGNADA',
        fechaProgramada: new Date(),
        checklist: {
          create: [
            { descripcion: 'Revisión general de equipos' },
            { descripcion: 'Limpieza de lentes' },
            { descripcion: 'Prueba de grabación' }
          ]
        }
      }
    });
    console.log('✅ Visita creada');
  } else {
    console.log('ℹ️ La visita ya existía, omitiendo...');
  }

  console.log('✅ Proceso completado. Recarga la página en Vercel.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());