const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('N24seguridad', 10);
  await prisma.usuario.update({
    where: { email: 'n24seguridadelectronica@gmail.com' },
    data: { password: hash }
  });
  console.log('✅ Contraseña actualizada correctamente');
}

main()
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());