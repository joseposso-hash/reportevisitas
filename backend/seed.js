const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando datos iniciales...');

  const adminPass = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      nombre: 'Admin Prueba',
      email: 'admin@test.com',
      password: adminPass,
      rol: 'ADMIN',
      pin: '123456'
    }
  });
  console.log('   ✔ Admin: admin@test.com / admin123');

  const tecPass = await bcrypt.hash('tecnico123', 10);
  const uTec = await prisma.usuario.upsert({
    where: { email: 'tecnico@test.com' },
    update: {},
    create: {
      nombre: 'Carlos Técnico',
      email: 'tecnico@test.com',
      password: tecPass,
      rol: 'TECNICO',
      pin: '111111'
    }
  });

  let tecnico = await prisma.tecnico.findUnique({ where: { usuarioId: uTec.id } });
  if (!tecnico) {
    tecnico = await prisma.tecnico.create({
      data: { usuarioId: uTec.id, telefono: '300-111-2222' }
    });
  }
  console.log('   ✔ Técnico: tecnico@test.com / tecnico123');

  const cliente = await prisma.cliente.upsert({
    where: { nit: '900.123.456-7' },
    update: {},
    create: {
      razonSocial: 'Banco XYZ S.A.',
      nit: '900.123.456-7',
      contactoNom: 'Laura Gómez',
      contactoTel: '300-123-4567',
      contactoMail: 'laura@bancxyz.com',
      direccion: 'Cra 45 #12-34',
      ciudad: 'Bogotá'
    }
  });

  let sede = await prisma.sede.findFirst({ where: { clienteId: cliente.id } });
  if (!sede) {
    sede = await prisma.sede.create({
      data: {
        clienteId: cliente.id,
        nombre: 'Sede Norte',
        direccion: 'Cra 45 #12-34',
        ciudad: 'Bogotá'
      }
    });
    await prisma.equipo.createMany({
      data: [
        { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', ubicacion: 'Entrada' },
        { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', ubicacion: 'Parqueadero' },
        { sedeId: sede.id, tipo: 'NVR', marca: 'Hikvision', modelo: 'DS-7608', ubicacion: 'Rack' },
        { sedeId: sede.id, tipo: 'PANEL_ALARMA', marca: 'Ajax', modelo: 'Hub 2', ubicacion: 'Recepción' }
      ]
    });
  }
  console.log('   ✔ Cliente: Banco XYZ S.A.');

  const folio = 'RT-' + new Date().getFullYear() + '-000001';
  const existente = await prisma.visita.findUnique({ where: { folio } });
  if (!existente) {
    await prisma.visita.create({
      data: {
        folio,
        clienteId: cliente.id,
        sedeId: sede.id,
        tecnicoId: tecnico.id,
        tipoServicio: 'PREVENTIVO',
        estado: 'ASIGNADA',
        fechaProgramada: new Date(),
        checklist: {
          create: [
            { descripcion: 'Limpieza de lentes' },
            { descripcion: 'Verificación de voltaje' },
            { descripcion: 'Actualización de firmware' },
            { descripcion: 'Prueba de grabación' }
          ]
        }
      }
    });
    console.log('   ✔ Visita de prueba: ' + folio);
  }

  console.log('\n✅ Seed completado\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
