const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emailMalo = 'n24seguridadelectronicagmail.com';
  const emailBueno = 'n24seguridadelectronica@gmail.com';

  console.log('Buscando usuario con el correo dañado...');
  const userMalo = await prisma.usuario.findUnique({ where: { email: emailMalo } });

  if (userMalo) {
    // 1. Buscar su perfil de técnico
    const tecnicoMalo = await prisma.tecnico.findUnique({ where: { usuarioId: userMalo.id } });
    
    if (tecnicoMalo) {
      console.log('Borrando visitas asociadas al técnico...');
      await prisma.visita.deleteMany({ where: { tecnicoId: tecnicoMalo.id } });
      
      console.log('Borrando perfil de técnico...');
      await prisma.tecnico.delete({ where: { id: tecnicoMalo.id } });
    }

    // 2. Ahora sí, borrar el usuario
    console.log('Borrando usuario...');
    await prisma.usuario.delete({ where: { id: userMalo.id } });
    console.log('✅ Registro dañado eliminado completamente.');
  } else {
    console.log('No se encontró el usuario con el correo dañado.');
  }

  // 3. Verificar el usuario bueno
  const userBueno = await prisma.usuario.findUnique({ where: { email: emailBueno } });
  if (userBueno) {
    console.log('✅ Usuario correcto listo para usar:', userBueno.email);
  } else {
    console.log('⚠️ El usuario correcto no existe. Vamos a crearlo.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());