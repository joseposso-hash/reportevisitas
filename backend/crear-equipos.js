const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Buscando cliente y sede...');
  
  const cliente = await prisma.cliente.findFirst();
  if (!cliente) {
    console.log('❌ No hay clientes. Primero ejecuta datos-prueba.js');
    return;
  }

  const sede = await prisma.sede.findFirst({ where: { clienteId: cliente.id } });
  if (!sede) {
    console.log('❌ No hay sedes para este cliente.');
    return;
  }

  console.log('Creando equipos para la sede:', sede.nombre);

  // Borrar equipos anteriores para no duplicar
  await prisma.equipo.deleteMany({ where: { sedeId: sede.id } });

  await prisma.equipo.createMany({
    data: [
      { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', serial: 'CAM-001', ubicacion: 'Entrada Principal', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' },
      { sedeId: sede.id, tipo: 'CAMARA', marca: 'Hikvision', modelo: 'DS-2CD2143', serial: 'CAM-002', ubicacion: 'Parqueadero', estadoFisico: 'REGULAR', estadoFuncional: 'OPERATIVO' },
      { sedeId: sede.id, tipo: 'NVR', marca: 'Hikvision', modelo: 'DS-7608', serial: 'NVR-001', ubicacion: 'Rack de Comunicaciones', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' },
      { sedeId: sede.id, tipo: 'PANEL_ALARMA', marca: 'Ajax', modelo: 'Hub 2', serial: 'ALM-001', ubicacion: 'Recepción', estadoFisico: 'OPTIMO', estadoFuncional: 'OPERATIVO' }
    ]
  });

  console.log('✅ 4 equipos creados exitosamente.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());