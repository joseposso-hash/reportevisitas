const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando base de datos y creando Admin...');

  // 1. Borrar TODOS los datos (para evitar conflictos)
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
  
  console.log('✅ Base de datos limpia.');

  // 2. Crear tu usuario Admin con los datos EXACTOS
  const email = 'n24seguridadelectronica@gmail.com'; // Tu correo real
  const passwordPlana = 'N24seguridad'; // Tu contraseña real
  const hash = await bcrypt.hash(passwordPlana, 10);

  const user = await prisma.usuario.create({
    data: {
      nombre: 'Jose Posso',
      email: email,
      password: hash,
      rol: 'ADMIN',
      pin: '123456'
    }
  });

  // 3. Crear el perfil de técnico (necesario para que puedas iniciar sesión)
  await prisma.tecnico.create({
    data: {
      usuarioId: user.id,
      telefono: '300-000-0000'
    }
  });

  console.log('✅ Admin creado exitosamente.');
  console.log('Correo:', email);
  console.log('Contraseña:', passwordPlana);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());