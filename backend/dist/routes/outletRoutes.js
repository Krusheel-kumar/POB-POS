"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outletRoutes = outletRoutes;
const database_js_1 = require("../db/database.js");
async function outletRoutes(fastify) {
    // --- OUTLETS ---
    fastify.get('/api/v1/outlets', async (_req, reply) => {
        const res = await database_js_1.db.execute('SELECT * FROM outlets ORDER BY created_at ASC');
        const outlets = res.rows.map((row) => ({
            id: String(row.id),
            name: String(row.name),
            code: row.code ? String(row.code) : undefined,
            address: row.address ? String(row.address) : undefined,
            phone: row.phone ? String(row.phone) : undefined,
            managerName: row.manager_name ? String(row.manager_name) : undefined,
            paymentPolicy: (row.payment_policy || 'FLEXIBLE'),
        }));
        return reply.send(outlets);
    });
    fastify.post('/api/v1/outlets', async (req, reply) => {
        const { name, code, address, phone, managerName, paymentPolicy } = req.body;
        if (!name?.trim())
            return reply.status(400).send({ error: 'Outlet name is required' });
        const id = `outlet-${Date.now()}`;
        await database_js_1.db.execute({
            sql: `INSERT INTO outlets (id, name, code, address, phone, manager_name, payment_policy)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [id, name.trim(), code || null, address || null, phone || null, managerName || null, paymentPolicy || 'FLEXIBLE'],
        });
        return reply.status(201).send({
            id,
            name: name.trim(),
            code,
            address,
            phone,
            managerName,
            paymentPolicy: paymentPolicy || 'FLEXIBLE',
        });
    });
    fastify.patch('/api/v1/outlets/:id/payment-policy', async (req, reply) => {
        const { id } = req.params;
        const { policy } = req.query;
        await database_js_1.db.execute({
            sql: 'UPDATE outlets SET payment_policy = ? WHERE id = ?',
            args: [policy, id],
        });
        const res = await database_js_1.db.execute({ sql: 'SELECT * FROM outlets WHERE id = ?', args: [id] });
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Outlet not found' });
        const o = res.rows[0];
        return reply.send({
            id: String(o.id),
            name: String(o.name),
            paymentPolicy: String(o.payment_policy),
        });
    });
    // --- RESTAURANT TABLES ---
    const handleGetTables = async (req, reply) => {
        const { outletId } = req.params;
        const res = await database_js_1.db.execute({
            sql: 'SELECT * FROM tables WHERE outlet_id = ? ORDER BY table_number ASC',
            args: [outletId],
        });
        const tables = res.rows.map((row) => ({
            id: String(row.id),
            outletId: String(row.outlet_id),
            tableNumber: String(row.table_number),
            capacity: Number(row.capacity),
            status: String(row.status),
            currentOrderId: row.current_order_id ? String(row.current_order_id) : undefined,
        }));
        return reply.send(tables);
    };
    fastify.get('/api/v1/tables/outlet/:outletId', handleGetTables);
    fastify.get('/api/v1/outlets/:outletId/tables', handleGetTables);
    fastify.post('/api/v1/tables', async (req, reply) => {
        const { tableNumber, capacity, outletId } = req.body;
        const targetOutletId = outletId || 'outlet-demo-flagship';
        const id = `tbl-${Date.now()}`;
        await database_js_1.db.execute({
            sql: 'INSERT INTO tables (id, outlet_id, table_number, capacity) VALUES (?, ?, ?, ?)',
            args: [id, targetOutletId, tableNumber, capacity || 4],
        });
        return reply.status(201).send({
            id,
            tableNumber,
            capacity: capacity || 4,
            status: 'AVAILABLE',
        });
    });
    fastify.patch('/api/v1/tables/:id/status', async (req, reply) => {
        const { id } = req.params;
        const { status } = req.body;
        await database_js_1.db.execute({
            sql: 'UPDATE tables SET status = ? WHERE id = ?',
            args: [status, id],
        });
        const res = await database_js_1.db.execute({ sql: 'SELECT * FROM tables WHERE id = ?', args: [id] });
        if (res.rows.length === 0)
            return reply.status(404).send({ error: 'Table not found' });
        return reply.send({
            id,
            status,
        });
    });
    fastify.delete('/api/v1/tables/:id', async (req, reply) => {
        const { id } = req.params;
        await database_js_1.db.execute({ sql: 'DELETE FROM tables WHERE id = ?', args: [id] });
        return reply.status(204).send();
    });
}
