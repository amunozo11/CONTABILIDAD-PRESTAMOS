import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { ResponseHelper } from '../../shared/utils/responses';
import { CobroModel } from '../../models/Cobro.model';
import { PrestamoModel } from '../../models/Prestamo.model';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfMonth, endOfMonth } from 'date-fns';

// Imports dinámicos para PDF/Excel (pesados — solo cuando se usan)
const router = Router();
const TZ = 'America/Bogota';
router.use(authMiddleware);

function getRangoMes(mes?: string) {
  const base = mes ? new Date(mes + '-01') : new Date();
  const zonada = toZonedTime(base, TZ);
  return {
    desde: fromZonedTime(startOfMonth(zonada), TZ),
    hasta: fromZonedTime(endOfMonth(zonada), TZ),
  };
}

// ─── Exportar cobros (CSV / Excel / PDF) ─────────────────────
router.get('/cobros', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formato = (req.query['formato'] as string) || 'csv';
    const { desde, hasta } = getRangoMes(req.query['mes'] as string);

    const cobros = await CobroModel.find({ fecha: { $gte: desde, $lte: hasta }, anulado: false })
      .populate('cliente', 'nombre cedula')
      .populate('cobrador', 'nombre')
      .sort({ fecha: -1 })
      .lean();

    const filas = cobros.map((c) => ({
      Fecha: new Date(c.fecha).toLocaleDateString('es-CO'),
      Hora: c.hora,
      Cliente: (c.cliente as { nombre?: string })?.nombre ?? '',
      Cedula: (c.cliente as { cedula?: string })?.cedula ?? '',
      Cobrador: (c.cobrador as { nombre?: string })?.nombre ?? '',
      Monto: c.monto,
      Tipo: c.tipo,
      SaldoDespues: c.saldoDespues,
    }));

    if (formato === 'csv') {
      const header = Object.keys(filas[0] ?? {}).join(',');
      const rows = filas.map((f) => Object.values(f).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=cobros_${Date.now()}.csv`);
      res.send('\uFEFF' + header + '\n' + rows); // BOM para Excel
    } else if (formato === 'excel') {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(filas);
      XLSX.utils.book_append_sheet(wb, ws, 'Cobros');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=cobros_${Date.now()}.xlsx`);
      res.send(buf);
    } else {
      ResponseHelper.error(res, 'Formato no soportado. Usa: csv, excel', 400);
    }
  } catch (error) { next(error); }
});

// ─── Exportar préstamos ───────────────────────────────────────
router.get('/prestamos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formato = (req.query['formato'] as string) || 'csv';

    const prestamos = await PrestamoModel.find({ estado: 'activo' })
      .populate('cliente', 'nombre cedula celular ciudad')
      .populate('cobrador', 'nombre')
      .lean();

    const filas = prestamos.map((p) => ({
      Cliente: (p.cliente as { nombre?: string })?.nombre ?? '',
      Cedula: (p.cliente as { cedula?: string })?.cedula ?? '',
      Cobrador: (p.cobrador as { nombre?: string })?.nombre ?? '',
      Capital: p.capital,
      TotalPagar: p.totalPagar,
      SaldoPendiente: p.saldoPendiente,
      TotalCobrado: p.totalCobrado,
      Ganancia: p.ganancia,
      FechaInicio: new Date(p.fechaInicio).toLocaleDateString('es-CO'),
      FechaFin: new Date(p.fechaFin).toLocaleDateString('es-CO'),
      Estado: p.estado,
    }));

    if (formato === 'csv') {
      const header = Object.keys(filas[0] ?? {}).join(',');
      const rows = filas.map((f) => Object.values(f).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=prestamos_${Date.now()}.csv`);
      res.send('\uFEFF' + header + '\n' + rows);
    } else if (formato === 'excel') {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), 'Prestamos');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=prestamos_${Date.now()}.xlsx`);
      res.send(buf);
    } else {
      ResponseHelper.error(res, 'Formato no soportado', 400);
    }
  } catch (error) { next(error); }
});

export default router;
