#!/usr/bin/env node
/**
 * Script de setup automático para prueba del Sistema de Reportes Técnicos
 * 
 * Uso:
 *   1. Crea una carpeta vacía
 *   2. Copia este archivo dentro como "setup.js"
 *   3. Ejecuta: node setup.js
 *   4. Espera ~2 minutos
 *   5. Abre http://localhost:5173
 * 
 * Credenciales:
 *   Admin:   admin@test.com / admin123
 *   Técnico: tecnico@test.com / tecnico123
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');

console.log('\n🚀 Iniciando setup del Sistema de Reportes Técnicos\n');

// === Utilidades ===
function run(cmd, cwd = ROOT) {
  console.log(`   $ {cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
  } catch (err) {
    console.error(`\n❌ Error ejecutando: {cmd}`);
    console.error(err.message);
    process.exit(1);
  }
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.trim() + '\n');
  console.log(`   ✔ {path.relative(ROOT, filePath)}`);
}

function crearCarpeta(p) {
  fs.mkdirSync(p, { recursive: true });
}

// === Verificar Node ===
const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
if (nodeVersion < 20) {
  console.error(`❌ Necesitas Node.js 20+. Tienes {process.version}`);
  process.exit(1);
}
console.log(`✅ Node.js {process.version}\n`);

// ============================================================
// BACKEND
// ============================================================
console.log('📦 Creando backend...\n');
crearCarpeta(BACKEND);

writeFile(path.join(BACKEND, 'package.json'), `
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js",
    "start:dev": "node server.js"
  },
  "dependencies": {
    "@prisma/client": "^5.9.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "prisma": "^5.9.0"
  }
}
`);

writeFile(path.join(BACKEND, 'prisma', 'schema.prisma'), `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Usuario {
  id        String   @id @default(uuid())
  nombre    String
  email     String   @unique
  password  String
  rol       String   @default("TECNICO")
  pin       String?
  activo    Boolean  @default(true)
  tecnico   Tecnico?
  createdAt DateTime @default(now())
}

model Tecnico {
  id        String   @id @default(uuid())
  usuarioId String   @unique
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  telefono  String?
  visitas   Visita[]
}

model Cliente {
  id           String   @id @default(uuid())
  razonSocial  String
  nit          String?  @unique
  contactoNom  String?
  contactoTel  String?
  contactoMail String?
  direccion    String?
  ciudad       String?
  activo       Boolean  @default(true)
  sedes        Sede[]
  visitas      Visita[]
  createdAt    DateTime @default(now())
}

model Sede {
  id        String   @id @default(uuid())
  clienteId String
  cliente   Cliente  @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  nombre    String
  direccion String?
  ciudad    String?
  equipos   Equipo[]
  visitas   Visita[]
}

model Equipo {
  id        String  @id @default(uuid())
  sedeId    String
  sede      Sede    @relation(fields: [sedeId], references: [id], onDelete: Cascade)
  tipo      String
  marca     String?
  modelo    String?
  serial    String?
  ubicacion String?
  estado    String  @default("OPERATIVO")
}

model Visita {
  id                    String                  @id @default(uuid())
  folio                 String                  @unique
  clienteId             String
  cliente               Cliente                 @relation(fields: [clienteId], references: [id])
  sedeId                String
  sede                  Sede                    @relation(fields: [sedeId], references: [id])
  tecnicoId             String
  tecnico               Tecnico                 @relation(fields: [tecnicoId], references: [id])
  tipoServicio          String
  estado                String                  @default("ASIGNADA")
  fechaProgramada       DateTime
  horaCheckin           DateTime?
  horaCheckout          DateTime?
  estadoGeneral         String?
  observaciones         String?
  requerimientosCliente String?
  firmaClienteUrl       String?
  firmaClienteNombre    String?
  pdfUrl                String?
  fotos                 Foto[]
  checklist             ChecklistItemVisita[]
  cotizacion            Cotizacion?
  createdAt             DateTime                @default(now())
  updatedAt             DateTime                @updatedAt
}

model ChecklistItemVisita {
  id          String  @id @default(uuid())
  visitaId    String
  visita      Visita  @relation(fields: [visitaId], references: [id], onDelete: Cascade)
  descripcion String
  completado  Boolean @default(false)
  nota        String?
}

model Foto {
  id          String   @id @default(uuid())
  visitaId    String
  visita      Visita   @relation(fields: [visitaId], references: [id], onDelete: Cascade)
  url         String
  categoria   String
  descripcion String?
  orden       Int      @default(0)
  createdAt   DateTime @default(now())
}

model Cotizacion {
  id                String           @id @default(uuid())
  visitaId          String           @unique
  visita            Visita           @relation(fields: [visitaId], references: [id], onDelete: Cascade)
  numero            String           @unique
  estado            String           @default("BORRADOR")
  subtotal          Float            @default(0)
  iva               Float            @default(0)
  total             Float            @default(0)
  ivaPorcentaje     Int              @default(19)
  validezDias       Int              @default(15)
  notas             String?
  fechaVencimiento  DateTime?
  tokenAprobacion   String?          @unique
  aprobadaPorNombre String?
  aprobadaPorCargo  String?
  razonRechazo      String?
  items             CotizacionItem[]
  createdAt         DateTime         @default(now())
}

model CotizacionItem {
  id             String     @id @default(uuid())
  cotizacionId   String
  cotizacion     Cotizacion @relation(fields: [cotizacionId], references: [id], onDelete: Cascade)
  descripcion    String
  cantidad       Int
  precioUnitario Float
  totalLinea     Float
}
`);

writeFile(path.join(BACKEND, 'server.js'), `
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = 'prueba-secret-cambiar-en-produccion';
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\\s+/g, '_'))
  })
});

// Middleware de autenticación
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'No autorizado' });
  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

// ============ AUTH ============
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.usuario.findUnique({
    where: { email },
    include: { tecnico: true }
  });
  if (!user || !user.activo) return res.status(401).json({ message: 'Credenciales inválidas' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });
  const token = jwt.sign(
    { sub: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    access_token: token,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      tecnicoId: user.tecnico?.id || null
    }
  });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await prisma.usuario.findUnique({
    where: { id: req.user.sub },
    include: { tecnico: true }
  });
  res.json({
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    tecnicoId: user.tecnico?.id || null
  });
});

// ============ VISITAS ============
app.get('/api/visitas', auth, async (req, res) => {
  const where = {};
  if (req.query.tecnicoId) where.tecnicoId = req.query.tecnicoId;
  if (req.query.estado) where.estado = req.query.estado;
  const visitas = await prisma.visita.findMany({
    where,
    include: {
      cliente: true,
      sede: true,
      tecnico: { include: { usuario: true } }
    },
    orderBy: { fechaProgramada: 'asc' }
  });
  res.json(visitas);
});

app.get('/api/visitas/:id', auth, async (req, res) => {
  const visita = await prisma.visita.findUnique({
    where: { id: req.params.id },
    include: {
      cliente: true,
      sede: { include: { equipos: true } },
      tecnico: { include: { usuario: true } },
      checklist: true,
      fotos: { orderBy: { orden: 'asc' } },
      cotizacion: { include: { items: true } }
    }
  });
  if (!visita) return res.status(404).json({ message: 'No encontrada' });
  res.json(visita);
});

app.post('/api/visitas/:id/checkin', auth, async (req, res) => {
  const v = await prisma.visita.update({
    where: { id: req.params.id },
    data: { horaCheckin: new Date(), estado: 'EN_CURSO' }
  });
  res.json(v);
});

app.post('/api/visitas/:id/checkout', auth, async (req, res) => {
  const v = await prisma.visita.update({
    where: { id: req.params.id },
    data: { horaCheckout: new Date() }
  });
  res.json(v);
});

app.patch('/api/visitas/:id', auth, async (req, res) => {
  const allowed = ['observaciones', 'requerimientosCliente', 'estadoGeneral', 'firmaClienteUrl', 'firmaClienteNombre'];
  const data = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const v = await prisma.visita.update({
    where: { id: req.params.id },
    data
  });
  res.json(v);
});

app.patch('/api/visitas/:id/checklist', auth, async (req, res) => {
  const items = req.body;
  await Promise.all(
    items.map(i =>
      prisma.checklistItemVisita.update({
        where: { id: i.id },
        data: { completado: i.completado, nota: i.nota }
      })
    )
  );
  res.json({ ok: true });
});

app.post('/api/visitas/:id/firma', auth, async (req, res) => {
  const { firmaDataUrl, nombreFirmante } = req.body;
  const base64 = firmaDataUrl.replace(/^data:image\\/\\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const filename = 'firma-' + req.params.id + '.png';
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  const v = await prisma.visita.update({
    where: { id: req.params.id },
    data: {
      firmaClienteUrl: '/uploads/' + filename,
      firmaClienteNombre: nombreFirmante
    }
  });
  res.json(v);
});

app.post('/api/visitas/:id/finalizar', auth, async (req, res) => {
  const visita = await prisma.visita.findUnique({
    where: { id: req.params.id },
    include: { cliente: true, cotizacion: true }
  });
  if (!visita) return res.status(404).json({ message: 'No encontrada' });

  await prisma.visita.update({
    where: { id: req.params.id },
    data: {
      estado: 'ENVIADA',
      horaCheckout: visita.horaCheckout || new Date()
    }
  });

  res.json({
    ok: true,
    mailEnviado: false,
    motivo: 'En modo prueba no se envían correos reales',
    destinatario: visita.cliente.contactoMail
  });
});

// ============ FOTOS ============
app.post('/api/fotos/:visitaId', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  const count = await prisma.foto.count({ where: { visitaId: req.params.visitaId } });
  if (count >= 6) return res.status(400).json({ message: 'Máximo 6 fotos por visita' });

  const foto = await prisma.foto.create({
    data: {
      visitaId: req.params.visitaId,
      url: '/uploads/' + req.file.filename,
      categoria: req.body.categoria || 'ESTADO',
      descripcion: req.body.descripcion || null,
      orden: count
    }
  });
  res.json({ ...foto, urlAbsoluta: 'http://localhost:3001' + foto.url });
});

app.get('/api/fotos/visita/:visitaId', auth, async (req, res) => {
  const fotos = await prisma.foto.findMany({
    where: { visitaId: req.params.visitaId },
    orderBy: { orden: 'asc' }
  });
  res.json(fotos.map(f => ({ ...f, urlAbsoluta: 'http://localhost:3001' + f.url })));
});

app.delete('/api/fotos/:id', auth, async (req, res) => {
  const foto = await prisma.foto.findUnique({ where: { id: req.params.id } });
  if (foto) {
    const fp = path.join(uploadsDir, path.basename(foto.url));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  await prisma.foto.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ============ COTIZACIONES ============
app.post('/api/cotizaciones/visita/:visitaId', auth, async (req, res) => {
  const { items, notas, validezDias = 15, ivaPorcentaje = 19 } = req.body;

  const existente = await prisma.cotizacion.findUnique({
    where: { visitaId: req.params.visitaId }
  });
  if (existente) return res.status(400).json({ message: 'Ya existe cotización' });

  const subtotal = items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  const iva = Math.round(subtotal * (ivaPorcentaje / 100));
  const total = subtotal + iva;

  const year = new Date().getFullYear();
  const last = await prisma.cotizacion.findFirst({
    where: { numero: { startsWith: 'COT-' + year + '-' } },
    orderBy: { numero: 'desc' }
  });
  const n = last ? parseInt(last.numero.split('-')[2]) + 1 : 1;
  const numero = 'COT-' + year + '-' + String(n).padStart(6, '0');

  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + validezDias);

  const cot = await prisma.cotizacion.create({
    data: {
      visitaId: req.params.visitaId,
      numero,
      notas,
      validezDias,
      ivaPorcentaje,
      subtotal,
      iva,
      total,
      fechaVencimiento,
      items: {
        create: items.map(i => ({
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          totalLinea: i.cantidad * i.precioUnitario
        }))
      }
    },
    include: { items: true }
  });
  res.json(cot);
});

app.post('/api/cotizaciones/:id/enviar', auth, async (req, res) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  const cot = await prisma.cotizacion.update({
    where: { id: req.params.id },
    data: { estado: 'ENVIADA', tokenAprobacion: token }
  });
  res.json(cot);
});

app.get('/api/cotizaciones/publica/:token', async (req, res) => {
  const cot = await prisma.cotizacion.findUnique({
    where: { tokenAprobacion: req.params.token },
    include: {
      items: true,
      visita: { include: { cliente: true, sede: true } }
    }
  });
  if (!cot) return res.status(404).json({ message: 'No encontrada' });
  res.json(cot);
});

app.post('/api/cotizaciones/publica/:token/aprobar', async (req, res) => {
  const { nombre, cargo } = req.body;
  const cot = await prisma.cotizacion.findUnique({
    where: { tokenAprobacion: req.params.token }
  });
  if (!cot || cot.estado !== 'ENVIADA') {
    return res.status(400).json({ message: 'No se puede aprobar' });
  }
  const updated = await prisma.cotizacion.update({
    where: { id: cot.id },
    data: {
      estado: 'APROBADA',
      aprobadaPorNombre: nombre,
      aprobadaPorCargo: cargo
    }
  });
  res.json(updated);
});

app.post('/api/cotizaciones/publica/:token/rechazar', async (req, res) => {
  const { razon } = req.body;
  const cot = await prisma.cotizacion.findUnique({
    where: { tokenAprobacion: req.params.token }
  });
  if (!cot || cot.estado !== 'ENVIADA') {
    return res.status(400).json({ message: 'No se puede rechazar' });
  }
  const updated = await prisma.cotizacion.update({
    where: { id: cot.id },
    data: { estado: 'RECHAZADA', razonRechazo: razon }
  });
  res.json(updated);
});

// ============ CLIENTES ============
app.get('/api/clientes', auth, async (req, res) => {
  const where = req.query.q
    ? { razonSocial: { contains: req.query.q } }
    : {};
  const clientes = await prisma.cliente.findMany({
    where,
    include: { _count: { select: { sedes: true, visitas: true } } },
    orderBy: { razonSocial: 'asc' }
  });
  res.json(clientes);
});

// ============ DASHBOARD ============
app.get('/api/dashboard/resumen-hoy', auth, async (req, res) => {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);

  const [total, enCurso, finalizadas, pendientesCot] = await Promise.all([
    prisma.visita.count({ where: { fechaProgramada: { gte: inicio, lte: fin } } }),
    prisma.visita.count({ where: { estado: 'EN_CURSO' } }),
    prisma.visita.count({ where: { fechaProgramada: { gte: inicio, lte: fin }, estado: { in: ['FINALIZADA', 'ENVIADA'] } } }),
    prisma.cotizacion.count({ where: { estado: 'ENVIADA' } })
  ]);
  res.json({ total, enCurso, finalizadas, pendientesCotizacion: pendientesCot });
});

app.get('/api/dashboard/tecnicos-en-campo', auth, async (req, res) => {
  const visitas = await prisma.visita.findMany({
    where: { estado: 'EN_CURSO' },
    include: {
      tecnico: { include: { usuario: true } },
      cliente: true,
      sede: true
    }
  });
  res.json(visitas.map(v => ({
    visitaId: v.id,
    tecnico: v.tecnico.usuario.nombre,
    cliente: v.cliente.razonSocial,
    sede: v.sede.nombre,
    horaCheckin: v.horaCheckin,
    folio: v.folio
  })));
});

app.get('/api/dashboard/visitas-del-dia', auth, async (req, res) => {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  const visitas = await prisma.visita.findMany({
    where: { fechaProgramada: { gte: inicio, lte: fin } },
    include: { cliente: true, sede: true, tecnico: { include: { usuario: true } } },
    orderBy: { fechaProgramada: 'asc' }
  });
  res.json(visitas);
});

app.get('/api/dashboard/alertas', auth, async (req, res) => {
  const alertas = [];
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  ayer.setHours(23, 59, 59, 999);
  const sinCerrar = await prisma.visita.count({
    where: { fechaProgramada: { lt: ayer }, estado: { in: ['ASIGNADA', 'EN_CURSO'] } }
  });
  if (sinCerrar > 0) {
    alertas.push({ tipo: 'sin_cerrar', mensaje: sinCerrar + ' visita(s) sin cerrar', severidad: 'alta' });
  }
  const porVencer = await prisma.cotizacion.count({
    where: { estado: 'ENVIADA', fechaVencimiento: { lte: new Date(Date.now() + 3 * 86400000) } }
  });
  if (porVencer > 0) {
    alertas.push({ tipo: 'por_vencer', mensaje: porVencer + ' cotización(es) por vencer', severidad: 'media' });
  }
  res.json(alertas);
});

app.get('/api/dashboard/metricas-mes', auth, async (req, res) => {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const visitasPorTecnico = await prisma.visita.groupBy({
    by: ['tecnicoId'],
    where: { fechaProgramada: { gte: inicioMes } },
    _count: true
  });
  const tecnicos = await prisma.tecnico.findMany({ include: { usuario: true } });

  const cotizaciones = await prisma.cotizacion.groupBy({
    by: ['estado'],
    where: { createdAt: { gte: inicioMes } },
    _count: true,
    _sum: { total: true }
  });

  const ingresos = await prisma.cotizacion.aggregate({
    where: { estado: 'APROBADA', createdAt: { gte: inicioMes } },
    _sum: { total: true }
  });

  res.json({
    visitasPorTecnico: visitasPorTecnico.map(v => ({
      tecnico: tecnicos.find(t => t.id === v.tecnicoId)?.usuario.nombre || '?',
      total: v._count
    })),
    tiposServicio: [],
    cotizaciones: cotizaciones.map(c => ({
      estado: c.estado,
      total: c._count,
      monto: c._sum.total || 0
    })),
    ingresosAprobados: ingresos._sum.total || 0,
    topClientes: []
  });
});

// ============ PDF (modo simplificado) ============
app.get('/api/pdf/visita/:id', auth, async (req, res) => {
  const visita = await prisma.visita.findUnique({
    where: { id: req.params.id },
    include: {
      cliente: true,
      sede: true,
      tecnico: { include: { usuario: true } },
      checklist: true,
      fotos: true,
      cotizacion: { include: { items: true } }
    }
  });
  if (!visita) return res.status(404).json({ message: 'No encontrada' });

  // HTML simple en lugar de PDF real (para no requerir Puppeteer)
  const html = \`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte \{visita.folio}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a2332; }
        h1 { color: #0f2a4a; border-bottom: 3px solid #0f2a4a; padding-bottom: 10px; }
        h2 { color: #0f2a4a; margin-top: 30px; border-left: 4px solid #2563eb; padding-left: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
        .field { padding: 5px; border-bottom: 1px dotted #ccc; }
        .field strong { color: #64748b; }
        .box { background: #f1f5fb; padding: 15px; border-radius: 8px; border-left: 3px solid #2563eb; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #0f2a4a; color: white; padding: 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .foto { display: inline-block; margin: 5px; max-width: 200px; }
        .foto img { max-width: 100%; border-radius: 6px; }
        .estado { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; background: \{visita.estadoGeneral === 'OPTIMO' ? '#16a34a' : visita.estadoGeneral === 'CON_FALLAS' ? '#f59e0b' : '#dc2626'}; }
        .total { font-size: 1.5em; font-weight: bold; color: #0f2a4a; text-align: right; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>REPORTE TÉCNICO DE VISITA — \{visita.folio}</h1>
      <p><strong>Emitido:</strong> \{new Date().toLocaleString('es-CO')}</p>

      <h2>1. Datos Generales</h2>
      <div class="grid">
        <div class="field"><strong>Cliente:</strong> \{visita.cliente.razonSocial}</div>
        <div class="field"><strong>NIT:</strong> \{visita.cliente.nit || '—'}</div>
        <div class="field"><strong>Sede:</strong> \{visita.sede.nombre}</div>
        <div class="field"><strong>Dirección:</strong> \{visita.sede.direccion || '—'}</div>
        <div class="field"><strong>Técnico:</strong> \{visita.tecnico.usuario.nombre}</div>
        <div class="field"><strong>Tipo:</strong> \{visita.tipoServicio}</div>
        <div class="field"><strong>Check-in:</strong> \{visita.horaCheckin ? new Date(visita.horaCheckin).toLocaleString('es-CO') : '—'}</div>
        <div class="field"><strong>Check-out:</strong> \{visita.horaCheckout ? new Date(visita.horaCheckout).toLocaleString('es-CO') : '—'}</div>
      </div>

      <h2>2. Estado General</h2>
      <p><span class="estado">\{visita.estadoGeneral || 'No definido'}</span></p>

      <h2>3. Observaciones</h2>
      <div class="box">\{visita.observaciones || 'Sin observaciones'}</div>
      <h3>Requerimientos del cliente</h3>
      <div class="box">\{visita.requerimientosCliente || 'Sin requerimientos'}</div>

      <h2>4. Checklist</h2>
      <table>
        <tr><th>Punto</th><th>Estado</th><th>Nota</th></tr>
        \{visita.checklist.map(c => \`<tr><td>\{c.descripcion}</td><td>\{c.completado ? '✅ Sí' : '❌ No'}</td><td>\{c.nota || '—'}</td></tr>\`).join('')}
      </table>

      <h2>5. Fotos (\{visita.fotos.length})</h2>
      \{visita.fotos.map(f => \`<div class="foto"><img src="\{f.url}" /><p><small>\{f.categoria}: \{f.descripcion || ''}</small></p></div>\`).join('')}

      \{visita.cotizacion ? \`
        <h2>6. Cotización \{visita.cotizacion.numero}</h2>
        <table>
          <tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
          \{visita.cotizacion.items.map(i => \`<tr><td>\{i.descripcion}</td><td>\{i.cantidad}</td><td>$\{i.precioUnitario.toLocaleString('es-CO')}</td><td>$\{i.totalLinea.toLocaleString('es-CO')}</td></tr>\`).join('')}
        </table>
        <p style="text-align: right"><strong>Subtotal:</strong> $\{visita.cotizacion.subtotal.toLocaleString('es-CO')}</p>
        <p style="text-align: right"><strong>IVA:</strong> $\{visita.cotizacion.iva.toLocaleString('es-CO')}</p>
        <p class="total">TOTAL: $\{visita.cotizacion.total.toLocaleString('es-CO')}</p>
      \` : ''}

      \{visita.firmaClienteUrl ? \`
        <h2>7. Firma del cliente</h2>
        <p><strong>Firmado por:</strong> \{visita.firmaClienteNombre}</p>
        <img src="\{visita.firmaClienteUrl}" style="max-height: 100px; border: 1px solid #ccc; border-radius: 4px;" />
      \` : ''}
    </body>
    </html>
  \`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// ============ START ============
app.listen(PORT, () => {
  console.log('\\n🚀 Backend en http://localhost:' + PORT + '/api');
  console.log('📁 Uploads en http://localhost:' + PORT + '/uploads\\n');
});
`);

writeFile(path.join(BACKEND, 'seed.js'), `
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

  console.log('\\n✅ Seed completado\\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
`);

// ============================================================
// FRONTEND
// ============================================================
console.log('\n📦 Creando frontend...\n');
crearCarpeta(FRONTEND);

writeFile(path.join(FRONTEND, 'package.json'), `
{
  "name": "frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11"
  }
}
`);

writeFile(path.join(FRONTEND, 'vite.config.js'), `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true }
});
`);

writeFile(path.join(FRONTEND, 'index.html'), `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reportes Técnicos — Prueba</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: 'Inter', system-ui, sans-serif; background: #f7f9fc; }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

writeFile(path.join(FRONTEND, 'src', 'main.jsx'), `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`);

writeFile(path.join(FRONTEND, 'src', 'lib', 'api.js'), `
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
`);

writeFile(path.join(FRONTEND, 'src', 'stores', 'auth.js'), `
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    set => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null })
    }),
    { name: 'auth' }
  )
);
`);

writeFile(path.join(FRONTEND, 'src', 'App.jsx'), `
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { VisitasHoy } from './pages/VisitasHoy';
import { VisitaDetalle } from './pages/VisitaDetalle';
import { Dashboard } from './pages/Dashboard';
import { CotizacionPublica } from './pages/CotizacionPublica';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cotizacion/:token" element={<CotizacionPublica />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<VisitasHoy />} />
                <Route path="/visitas/:id" element={<VisitaDetalle />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
`);

writeFile(path.join(FRONTEND, 'src', 'components', 'ProtectedRoute.jsx'), `
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
`);

writeFile(path.join(FRONTEND, 'src', 'components', 'Layout.jsx'), `
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, label }) => {
    const activo = location.pathname === to;
    return (
      <Link
        to={to}
        className={'px-3 py-1.5 rounded text-sm font-medium transition-colors ' +
          (activo ? 'bg-blue-700' : 'hover:bg-blue-700/50')}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="text-xl">🛡️</span>
            <span>Reportes Técnicos</span>
          </Link>
          <nav className="flex gap-1">
            <NavLink to="/" label="Mis visitas" />
            {user?.rol === 'ADMIN' && <NavLink to="/dashboard" label="Dashboard" />}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-100">{user?.nombre}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
`);

writeFile(path.join(FRONTEND, 'src', 'pages', 'Login.jsx'), `
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';

export function Login() {
  const [email, setEmail] = useState('tecnico@test.com');
  const [password, setPassword] = useState('tecnico123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.access_token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-xl font-bold text-blue-900">Sistema de Reportes</h1>
          <p className="text-sm text-slate-500">Prueba local</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          <p className="font-semibold mb-1">Credenciales de prueba:</p>
          <p>Técnico: <code>tecnico@test.com / tecnico123</code></p>
          <p>Admin: <code>admin@test.com / admin123</code></p>
        </div>
      </div>
    </div>
  );
}
`);

writeFile(path.join(FRONTEND, 'src', 'pages', 'VisitasHoy.jsx'), `
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth';

const estadoColor = {
  ASIGNADA: 'bg-slate-100 text-slate-700',
  EN_CURSO: 'bg-green-100 text-green-800',
  FINALIZADA: 'bg-blue-100 text-blue-800',
  ENVIADA: 'bg-blue-100 text-blue-800'
};

export function VisitasHoy() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    api.get('/visitas', { params: { tecnicoId: user?.tecnicoId } })
      .then(r => setVisitas(r.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Hola, {user?.nombre} 👋</h1>
        <p className="text-slate-500">Tienes {visitas.length} visita(s) asignada(s)</p>
      </div>

      <div className="space-y-3">
        {visitas.map(v => (
          <Link key={v.id} to={'/visitas/' + v.id}>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'px-2.5 py-0.5 rounded-full text-xs font-medium ' + estadoColor[v.estado]}>
                      {v.estado.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{v.folio}</span>
                  </div>
                  <p className="font-semibold">{v.cliente.razonSocial}</p>
                  <p className="text-sm text-slate-500">{v.sede.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {v.tipoServicio} · {new Date(v.fechaProgramada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </div>
          </Link>
        ))}
        {visitas.length === 0 && (
          <div className="bg-white p-8 rounded-xl text-center text-slate-500">
            No tienes visitas asignadas
          </div>
        )}
      </div>
    </div>
  );
}
`);

writeFile(path.join(FRONTEND, 'src', 'pages', 'VisitaDetalle.jsx'), `
import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

const estadoOpts = ['OPTIMO', 'CON_FALLAS', 'CRITICO'];
const catOpts = ['FALLA', 'TRABAJO', 'ESTADO'];
const catColor = { FALLA: 'bg-red-600', TRABAJO: 'bg-green-600', ESTADO: 'bg-blue-600' };

export function VisitaDetalle() {
  const { id } = useParams();
  const [visita, setVisita] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('obs');
  const [cat, setCat] = useState('FALLA');
  const [desc, setDesc] = useState('');
  const [cotItems, setCotItems] = useState([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  const [mostrarCot, setMostrarCot] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  const cargar = async () => {
    const [v, f] = await Promise.all([
      api.get('/visitas/' + id),
      api.get('/fotos/visita/' + id)
    ]);
    setVisita(v.data);
    setFotos(f.data);
    if (v.data.cotizacion) {
      setMostrarCot(true);
      setCotItems(v.data.cotizacion.items.map(i => ({
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario
      })));
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const mostrarMsg = (texto) => {
    setMsg(texto);
    setTimeout(() => setMsg(''), 3000);
  };

  const checkin = async () => {
    await api.post('/visitas/' + id + '/checkin');
    await cargar();
    mostrarMsg('✅ Check-in registrado');
  };

  const checkout = async () => {
    await api.post('/visitas/' + id + '/checkout');
    await cargar();
    mostrarMsg('✅ Check-out registrado');
  };

  const guardar = async (data) => {
    await api.patch('/visitas/' + id, data);
    mostrarMsg('💾 Guardado');
    cargar();
  };

  const toggleCheck = async (item) => {
    await api.patch('/visitas/' + id + '/checklist', [
      { id: item.id, completado: !item.completado, nota: item.nota }
    ]);
    cargar();
  };

  const subirFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('categoria', cat);
    if (desc) form.append('descripcion', desc);
    try {
      await api.post('/fotos/' + id, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDesc('');
      if (fileRef.current) fileRef.current.value = '';
      await cargar();
      mostrarMsg('📷 Foto subida');
    } catch (err) {
      mostrarMsg('❌ ' + (err.response?.data?.message || 'Error'));
    }
  };

  const eliminarFoto = async (fid) => {
    if (!confirm('¿Eliminar foto?')) return;
    await api.delete('/fotos/' + fid);
    cargar();
  };

  const guardarCot = async () => {
    const items = cotItems.filter(i => i.descripcion.trim());
    if (items.length === 0) return mostrarMsg('❌ Agrega ítems');
    try {
      await api.post('/cotizaciones/visita/' + id, {
        items,
        validezDias: 15,
        ivaPorcentaje: 19
      });
      await cargar();
      mostrarMsg('✅ Cotización creada');
    } catch (err) {
      mostrarMsg('❌ ' + (err.response?.data?.message || 'Error'));
    }
  };

  const enviarCot = async () => {
    if (!visita.cotizacion) return;
    await api.post('/cotizaciones/' + visita.cotizacion.id + '/enviar');
    await cargar();
    mostrarMsg('📧 Cotización enviada');
  };

  const copiarLink = () => {
    const url = window.location.origin + '/cotizacion/' + visita.cotizacion.tokenAprobacion;
    navigator.clipboard.writeText(url);
    mostrarMsg('📋 Link copiado');
  };

  const verPDF = () => {
    window.open('http://localhost:3001/api/pdf/visita/' + id + '?token=' + localStorage.getItem('auth'), '_blank');
  };

  const finalizar = async () => {
    if (!confirm('¿Finalizar visita?')) return;
    await api.post('/visitas/' + id + '/finalizar');
    await cargar();
    mostrarMsg('✅ Visita finalizada');
  };

  const firmar = () => {
    const nombre = prompt('Nombre de quien firma');
    if (!nombre) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 100);
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 2;
    ctx.font = 'italic 30px cursive';
    ctx.fillStyle = '#1a2332';
    ctx.fillText(nombre, 20, 60);
    const dataUrl = canvas.toDataURL();
    api.post('/visitas/' + id + '/firma', { firmaDataUrl: dataUrl, nombreFirmante: nombre })
      .then(() => {
        cargar();
        mostrarMsg('✍️ Firma guardada');
      });
  };

  if (loading || !visita) return <p className="p-4">Cargando...</p>;

  const subtotal = cotItems.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-blue-600 hover:underline">← Volver</Link>

      {msg && (
        <div className="fixed top-4 right-4 bg-blue-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-blue-900">{visita.cliente.razonSocial}</h1>
        <p className="text-slate-500">{visita.sede.nombre} · {visita.folio} · {visita.tipoServicio}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {!visita.horaCheckin && (
            <button onClick={checkin} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              Iniciar visita
            </button>
          )}
          {visita.horaCheckin && !visita.horaCheckout && (
            <button onClick={checkout} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">
              Marcar check-out
            </button>
          )}
          {visita.horaCheckin && visita.estado !== 'ENVIADA' && (
            <button onClick={finalizar} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">
              📧 Finalizar
            </button>
          )}
          {visita.firmaClienteUrl ? (
            <span className="text-sm text-green-700 self-center">✍️ Firmada por {visita.firmaClienteNombre}</span>
          ) : (
            <button onClick={firmar} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600">
              ✍️ Firmar
            </button>
          )}
          <button onClick={() => window.open('http://localhost:3001/api/pdf/visita/' + id, '_blank')} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">
            📄 Ver reporte
          </button>
        </div>
        {visita.estado === 'ENVIADA' && (
          <p className="text-sm text-green-700 mt-2">✅ Visita enviada al cliente</p>
        )}
      </div>

      <div className="flex gap-2 border-b">
        {[
          { id: 'obs', label: 'Observaciones' },
          { id: 'check', label: 'Checklist (' + visita.checklist.filter(c => c.completado).length + '/' + visita.checklist.length + ')' },
          { id: 'fotos', label: 'Fotos (' + fotos.length + '/6)' },
          { id: 'cot', label: 'Cotización' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={'px-4 py-2 text-sm font-medium border-b-2 ' +
              (tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'obs' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Estado general del sistema</label>
            <div className="flex gap-2">
              {estadoOpts.map(e => (
                <button
                  key={e}
                  onClick={() => guardar({ estadoGeneral: e })}
                  className={'px-3 py-1.5 rounded-lg text-sm font-medium ' +
                    (visita.estadoGeneral === e
                      ? (e === 'OPTIMO' ? 'bg-green-600 text-white' : e === 'CON_FALLAS' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white')
                      : 'bg-slate-100 text-slate-700')}
                >
                  {e.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Observaciones técnicas</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
              defaultValue={visita.observaciones || ''}
              onBlur={e => guardar({ observaciones: e.target.value })}
              placeholder="Describe lo que encontraste..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Requerimientos del cliente</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg min-h-[80px]"
              defaultValue={visita.requerimientosCliente || ''}
              onBlur={e => guardar({ requerimientosCliente: e.target.value })}
              placeholder="Lo que pidió el cliente..."
            />
          </div>
        </div>
      )}

      {tab === 'check' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
          {visita.checklist.map(c => (
            <label key={c.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={c.completado}
                onChange={() => toggleCheck(c)}
                className="w-4 h-4"
              />
              <span className={c.completado ? 'line-through text-slate-400' : ''}>{c.descripcion}</span>
            </label>
          ))}
        </div>
      )}

      {tab === 'fotos' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex gap-2">
              {catOpts.map(c => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={'px-3 py-1 rounded text-xs font-medium ' +
                    (cat === c ? catColor[c] + ' text-white' : 'bg-white border')}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={subirFoto}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={fotos.length >= 6}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              📷 Subir foto ({fotos.length}/6)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fotos.map(f => (
              <div key={f.id} className="relative border rounded-lg overflow-hidden group">
                <img src={f.urlAbsoluta} alt="" className="w-full h-32 object-cover" />
                <div className="p-2 bg-slate-50 text-xs">
                  <span className={'inline-block px-1.5 py-0.5 rounded text-white text-[10px] mr-1 ' + catColor[f.categoria]}>
                    {f.categoria}
                  </span>
                  {f.descripcion || 'Sin descripción'}
                </div>
                <button
                  onClick={() => eliminarFoto(f.id)}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-sm opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cot' && (
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          {!visita.cotizacion ? (
            <>
              <p className="text-sm text-slate-500">Crea una cotización si detectas algo que requiera inversión.</p>
              {cotItems.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input
                    placeholder="Descripción"
                    value={it.descripcion}
                    onChange={e => {
                      const c = [...cotItems];
                      c[i].descripcion = e.target.value;
                      setCotItems(c);
                    }}
                    className="col-span-5 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="number"
                    value={it.cantidad}
                    onChange={e => {
                      const c = [...cotItems];
                      c[i].cantidad = Number(e.target.value);
                      setCotItems(c);
                    }}
                    className="col-span-2 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Precio"
                    value={it.precioUnitario}
                    onChange={e => {
                      const c = [...cotItems];
                      c[i].precioUnitario = Number(e.target.value);
                      setCotItems(c);
                    }}
                    className="col-span-3 px-2 py-1 border rounded text-sm"
                  />
                  <div className="col-span-1 text-sm text-right self-center">
                    
                  </div>
                  <button
                    onClick={() => setCotItems(cotItems.filter((_, j) => j !== i))}
                    className="col-span-1 text-red-500 text-lg"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => setCotItems([...cotItems, { descripcion: '', cantidad: 1, precioUnitario: 0 }])}
                className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium"
              >
                + Agregar ítem
              </button>
              <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between"><span>IVA (19%)</span><span>{iva.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{total.toLocaleString('es-CO')}</span></div>
              </div>
              <button
                onClick={guardarCot}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Guardar cotización
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Cotización {visita.cotizacion.numero}</h3>
                <span className={'px-2 py-1 rounded text-xs font-medium ' +
                  (visita.cotizacion.estado === 'APROBADA' ? 'bg-green-100 text-green-800' :
                   visita.cotizacion.estado === 'RECHAZADA' ? 'bg-red-100 text-red-800' :
                   visita.cotizacion.estado === 'ENVIADA' ? 'bg-amber-100 text-amber-800' :
                   'bg-slate-100 text-slate-700')}>
                  {visita.cotizacion.estado}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {visita.cotizacion.items.map((it, i) => (
                  <div key={i} className="flex justify-between border-b py-1">
                    <span>{it.cantidad}x {it.descripcion}</span>
                    <span>{it.totalLinea.toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{visita.cotizacion.subtotal.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between"><span>IVA</span><span>{visita.cotizacion.iva.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{visita.cotizacion.total.toLocaleString('es-CO')}</span></div>
              </div>
              {visita.cotizacion.estado === 'BORRADOR' && (
                <button onClick={enviarCot} className="w-full bg-green-600 text-white py-2 rounded-lg font-medium">
                  📧 Enviar al cliente
                </button>
              )}
              {visita.cotizacion.estado === 'ENVIADA' && visita.cotizacion.tokenAprobacion && (
                <button onClick={copiarLink} className="w-full bg-amber-500 text-white py-2 rounded-lg font-medium">
                  📋 Copiar link de aprobación
                </button>
              )}
              {visita.cotizacion.estado === 'APROBADA' && (
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  ✅ Aprobada por {visita.cotizacion.aprobadaPorNombre} ({visita.cotizacion.aprobadaPorCargo})
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
`);

writeFile(path.join(FRONTEND, 'src', 'pages', 'Dashboard.jsx'), `
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [campo, setCampo] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/resumen-hoy'),
      api.get('/dashboard/tecnicos-en-campo'),
      api.get('/dashboard/visitas-del-dia'),
      api.get('/dashboard/alertas')
    ]).then(([r, c, v, a]) => {
      setResumen(r.data);
      setCampo(c.data);
      setVisitas(v.data);
      setAlertas(a.data);
    });
  }, []);

  if (!resumen) return <p>Cargando dashboard...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700">Visitas hoy</p>
          <p className="text-3xl font-bold text-blue-900">{resumen.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-medium text-green-700">En curso</p>
          <p className="text-3xl font-bold text-green-900">{resumen.enCurso}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-700">Finalizadas</p>
          <p className="text-3xl font-bold text-blue-900">{resumen.finalizadas}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700">Cot. pendientes</p>
          <p className="text-3xl font-bold text-amber-900">{resumen.pendientesCotizacion}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-4 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-3">Técnicos en campo ({campo.length})</h2>
          {campo.length === 0 ? (
            <p className="text-sm text-slate-400">Ninguno en campo ahora</p>
          ) : (
            <div className="space-y-2">
              {campo.map(t => (
                <div key={t.visitaId} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="font-medium text-sm">{t.tecnico}</p>
                      <p className="text-xs text-slate-500">{t.cliente} · {t.sede}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    desde {new Date(t.horaCheckin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-3">Alertas ({alertas.length})</h2>
          {alertas.length === 0 ? (
            <p className="text-sm text-slate-400">Sin alertas activas</p>
          ) : (
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div key={i} className={'p-2 rounded border-l-4 text-xs ' +
                  (a.severidad === 'alta' ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50')}>
                  ⚠️ {a.mensaje}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm overflow-x-auto">
        <h2 className="font-semibold mb-3">Visitas del día</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="pb-2">Folio</th>
              <th className="pb-2">Cliente</th>
              <th className="pb-2">Sede</th>
              <th className="pb-2">Técnico</th>
              <th className="pb-2">Estado</th>
              <th className="pb-2">Hora</th>
            </tr>
          </thead>
          <tbody>
            {visitas.map(v => (
              <tr key={v.id} className="border-b hover:bg-slate-50">
                <td className="py-2 text-xs text-slate-400">{v.folio}</td>
                <td className="py-2">{v.cliente.razonSocial}</td>
                <td className="py-2 text-slate-500">{v.sede.nombre}</td>
                <td className="py-2 text-slate-500">{v.tecnico.usuario.nombre}</td>
                <td className="py-2">
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100">{v.estado.replace('_', ' ')}</span>
                </td>
                <td className="py-2 text-slate-500">
                  {new Date(v.fechaProgramada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

writeFile(path.join(FRONTEND, 'src', 'pages', 'CotizacionPublica.jsx'), `
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

export function CotizacionPublica() {
  const { token } = useParams();
  const [cot, setCot] = useState(null);
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [estado, setEstado] = useState('pendiente');

  useEffect(() => {
    api.get('/cotizaciones/publica/' + token)
      .then(r => {
        setCot(r.data);
        if (r.data.estado === 'APROBADA') setEstado('aprobada');
        if (r.data.estado === 'RECHAZADA') setEstado('rechazada');
      })
      .catch(() => alert('Cotización no encontrada'));
  }, [token]);

  const aprobar = async () => {
    if (!nombre.trim()) return alert('Escribe tu nombre');
    await api.post('/cotizaciones/publica/' + token + '/aprobar', { nombre, cargo });
    setEstado('aprobada');
  };

  const rechazar = async () => {
    const razon = prompt('Motivo (opcional)');
    await api.post('/cotizaciones/publica/' + token + '/rechazar', { razon });
    setEstado('rechazada');
  };

  if (!cot) return <p className="p-8 text-center">Cargando...</p>;

  const fmt = n => '$' + n.toLocaleString('es-CO');

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-blue-900">Cotización {cot.numero}</h1>
            <p className="text-sm text-slate-500">{cot.visita.cliente.razonSocial} · {cot.visita.sede.nombre}</p>
          </div>
          <div className="space-y-1 text-sm">
            {cot.items.map(it => (
              <div key={it.id} className="flex justify-between border-b py-1">
                <span>{it.cantidad}x {it.descripcion}</span>
                <span>{fmt(it.totalLinea)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(cot.subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA</span><span>{fmt(cot.iva)}</span></div>
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>{fmt(cot.total)}</span></div>
          </div>
        </div>

        {estado === 'pendiente' && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-3">
            <h2 className="font-semibold">¿Apruebas esta cotización?</h2>
            <input
              placeholder="Tu nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Tu cargo"
              value={cargo}
              onChange={e => setCargo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <div className="flex gap-2">
              <button onClick={aprobar} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium">
                ✅ Aprobar
              </button>
              <button onClick={rechazar} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium">
                ❌ Rechazar
              </button>
            </div>
          </div>
        )}

        {estado === 'aprobada' && (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="font-semibold text-green-700">Cotización aprobada</h2>
            <p className="text-sm text-slate-500">Gracias, nos pondremos en contacto.</p>
          </div>
        )}

        {estado === 'rechazada' && (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-4xl mb-2">❌</div>
            <h2 className="font-semibold text-red-700">Cotización rechazada</h2>
          </div>
        )}
      </div>
    </div>
  );
}
`);

// ============================================================
// INSTALACIÓN
// ============================================================
console.log('\n📥 Instalando dependencias del backend...\n');
run('npm install', BACKEND);

console.log('\n📥 Instalando dependencias del frontend...\n');
run('npm install', FRONTEND);

console.log('\n🗄️  Creando base de datos...\n');
run('npx prisma db push', BACKEND);

console.log('\n🌱 Cargando datos de prueba...\n');
run('node seed.js', BACKEND);

// ============================================================
// INSTRUCCIONES FINALES
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('✅ ¡SISTEMA LISTO PARA PROBAR!');
console.log('='.repeat(60));
console.log('\n📌 Abre DOS terminales nuevas y ejecuta:\n');
console.log('   Terminal 1 (backend):');
console.log('   cd backend && npm start\n');
console.log('   Terminal 2 (frontend):');
console.log('   cd frontend && npm run dev\n');
console.log('🌐 Luego abre en tu navegador:');
console.log('   http://localhost:5173\n');
console.log('👤 Credenciales de prueba:');
console.log('   Técnico:  tecnico@test.com / tecnico123');
console.log('   Admin:    admin@test.com / admin123\n');
console.log('🧪 Prueba completa:');
console.log('   1. Login como técnico');
console.log('   2. Abrir la visita del día');
console.log('   3. Iniciar visita (check-in)');
console.log('   4. Llenar observaciones');
console.log('   5. Marcar checklist');
console.log('   6. Subir 3 fotos');
console.log('   7. Crear cotización');
console.log('   8. Firmar');
console.log('   9. Finalizar visita');
console.log('   10. Ver el reporte HTML generado');
console.log('   11. Enviar cotización → copiar link');
console.log('   12. Abrir el link → aprobar como cliente');
console.log('   13. Login como admin → ver Dashboard\n');
console.log('📁 Ubicación del proyecto:');
console.log('   ' + ROOT + '\n');
console.log('='.repeat(60) + '\n');