const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando creación de datos base...');

  // 1. Limpiar todo para evitar conflictos
  await prisma.cotizacionItem.deleteMany();
  await prisma.cotizacion.deleteMany();
  await prisma.foto.deleteMany();
  await prisma.checklistItemVisita.deleteMany();
  await prisma.visita.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.sede.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.tecnico.deleteMany();
  await prisma.usuario.deleteMany();

  // 2. Crear el Administrador
  const pass = await bcrypt.hash('N24seguridad', 10);
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Jose Posso',
      email: 'n24seguridadelectronica@gmail.com',
      password: pass,
      rol: 'ADMIN',
      pin: '123456'
    }
  });

  const tecnico = await prisma.tecnico.create({
    data: { usuarioId: admin.id, telefono: '300-000-0000' }
  });

  // 3. Crear Cliente y Sede
  const cliente = await prisma.cliente.create({
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

  const sede = await prisma.sede.create({
    data: {
      clienteId: cliente.id,
      nombre: 'Sede Norte',
      direccion: 'Cra 45 #12-34',
      ciudad: 'Bogotá'
    }
  });

  // 4. Crear Equipos
  await prisma.equipo.createMany({
    data: [
      { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', serial: 'CAM-001', ubicacion: 'Entrada Principal' },
      { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', serial: 'CAM-002', ubicacion: 'Parqueadero' },
      { sedeId: sede.id, tipo: 'NVR', marca: 'Hikvision', modelo: 'DS-7608', serial: 'NVR-001', ubicacion: 'Rack de Comunicaciones' },
      { sedeId: sede.id, tipo: 'PANEL_ALARMA', marca: 'Ajax', modelo: 'Hub 2', serial: 'ALM-001', ubicacion: 'Recepción' }
    ]
  });

  // 5. Crear Visita asignada al Admin
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

  console.log('✅ Todo creado con éxito. Recarga la página e inicia sesión.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());