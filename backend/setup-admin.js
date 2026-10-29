const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'n24seguridadelectronica@gmail.com';
  const passwordPlana = 'N24seguridad';
  const hash = await bcrypt.hash(passwordPlana, 10);

  // 1. Crear o actualizar el usuario Admin
  const user = await prisma.usuario.upsert({
    where: { email },
    update: { password: hash, rol: 'ADMIN' },
    create: {
      nombre: 'Jose Posso',
      email: email,
      password: hash,
      rol: 'ADMIN',
      pin: '123456'
    }
  });

  // 2. Crear el perfil de técnico asociado
  let tecnico = await prisma.tecnico.findUnique({ where: { usuarioId: user.id } });
  if (!tecnico) {
    tecnico = await prisma.tecnico.create({
      data: { usuarioId: user.id, telefono: '300-000-0000' }
    });
  }

  // 3. Asignarle la visita de prueba al Admin
  await prisma.visita.updateMany({
    where: { folio: 'RT-2026-000001' },
    data: { tecnicoId: tecnico.id }
  });

  console.log('✅ Admin listo. Correo:', email, '| Contraseña:', passwordPlana);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());