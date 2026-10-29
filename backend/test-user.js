const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@test.com';
  const hash = await bcrypt.hash('123456', 10);

  const user = await prisma.usuario.upsert({
    where: { email },
    update: { password: hash },
    create: {
      nombre: 'Admin de Prueba',
      email: email,
      password: hash,
      rol: 'ADMIN',
      pin: '123456'
    }
  });

  let tecnico = await prisma.tecnico.findUnique({ where: { usuarioId: user.id } });
  if (!tecnico) {
    tecnico = await prisma.tecnico.create({ data: { usuarioId: user.id } });
  }

  await prisma.visita.updateMany({
    data: { tecnicoId: tecnico.id }
  });

  console.log('✅ Usuario de prueba listo. Correo: admin@test.com | Contraseña: 123456');
}
main().catch(console.error).finally(() => prisma.$disconnect());