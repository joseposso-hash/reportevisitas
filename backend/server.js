require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secreto-local';
const PORT = process.env.PORT || 3001;

// ============ CONFIGURACIÓN DE CORS ============
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// ============ CONFIGURACIÓN DE UPLOADS (Memoria para Base64) ============
const upload = multer({ storage: multer.memoryStorage() });

// ============ MIDDLEWARE DE AUTENTICACIÓN ============
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

// ============ RUTAS DE AUTENTICACIÓN ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.usuario.findUnique({ where: { email }, include: { tecnico: true } });
    
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
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ============ RUTAS DE VISITAS ============
app.get('/api/visitas', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.tecnicoId) where.tecnicoId = req.query.tecnicoId;
    const visitas = await prisma.visita.findMany({
      where,
      include: { cliente: true, sede: true, tecnico: { include: { usuario: true } } },
      orderBy: { fechaProgramada: 'asc' }
    });
    res.json(visitas);
  } catch (error) {
    console.error('Error en /api/visitas:', error);
    res.status(500).json({ message: 'Error interno al obtener visitas', error: error.message });
  }
});

app.get('/api/visitas/:id', auth, async (req, res) => {
  try {
    const visita = await prisma.visita.findUnique({
      where: { id: req.params.id },
      include: { cliente: true, sede: { include: { equipos: { include: { fotos: true } } } }, tecnico: { include: { usuario: true } }, checklist: true, fotos: true, cotizacion: { include: { items: true } } }
    });
    if (!visita) return res.status(404).json({ message: 'Visita no encontrada' });
    res.json(visita);
  } catch (error) {
    console.error('Error en /api/visitas/:id:', error);
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
});

app.patch('/api/visitas/:id', auth, async (req, res) => {
  try {
    const v = await prisma.visita.update({ where: { id: req.params.id }, data: req.body });
    res.json(v);
  } catch (error) {
    console.error('Error en PATCH /api/visitas/:id:', error);
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
});

// ============ RUTAS DE EQUIPOS ============
app.get('/api/equipos/sede/:sedeId', auth, async (req, res) => {
  try {
    const equipos = await prisma.equipo.findMany({
      where: { sedeId: req.params.sedeId },
      include: { fotos: true },
      orderBy: { tipo: 'asc' }
    });
    res.json(equipos);
  } catch (error) {
    console.error('Error en /api/equipos/sede:', error);
    res.status(500).json({ message: 'Error al obtener equipos', error: error.message });
  }
});

app.patch('/api/equipos/:id', auth, async (req, res) => {
  try {
    const { estadoFisico, estadoFuncional, observaciones, ip, usuario, clave } = req.body;
    const data = {};
    if (estadoFisico) data.estadoFisico = estadoFisico;
    if (estadoFuncional) data.estadoFuncional = estadoFuncional;
    if (observaciones !== undefined) data.observaciones = observaciones;
    if (ip !== undefined) data.ip = ip;
    if (usuario !== undefined) data.usuario = usuario;
    if (clave !== undefined) data.clave = clave;

    const equipo = await prisma.equipo.update({ where: { id: req.params.id }, data });
    res.json(equipo);
  } catch (error) {
    console.error('Error en PATCH /api/equipos/:id:', error);
    res.status(500).json({ message: 'Error al actualizar equipo', error: error.message });
  }
});

// ============ RUTAS DE FOTOS DE EQUIPOS (BASE64) ============
app.post('/api/equipos/:id/foto', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se subió ninguna foto' });
    
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const base64String = `data:${mimeType};base64,${base64Image}`;

    const foto = await prisma.fotoEquipo.create({
      data: {
        equipoId: req.params.id,
        base64: base64String,
        descripcion: req.body.descripcion || null
      }
    });
    res.json(foto);
  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ message: 'Error al subir foto', error: error.message });
  }
});

app.delete('/api/fotos-equipo/:id', auth, async (req, res) => {
  try {
    const foto = await prisma.fotoEquipo.findUnique({ where: { id: req.params.id } });
    if (!foto) return res.status(404).json({ message: 'Foto no encontrada' });

    await prisma.fotoEquipo.delete({ where: { id: req.params.id } });
    res.json({ ok: true, message: 'Foto eliminada' });
  } catch (error) {
    console.error('Error al eliminar foto:', error);
    res.status(500).json({ message: 'Error al eliminar foto', error: error.message });
  }
});

