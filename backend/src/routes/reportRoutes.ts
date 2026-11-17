import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/database.js';

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  // --- REAL-TIME SALES REPORT WITH TIMELINE FILTERING & ITEM-WISE / CATEGORY-WISE BREAKDOWN ---
  fastify.get('/api/v1/reports/sales', async (req: FastifyRequest<{
    Querystring: { outletId?: string; from?: string; to?: string };
  }>, reply: FastifyReply) => {
    const { outletId, from, to } = req.query;

    let billsSql = "SELECT * FROM bills WHERE status IN ('PAID', 'PARTIALLY_PAID')";
    const billsArgs: any[] = [];

    if (outletId) {
      billsSql += ' AND outlet_id = ?';
      billsArgs.push(outletId);
    }
    if (from) {
      billsSql += ' AND created_at >= ?';
      billsArgs.push(from);
    }
    if (to) {
      billsSql += ' AND created_at <= ?';
      billsArgs.push(to);
    }
    billsSql += ' ORDER BY created_at DESC';

    const billsRes = await db.execute({ sql: billsSql, args: billsArgs });

    let totalGrossSales = 0;
    let totalDiscount = 0;
    let totalNetTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalRevenue = 0;
    const billIds: string[] = [];
    const orderIds: string[] = [];

    for (const b of billsRes.rows) {
      billIds.push(String(b.id));
      orderIds.push(String(b.order_id));
      totalGrossSales += Number(b.subtotal);
      totalDiscount += Number(b.discount_amount);
      totalNetTaxable += Number(b.taxable_amount);
      totalCgst += Number(b.cgst_amount);
      totalSgst += Number(b.sgst_amount);
      totalRevenue += Number(b.total_amount);
    }

    const totalOrdersCount = billsRes.rows.length;
    const averageOrderValue = totalOrdersCount > 0 ? Number((totalRevenue / totalOrdersCount).toFixed(2)) : 0;

    // --- PAYMENT BREAKDOWN ---
    const paymentBreakdown: Record<string, { count: number; amount: number }> = {
      CASH: { count: 0, amount: 0 },
      UPI: { count: 0, amount: 0 },
      CARD: { count: 0, amount: 0 },
      OTHER: { count: 0, amount: 0 },
    };

    if (billIds.length > 0) {
      const placeholders = billIds.map(() => '?').join(',');
      const payRes = await db.execute({
        sql: `SELECT payment_method, COUNT(*) as cnt, SUM(amount) as total
              FROM payments
              WHERE bill_id IN (${placeholders}) AND status = 'SUCCESSFUL'
              GROUP BY payment_method`,
        args: billIds,
      });

      for (const p of payRes.rows) {
        const method = String(p.payment_method);
        paymentBreakdown[method] = {
          count: Number(p.cnt),
          amount: Number(p.total),
        };
      }
    }

    // --- ITEM-WISE SALES BREAKDOWN ---
    const itemSalesMap: Record<string, { id: string; name: string; quantity: number; revenue: number }> = {};
    if (orderIds.length > 0) {
      const orderPlaceholders = orderIds.map(() => '?').join(',');
      const itemRes = await db.execute({
        sql: `SELECT product_id, product_name_snapshot, SUM(quantity) as qty, SUM(line_total_snapshot) as rev
              FROM order_items
              WHERE order_id IN (${orderPlaceholders})
              GROUP BY product_id, product_name_snapshot
              ORDER BY rev DESC`,
        args: orderIds,
      });

      for (const row of itemRes.rows) {
        itemSalesMap[String(row.product_id)] = {
          id: String(row.product_id),
          name: String(row.product_name_snapshot),
          quantity: Number(row.qty),
          revenue: Number(row.rev),
        };
      }
    }

    const itemWiseSales = Object.values(itemSalesMap);

    // --- CATEGORY-WISE SALES BREAKDOWN ---
    const catSalesMap: Record<string, { name: string; quantity: number; revenue: number; percentage: number }> = {};
    if (orderIds.length > 0) {
      const orderPlaceholders = orderIds.map(() => '?').join(',');
      const catRes = await db.execute({
        sql: `SELECT c.name as category_name, SUM(oi.quantity) as qty, SUM(oi.line_total_snapshot) as rev
              FROM order_items oi
              INNER JOIN products p ON oi.product_id = p.id
              INNER JOIN categories c ON p.category_id = c.id
              WHERE oi.order_id IN (${orderPlaceholders})
              GROUP BY c.name
              ORDER BY rev DESC`,
        args: orderIds,
      });

      for (const row of catRes.rows) {
        const catName = String(row.category_name);
        const rev = Number(row.rev);
        const pct = totalGrossSales > 0 ? Number(((rev / totalGrossSales) * 100).toFixed(1)) : 0;
        catSalesMap[catName] = {
          name: catName,
          quantity: Number(row.qty),
          revenue: rev,
          percentage: pct,
        };
      }
    }

    const categoryWiseSales = Object.values(catSalesMap);

    // --- HOURLY SALES HEATMAP ---
    const hourlyHeatmap: { hour: string; orders: number; revenue: number }[] = [];
    for (let h = 10; h <= 23; h++) {
      const hourStr = `${String(h).padStart(2, '0')}:00`;
      hourlyHeatmap.push({
        hour: hourStr,
        orders: 0,
        revenue: 0,
      });
    }

    for (const b of billsRes.rows) {
      const dt = new Date(String(b.created_at));
      const h = dt.getHours();
      const match = hourlyHeatmap.find((hm) => hm.hour.startsWith(String(h).padStart(2, '0')));
      if (match) {
        match.orders += 1;
        match.revenue += Number(b.total_amount);
      }
    }

    return reply.send({
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalGrossSales: Number(totalGrossSales.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        totalNetTaxable: Number(totalNetTaxable.toFixed(2)),
        totalCgst: Number(totalCgst.toFixed(2)),
        totalSgst: Number(totalSgst.toFixed(2)),
        totalOrdersCount,
        averageOrderValue,
      },
      paymentBreakdown,
      itemWiseSales,
      categoryWiseSales,
      hourlyHeatmap,
      invoices: billsRes.rows.map((b) => ({
        id: String(b.id),
        invoiceNumber: String(b.invoice_number),
        totalAmount: Number(b.total_amount),
        paidAmount: Number(b.paid_amount),
        status: String(b.status),
        createdAt: String(b.created_at),
      })),
    });
  });
}
