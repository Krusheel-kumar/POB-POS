"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kitchenRoutes = kitchenRoutes;
const database_js_1 = require("../db/database.js");
async function kitchenRoutes(fastify) {
    // --- GET KITCHEN TICKETS FOR OUTLET ---
    fastify.get('/api/v1/kitchen-tickets/outlet/:outletId', async (req, reply) => {
        const { outletId } = req.params;
        const { status } = req.query;
        let sql = 'SELECT * FROM kitchen_tickets WHERE outlet_id = ?';
        const args = [outletId];
        if (status) {
            sql += ' AND status = ?';
            args.push(status);
        }
        sql += ' ORDER BY created_at DESC LIMIT 50';
        const res = await database_js_1.db.execute({ sql, args });
        const content = [];
        for (const t of res.rows) {
            const itemsRes = await database_js_1.db.execute({ sql: 'SELECT * FROM kitchen_ticket_items WHERE ticket_id = ?', args: [t.id] });
            const items = [];
            for (const itemRow of itemsRes.rows) {
                const addonsRes = await database_js_1.db.execute({ sql: 'SELECT * FROM kitchen_ticket_item_addons WHERE ticket_item_id = ?', args: [itemRow.id] });
                items.push({
                    id: String(itemRow.id),
                    orderItemId: itemRow.order_item_id ? String(itemRow.order_item_id) : undefined,
                    productNameSnapshot: String(itemRow.product_name_snapshot),
                    variantNameSnapshot: itemRow.variant_name_snapshot ? String(itemRow.variant_name_snapshot) : undefined,
                    quantity: Number(itemRow.quantity),
                    status: String(itemRow.status),
                    addOns: addonsRes.rows.map((a) => ({
                        id: String(a.id),
                        addOnNameSnapshot: String(a.addon_name_snapshot),
                    })),
                });
            }
            content.push({
                id: String(t.id),
                ticketNumber: String(t.ticket_number),
                status: String(t.status),
                orderNumberSnapshot: String(t.order_number_snapshot),
                orderTypeSnapshot: String(t.order_type_snapshot),
                tableNumberSnapshot: t.table_number_snapshot ? String(t.table_number_snapshot) : undefined,
                customerNotesSnapshot: t.customer_notes_snapshot ? String(t.customer_notes_snapshot) : undefined,
                cancellationReason: t.cancellation_reason ? String(t.cancellation_reason) : undefined,
                items,
                createdAt: String(t.created_at),
                updatedAt: String(t.updated_at),
            });
        }
        return reply.send({
            content,
            totalElements: content.length,
            totalPages: 1,
            size: 50,
            number: 0,
        });
    });
    // --- UPDATE KITCHEN TICKET STATUS ---
    fastify.patch('/api/v1/kitchen-tickets/:ticketId/status', async (req, reply) => {
        const { ticketId } = req.params;
        const { status, cancellationReason } = req.body;
        const existing = await database_js_1.db.execute({ sql: 'SELECT * FROM kitchen_tickets WHERE id = ?', args: [ticketId] });
        if (existing.rows.length === 0)
            return reply.status(404).send({ error: 'Ticket not found' });
        await database_js_1.db.execute({
            sql: "UPDATE kitchen_tickets SET status = ?, cancellation_reason = coalesce(?, cancellation_reason), updated_at = datetime('now') WHERE id = ?",
            args: [status, cancellationReason || null, ticketId],
        });
        // Also update item statuses
        await database_js_1.db.execute({
            sql: 'UPDATE kitchen_ticket_items SET status = ? WHERE ticket_id = ?',
            args: [status, ticketId],
        });
        return reply.send({
            id: ticketId,
            status,
            cancellationReason,
            updatedAt: new Date().toISOString(),
        });
    });
    // --- UPDATE SINGLE ITEM STATUS ON TICKET ---
    fastify.patch('/api/v1/kitchen-tickets/items/:itemId/status', async (req, reply) => {
        const { itemId } = req.params;
        const { status } = req.body;
        const existing = await database_js_1.db.execute({ sql: 'SELECT * FROM kitchen_ticket_items WHERE id = ?', args: [itemId] });
        if (existing.rows.length === 0)
            return reply.status(404).send({ error: 'Item not found' });
        await database_js_1.db.execute({
            sql: 'UPDATE kitchen_ticket_items SET status = ? WHERE id = ?',
            args: [status, itemId],
        });
        return reply.send({
            id: itemId,
            status,
        });
    });
}