// ============ GENERAR PDF GENERAL ============
app.get('/api/visitas/:id/pdf-general', auth, async (req, res) => {
  try {
    const visita = await prisma.visita.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        sede: { include: { equipos: true } },
        tecnico: { include: { usuario: true } },
        cotizacion: { include: { items: true } }
      }
    });

    if (!visita) return res.status(404).json({ message: 'Visita no encontrada' });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Reporte-General-${visita.folio}.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).fillColor('#1e3a8a').text('N24 SEGURIDAD ELECTRÓNICA', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text('REPORTE GENERAL DE MANTENIMIENTO PREVENTIVO', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#000000');
    doc.text(`CLIENTE: ${visita.cliente.razonSocial}    |    FECHA: ${new Date(visita.fechaProgramada).toLocaleDateString('es-CO')}`);
    doc.text(`DIRECCIÓN: ${visita.sede.direccion || 'N/A'}    |    TELÉFONO: ${visita.cliente.contactoTel || 'N/A'}`);
    doc.text(`TÉCNICO: ${visita.tecnico.usuario.nombre}`);
    doc.moveDown(1);

    const colX = [30, 80, 200, 270, 340, 400, 460, 510, 560];
    const colW = [50, 120, 70, 70, 60, 60, 50, 50, 50];
    const rowH = 18;
    let y = doc.y;

    doc.rect(30, y, 540, rowH).fill('#1e3a8a');
    doc.fillColor('#ffffff').fontSize(8);
    doc.text('ITEM', colX[0] + 2, y + 5, { width: colW[0] });
    doc.text('DESCRIPCIÓN', colX[1] + 2, y + 5, { width: colW[1] });
    doc.text('MODELO', colX[2] + 2, y + 5, { width: colW[2] });
    doc.text('MARCA', colX[3] + 2, y + 5, { width: colW[3] });
    doc.text('DIR IP', colX[4] + 2, y + 5, { width: colW[4] });
    doc.text('SERIAL', colX[5] + 2, y + 5, { width: colW[5] });
    doc.text('USER', colX[6] + 2, y + 5, { width: colW[6] });
    doc.text('CLAVE', colX[7] + 2, y + 5, { width: colW[7] });
    y += rowH;

    doc.fillColor('#000000');
    visita.sede.equipos.forEach((eq, i) => {
      doc.rect(30, y, 540, rowH).fill(i % 2 === 0 ? '#f8fafc' : '#ffffff');
      doc.fillColor('#000000').fontSize(7);
      doc.text((i + 1).toString(), colX[0] + 2, y + 5, { width: colW[0] });
      doc.text(`${eq.tipo} ${eq.ubicacion || ''}`, colX[1] + 2, y + 5, { width: colW[1] });
      doc.text(eq.modelo || 'N/A', colX[2] + 2, y + 5, { width: colW[2] });
      doc.text(eq.marca || 'N/A', colX[3] + 2, y + 5, { width: colW[3] });
      doc.text(eq.ip || 'N/A', colX[4] + 2, y + 5, { width: colW[4] });
      doc.text(eq.serial || 'N/A', colX[5] + 2, y + 5, { width: colW[5] });
      doc.text(eq.usuario || 'admin', colX[6] + 2, y + 5, { width: colW[6] });
      doc.text(eq.clave || '*****', colX[7] + 2, y + 5, { width: colW[7] });
      y += rowH;
    });

    if (visita.cotizacion) {
      doc.moveDown(2);
      doc.fontSize(12).fillColor('#1e3a8a').text('4. COTIZACIÓN ANEXA');
      doc.fontSize(10).fillColor('#000000');
      doc.moveDown(0.5);
      
      const cot = visita.cotizacion;
      doc.text(`N° Cotización: ${cot.numero}`);
      doc.text(`Total: $${cot.total.toLocaleString('es-CO')}`);
      doc.moveDown(0.5);
      
      const startY = doc.y;
      doc.rect(30, startY, 540, 20).fill('#1e3a8a');
      doc.fontSize(8).fillColor('#ffffff');
      doc.text('Descripción', 35, startY + 5);
      doc.text('Cant', 400, startY + 5);
      doc.text('Precio Unit', 450, startY + 5);
      doc.text('Total', 520, startY + 5);
      
      let currentY = startY + 20;
      doc.fillColor('#000000');
      cot.items.forEach((it, i) => {
        doc.rect(30, currentY, 540, 18).fill(i % 2 === 0 ? '#f8fafc' : '#ffffff');
        doc.fillColor('#000000').fontSize(8);
        doc.text(it.descripcion, 35, currentY + 4);
        doc.text(it.cantidad.toString(), 400, currentY + 4);
        doc.text(`$${it.precioUnitario.toLocaleString('es-CO')}`, 450, currentY + 4);
        doc.text(`$${it.totalLinea.toLocaleString('es-CO')}`, 520, currentY + 4);
        currentY += 18;
      });
    }

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).send('Error generando PDF');
  }
});

