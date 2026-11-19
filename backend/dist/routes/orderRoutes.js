"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = orderRoutes;
const database_js_1 = require("../db/database.js");
async function orderRoutes(fastify) {
    // --- CREATE ORDER (With Automatic KOT Generation) ---
    fastify.post('/api/v1/orders', async (req, reply) => {
        const { outletId, orderType, customerName, customerPhone, tableId, tableNumber, customerNotes, items } = req.body;
        if (!outletId)
            return reply.status(400).send({ error: 'Outlet ID is required' });
        if (!items || items.length === 0)
            return reply.status(400).send({ error: 'Order must contain at least 1 item' });
        const orderId = `ord-${Date.now()}`;
        const year = new Date().getFullYear();
        const seq = await (0, database_js_1.getNextSequence)(`orders-${outletId}-${year}`);
        const orderNumber = `ORD-${year}-${String(seq).padStart(4, '0')}`;
        let subtotal = 0;
        const resolvedItems = [];
        // Resolve products and add-ons from DB
        for (const item of items) {
            const prodRes = await database_js_1.db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [item.productId] });
            if (prodRes.rows.length === 0)
                continue;
            const prod = prodRes.rows[0];
            const basePrice = Number(prod.base_price);
            let itemAddonTotal = 0;
            const resolvedAddons = [];
            if (item.addOnIds && item.addOnIds.length > 0) {
                for (const addonId of item.addOnIds) {
                    const addonRes = await database_js_1.db.execute({ sql: 'SELECT * FROM add_ons WHERE id = ?', args: [addonId] });
                    if (addonRes.rows.length > 0) {
                        const add = addonRes.rows[0];
                        const addonPrice = Number(add.price);
                        itemAddonTotal += addonPrice;
                        resolvedAddons.push({
                            id: String(add.id),
                            name: String(add.name),
                            price: addonPrice,
                        });
                    }
                }
            }
            const unitPrice = basePrice + itemAddonTotal;
            const lineTotal = unitPrice * item.quantity;
            subtotal += lineTotal;
            resolvedItems.push({
                id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                productId: item.productId,
                productName: String(prod.name),
                unitPrice,
                quantity: item.quantity,
                lineTotal,
                itemNotes: item.itemNotes,
                addons: resolvedAddons,
            });
        }
        const discountAmount = 0.0;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = Number((taxableAmount * 0.05).toFixed(2)); // 5% GST (2.5% CGST + 2.5% SGST)
        const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));
        // Insert Order
        await database_js_1.db.execute({
            sql: `INSERT INTO orders (id, outlet_id, order_number, order_type, status, customer_name, customer_phone, table_id, table_number, customer_notes, subtotal, discount_amount, taxable_amount, tax_amount, total_amount)
            VALUES (?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [orderId, outletId, orderNumber, orderType, customerName || null, customerPhone || null, tableId || null, tableNumber || null, customerNotes || null, subtotal, discountAmount, taxableAmount, taxAmount, totalAmount],
        });
        // Insert Order Items and Item Addons
        for (const ri of resolvedItems) {
            await database_js_1.db.execute({
                sql: `INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total_snapshot, item_notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [ri.id, orderId, ri.productId, ri.productName, ri.unitPrice, ri.quantity, ri.lineTotal, ri.itemNotes || null],
            });
            for (const add of ri.addons) {
                await database_js_1.db.execute({
                    sql: `INSERT INTO order_item_addons (id, order_item_id, addon_id, addon_name_snapshot, addon_price_snapshot)
                VALUES (?, ?, ?, ?, ?)`,
                    args: [`oia-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ri.id, add.id, add.name, add.price],
                });
            }
        }
        // --- AUTOMATIC KOT ENGINE ---
        // Generate sequential daily KOT Ticket Number (#1, #2, #3...)
        const todayStr = new Date().toISOString().slice(0, 10);
        const kotSeq = await (0, database_js_1.getNextSequence)(`kot-${outletId}-${todayStr}`);
        const ticketId = `kot-${Date.now()}`;
        await database_js_1.db.execute({
            sql: `INSERT INTO kitchen_tickets (id, ticket_number, outlet_id, order_id, order_number_snapshot, order_type_snapshot, table_number_snapshot, customer_notes_snapshot)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [ticketId, `#${kotSeq}`, outletId, orderId, orderNumber, orderType, tableNumber || null, customerNotes || null],
        });
        for (const ri of resolvedItems) {
            const kotItemId = `kti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            await database_js_1.db.execute({
                sql: `INSERT INTO kitchen_ticket_items (id, ticket_id, order_item_id, product_name_snapshot, quantity)
              VALUES (?, ?, ?, ?, ?)`,
                args: [kotItemId, ticketId, ri.id, ri.productName, ri.quantity],
            });
            for (const add of ri.addons) {
                await database_js_1.db.execute({
                    sql: `INSERT INTO kitchen_ticket_item_addons (id, ticket_item_id, addon_name_snapshot)
                VALUES (?, ?, ?)`,
                    args: [`ktia-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kotItemId, add.name],
                });
            }
        }
        // If table assigned, mark table as OCCUPIED
        if (tableId) {
            await database_js_1.db.execute({
                sql: "UPDATE tables SET status = 'OCCUPIED', current_order_id = ? WHERE id = ?",
                args: [orderId, tableId],
            });
        }
        const createdOrder = {
            id: orderId,
            orderNumber,
            orderType,
            status: 'CONFIRMED',
            customerName,
            customerPhone,
            tableNumber,
            subtotal,
            discountAmount,
            taxableAmount,
            taxAmount,
            totalAmount,
            items: resolvedItems.map((ri) => ({
                id: ri.id,
                productNameSnapshot: ri.productName,
                unitPriceSnapshot: ri.unitPrice,
                quantity: ri.quantity,
                lineTotalSnapshot: ri.lineTotal,
                itemNotes: ri.itemNotes,
                addOns: ri.addons,
            })),
            createdAt: new Date().toISOString(),
        };
        return reply.status(201).send(createdOrder);
    });
    // --- GET SINGLE ORDER ---
    fastify.get('/api/v1/orders/:id', async (req, reply) => {
        const { id } = req.params;
        const orderRes = await database_js_1.db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [id] });
        if (orderRes.rows.length === 0)
            return reply.status(404).send({ error: 'Order not found' });
        const order = orderRes.rows[0];
        const itemsRes = await database_js_1.db.execute({ sql: 'SELECT * FROM order_items WHERE order_id = ?', args: [id] });
        const items = [];
        for (const row of itemsRes.rows) {
            const addonsRes = await database_js_1.db.execute({ sql: 'SELECT * FROM order_item_addons WHERE order_item_id = ?', args: [row.id] });
            items.push({
                id: String(row.id),
                productNameSnapshot: String(row.product_name_snapshot),
                unitPriceSnapshot: Number(row.unit_price_snapshot),
                quantity: Number(row.quantity),
                lineTotalSnapshot: Number(row.line_total_snapshot),
                itemNotes: row.item_notes ? String(row.item_notes) : undefined,
                addOns: addonsRes.rows.map((a) => ({
                    id: String(a.addon_id),
                    name: String(a.addon_name_snapshot),
                    price: Number(a.addon_price_snapshot),
                })),
            });
        }
        return reply.send({
            id: String(order.id),
            orderNumber: String(order.order_number),
            orderType: String(order.order_type),
            status: String(order.status),
            customerName: order.customer_name ? String(order.customer_name) : undefined,
            customerPhone: order.customer_phone ? String(order.customer_phone) : undefined,
            tableNumber: order.table_number ? String(order.table_number) : undefined,
            subtotal: Number(order.subtotal),
            discountAmount: Number(order.discount_amount),
            taxableAmount: Number(order.taxable_amount),
            taxAmount: Number(order.tax_amount),
            totalAmount: Number(order.total_amount),
            items,
            createdAt: String(order.created_at),
        });
    });
    // --- GET ORDERS FOR OUTLET ---
    fastify.get('/api/v1/orders/outlet/:outletId', async (req, reply) => {
        const { outletId } = req.params;
        const res = await database_js_1.db.execute({
            sql: 'SELECT * FROM orders WHERE outlet_id = ? ORDER BY created_at DESC LIMIT 50',
            args: [outletId],
        });
        const orders = [];
        for (const o of res.rows) {
            const itemsRes = await database_js_1.db.execute({ sql: 'SELECT * FROM order_items WHERE order_id = ?', args: [o.id] });
            orders.push({
                id: String(o.id),
                orderNumber: String(o.order_number),
                orderType: String(o.order_type),
                status: String(o.status),
                customerName: o.customer_name ? String(o.customer_name) : undefined,
                customerPhone: o.customer_phone ? String(o.customer_phone) : undefined,
                tableNumber: o.table_number ? String(o.table_number) : undefined,
                subtotal: Number(o.subtotal),
                discountAmount: Number(o.discount_amount),
                taxableAmount: Number(o.taxable_amount),
                taxAmount: Number(o.tax_amount),
                totalAmount: Number(o.total_amount),
                items: itemsRes.rows.map((r) => ({
                    id: String(r.id),
                    productNameSnapshot: String(r.product_name_snapshot),
                    unitPriceSnapshot: Number(r.unit_price_snapshot),
                    quantity: Number(r.quantity),
                    lineTotalSnapshot: Number(r.line_total_snapshot),
                })),
                createdAt: String(o.created_at),
            });
        }
        return reply.send(orders);
    });
    // --- REAL-TIME PRICING CALCULATION ---
    fastify.post('/api/v1/pricing/calculate', async (req, reply) => {
        const { items } = req.body;
        if (!items || items.length === 0) {
            return reply.send({
                subtotal: 0,
                discountAmount: 0,
                taxableAmount: 0,
                cgstAmount: 0,
                sgstAmount: 0,
                taxAmount: 0,
                totalAmount: 0,
                roundOffAmount: 0,
            });
        }
        let subtotal = 0;
        for (const item of items) {
            const prodRes = await database_js_1.db.execute({ sql: 'SELECT base_price FROM products WHERE id = ?', args: [item.productId] });
            const basePrice = prodRes.rows.length > 0 ? Number(prodRes.rows[0].base_price) : 0;
            let addonTotal = 0;
            if (item.addOnIds && item.addOnIds.length > 0) {
                for (const aid of item.addOnIds) {
                    const addonRes = await database_js_1.db.execute({ sql: 'SELECT price FROM add_ons WHERE id = ?', args: [aid] });
                    if (addonRes.rows.length > 0) {
                        addonTotal += Number(addonRes.rows[0].price);
                    }
                }
            }
            subtotal += (basePrice + addonTotal) * item.quantity;
        }
        const discountAmount = 0;
        const taxableAmount = subtotal - discountAmount;
        const cgstAmount = Number((taxableAmount * 0.025).toFixed(2));
        const sgstAmount = Number((taxableAmount * 0.025).toFixed(2));
        const taxAmount = Number((cgstAmount + sgstAmount).toFixed(2));
        const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));
        return reply.send({
            subtotal,
            discountAmount,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            taxAmount,
            totalAmount,
            roundOffAmount: 0,
        });
    });
    // --- ADD ITEMS TO EXISTING ORDER (Table Top-up) ---
    fastify.post('/api/v1/orders/:orderId/add-items', async (req, reply) => {
        const { orderId } = req.params;
        const { items } = req.body;
        const orderRes = await database_js_1.db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [orderId] });
        if (orderRes.rows.length === 0)
            return reply.status(404).send({ error: 'Order not found' });
        const order = orderRes.rows[0];
        let addedSubtotal = 0;
        for (const item of items) {
            const prodRes = await database_js_1.db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [item.productId] });
            if (prodRes.rows.length === 0)
                continue;
            const prod = prodRes.rows[0];
            let addonTotal = 0;
            if (item.addOnIds && item.addOnIds.length > 0) {
                for (const aid of item.addOnIds) {
                    const addRes = await database_js_1.db.execute({ sql: 'SELECT price FROM add_ons WHERE id = ?', args: [aid] });
                    if (addRes.rows.length > 0)
                        addonTotal += Number(addRes.rows[0].price);
                }
            }
            const unitPrice = Number(prod.base_price) + addonTotal;
            const lineTotal = unitPrice * item.quantity;
            addedSubtotal += lineTotal;
            await database_js_1.db.execute({
                sql: `INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, line_total_snapshot, item_notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [`oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, orderId, item.productId, String(prod.name), unitPrice, item.quantity, lineTotal, item.itemNotes || null],
            });
        }
        const newSubtotal = Number(order.subtotal) + addedSubtotal;
        const newTaxable = newSubtotal - Number(order.discount_amount);
        const newTax = Number((newTaxable * 0.05).toFixed(2));
        const newTotal = Number((newTaxable + newTax).toFixed(2));
        await database_js_1.db.execute({
            sql: 'UPDATE orders SET subtotal = ?, taxable_amount = ?, tax_amount = ?, total_amount = ? WHERE id = ?',
            args: [newSubtotal, newTaxable, newTax, newTotal, orderId],
        });
        const updatedRes = await database_js_1.db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [orderId] });
        return reply.send(updatedRes.rows[0]);
    });
}
