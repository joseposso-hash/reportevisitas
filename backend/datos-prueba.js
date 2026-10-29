const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creando datos de prueba...');

  // 1. Crear Cliente
  const cliente = await prisma.cliente.create({
    data: {
      razonSocial: 'Banco XYZ S.A.',
      nit: '900.123.456-7',
      contactoNom: 'Laura Gómez',
      contactoTel: '300-123-4567',
      contactoMail: 'n24seguridadelectronicagmail.com',
      direccion: 'Cra 45 #12-34',
      ciudad: 'Bogotá'
    }
  });

  // 2. Crear Sede
  const sede = await prisma.sede.create({
    data: {
      clienteId: cliente.id,
      nombre: 'Sede Norte',
      direccion: 'Cra 45 #12-34',
      ciudad: 'Bogotá'
    }
  });

  // 3. Crear Equipos
  await prisma.equipo.createMany({
    data: [
      { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', serial: 'CAM-001', ubicacion: 'Entrada Principal', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' },
      { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', serial: 'CAM-002', ubicacion: 'Parqueadero', estadoFisico: 'REGULAR', estadoFuncional: 'OPERATIVO' },
      { sedeId: sede.id, tipo: 'NVR', marca: 'Hikvision', modelo: 'DS-7608', serial: 'NVR-001', ubicacion: 'Rack de Comunicaciones', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' },
      { sedeId: sede.id, tipo: 'PANEL_ALARMA', marca: 'Ajax', modelo: 'Hub 2', serial: 'ALM-001', ubicacion: 'Recepción', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' }
    ]
  });

  // 4. Buscar al usuario Admin para asignarle la visita
  const admin = await prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
  
  // Crear perfil de técnico para el admin si no existe
  let tecnico = await prisma.tecnico.findUnique({ where: { usuarioId: admin.id } });
  if (!tecnico) {
    tecnico = await prisma.tecnico.create({
      data: { usuarioId: admin.id, telefono: '300-000-0000' }
    });
  }

  // 5. Crear Visita
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

  console.log('✅ Datos de prueba creados exitosamente');
  console.log('Ahora recarga la página de tu navegador (http://localhost:5173)');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());