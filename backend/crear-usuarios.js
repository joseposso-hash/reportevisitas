const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Creando usuarios...');
  
  // CREAR ADMINISTRADOR
  const miPass = await bcrypt.hash('N24seguridad', 10); // <-- Cambia esta contraseña si quieres
  const emailAdmin = 'n24seguridadelectronica@gmail.com'; // <-- Revisa que este sea tu correo exacto
  
  const existe = await prisma.usuario.findUnique({ where: { email: emailAdmin } });
  
  if (existe) {
    await prisma.usuario.update({
      where: { email: emailAdmin },
      data: { password: miPass }
    });
    console.log('✅ Admin actualizado');
  } else {
    await prisma.usuario.create({
      data: {
        nombre: 'Jose Posso',
        email: emailAdmin,
        password: miPass,
        rol: 'ADMIN',
        pin: '123456'
      }
    });
    console.log('✅ Admin creado');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());