// ============ GENERAR HOJA DE VIDA ============
app.get('/api/equipos/:id/pdf', auth, async (req, res) => {
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id: req.params.id },
      include: { sede: { include: { cliente: true } }, fotos: true }
    });

    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="HojaVida-${equipo.serial || equipo.id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).fillColor('#1e3a8a').text('N24 SEGURIDAD ELECTRÓNICA', { align: 'center' });
    doc.fontSize(12).fillColor('#64748b').text('HOJA DE VIDA DEL EQUIPO', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(10).fillColor('#000000');
    doc.text(`Cliente: ${equipo.sede.cliente.razonSocial}`);
    doc.text(`Sede: ${equipo.sede.nombre}`);
    doc.text(`Tipo de Equipo: ${equipo.tipo}`);
    doc.text(`Marca / Modelo: ${equipo.marca || 'N/A'} / ${equipo.modelo || 'N/A'}`);
    doc.text(`Serial: ${equipo.serial || 'N/A'}`);
    doc.text(`Ubicación: ${equipo.ubicacion || 'N/A'}`);
    doc.text(`IP: ${equipo.ip || 'N/A'}`);
    doc.text(`Usuario: ${equipo.usuario || 'N/A'}`);
    doc.text(`Clave: ${equipo.clave || 'N/A'}`);
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#1e3a8a').text('ESTADO DEL MANTENIMIENTO');
    doc.fontSize(10).fillColor('#000000');
    doc.text(`Estado Físico: ${equipo.estadoFisico || 'No evaluado'}`);
    doc.text(`Estado Funcional: ${equipo.estadoFuncional || 'No evaluado'}`);
    doc.text(`Observaciones: ${equipo.observaciones || 'Sin observaciones'}`);
    doc.moveDown(1.5);

    if (equipo.fotos.length > 0) {
      doc.fontSize(12).fillColor('#1e3a8a').text('EVIDENCIA FOTOGRÁFICA');
      doc.moveDown(0.5);
      
      let x = 50;
      let y = doc.y;
      
      for (let i = 0; i < equipo.fotos.length; i++) {
        const foto = equipo.fotos[i];
        if (i > 0 && i % 2 === 0) {
          x = 50;
          y += 190;
        }
        
        if (foto.base64) {
          const base64Data = foto.base64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          doc.image(buffer, x, y, { width: 220, height: 150 });
        }
        
        if (foto.descripcion) {
          doc.fontSize(8).fillColor('#475569').text(foto.descripcion, x, y + 155, { width: 220, align: 'center' });
        }
        
        x += 240;
      }
    }

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).send('Error generando PDF');
  }
});

// ============ RUTAS DE COTIZACIONES ============
app.post('/api/cotizaciones/visita/:visitaId', auth, async (req, res) => {
  try {
    const { items, notas, validezDias = 15, ivaPorcentaje = 19 } = req.body;
    
    const existente = await prisma.cotizacion.findUnique({ where: { visitaId: req.params.visitaId } });
    if (existente) return res.status(400).json({ message: 'Ya existe cotización para esta visita' });

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
  } catch (error) {
    console.error('Error en crear cotización:', error);
    res.status(500).json({ message: 'Error al crear cotización', error: error.message });
  }
});

app.get('/api/cotizaciones/visita/:visitaId', auth, async (req, res) => {
  try {
    const cot = await prisma.cotizacion.findUnique({
      where: { visitaId: req.params.visitaId },
      include: { items: true }
    });
    res.json(cot);
  } catch (error) {
    console.error('Error en obtener cotización:', error);
    res.status(500).json({ message: 'Error al obtener cotización', error: error.message });
  }
});
// ============ RUTAS DE CLIENTES Y SEDES ============
app.get('/api/clientes', auth, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: { sedes: true },
      orderBy: { razonSocial: 'asc' }
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
  }
});

app.post('/api/clientes', auth, async (req, res) => {
  try {
    const { razonSocial, nit, contactoNom, contactoTel, contactoMail, direccion, ciudad } = req.body;
    const cliente = await prisma.cliente.create({
      data: { razonSocial, nit, contactoNom, contactoTel, contactoMail, direccion, ciudad }
    });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear cliente', error: error.message });
  }
});

app.post('/api/sedes', auth, async (req, res) => {
  try {
    const { clienteId, nombre, direccion, ciudad } = req.body;
    const sede = await prisma.sede.create({
      data: { clienteId, nombre, direccion, ciudad }
    });
    res.json(sede);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear sede', error: error.message });
  }
});

app.post('/api/equipos', auth, async (req, res) => {
  try {
    const { sedeId, tipo, marca, modelo, serial, ubicacion } = req.body;
    const equipo = await prisma.equipo.create({
      data: { sedeId, tipo, marca, modelo, serial, ubicacion }
    });
    res.json(equipo);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear equipo', error: error.message });
  }
});
// ============ INICIO DEL SERVIDOR ============
app.listen(PORT, () => {
  console.log(`\n🚀 Backend en http://localhost:${PORT}/api`);
});