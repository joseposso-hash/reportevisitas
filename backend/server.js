require('dotenv').config();
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

app.use(app.use(cors({ origin: '*' })););
app.use(express.json({ limit: '10mb' }));

// Uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
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
  const base64 = firmaDataUrl.replace(/^data:image\/\w+;base64,/, '');
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
    const html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Reporte</title><style>body{font-family:sans-serif;padding:40px;color:#1a2332;}h1{color:#0f2a4a;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left;}.box{background:#f1f5fb;padding:15px;border-left:4px solid #2563eb;margin:15px 0;}</style></head><body>" +
    "<h1>REPORTE TÉCNICO - " + visita.folio + "</h1>" +
    "<p><strong>Cliente:</strong> " + visita.cliente.razonSocial + "</p>" +
    "<p><strong>Fecha:</strong> " + new Date().toLocaleString('es-CO') + "</p>" +
    "<div class='box'><strong>Observaciones:</strong><br/>" + (visita.observaciones || 'Ninguna') + "</div>" +
    "<h3>Cotización:</h3>" +
    (visita.cotizacion ? "<p>Total: $" + visita.cotizacion.total.toLocaleString('es-CO') + "</p>" : "<p>Sin cotización</p>") +
    "<p><em>El reporte visual completo se genera correctamente en la versión de producción.</em></p>" +
    "</body></html>";

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// ============ START ============
app.listen(PORT, () => {
  console.log('\n🚀 Backend en http://localhost:' + PORT + '/api');
  console.log('📁 Uploads en http://localhost:' + PORT + '/uploads\n');
});
