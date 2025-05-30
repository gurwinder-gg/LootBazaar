import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const transactionRouter = new Hono();

export interface Env {
    DB: D1Database;
}

const transactionSchema = z.object({
    user_id: z.string(),
    coin_address: z.string(),
    coin_ticker: z.string(),
    type: z.enum(["buy", "sell"]),
    amount: z.number(),
    price: z.number(),
    total_value: z.number(),
    status: z.enum(["pending", "completed", "failed"]),
});

// Adding transaction to the database
transactionRouter.post("/add", zValidator("json", transactionSchema), async (c) => {
    try {
        const body = await c.req.json();
        const { user_id, coin_address, coin_ticker, type, amount, price, total_value, status } = body;

        const query = `
        INSERT INTO transactions (
        user_id, coin_address, coin_ticker, type, amount, price, total_value, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;

        const result = await c.env.DB.prepare(query)
            .bind(user_id, coin_address, coin_ticker, type, amount, price, total_value, status)
            .run();

        return c.json({ success: true, id: result.lastInsertRowId }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// Getting all transactions of a user 
transactionRouter.get("/all/:user_id", zValidator("param", z.object({user_id: z.string()})), async (c) => {
    try {
        const user_id = c.req.param('user_id');
        const query = `
        SELECT * FROM transactions WHERE user_id = ?;
        `;

        const { results } = await c.env.DB.prepare(query).bind(user_id).all();
        return c.json({ success: true, data: results }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// Getting a transaction by id
transactionRouter.get("/transaction/:id", zValidator("param", z.object({id: z.string()})), async (c) => {
    try {
        const id = c.req.param('id');
        const query = `
        SELECT * FROM transactions WHERE id = ?;
        `;

        const { results } = await c.env.DB.prepare(query).bind(id).all();
        
        if (results.length === 0) {
            return c.json({ success: false, error: "Transaction not found" }, 404);
        }

        return c.json({ success: true, data: results[0] }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// holdings of a user
transactionRouter.get("/holdings/:user_id", zValidator("param", z.object({ user_id: z.string() })), async (c) => {
    try {
        const { user_id } = c.req.valid('param');
        
        // Query to get the user's transactions and calculate holdings per coin
        const query = `
        SELECT coin_ticker, coin_address,
               SUM(CASE WHEN type = 'buy' THEN amount ELSE -amount END) AS total_amount
        FROM transactions
        WHERE user_id = ?
        GROUP BY coin_ticker, coin_address
        `;

        const { results } = await c.env.DB.prepare(query).bind(user_id).all();

        // Filter out holdings with zero or negative balance
        const filteredResults = results.filter((row: any) => row.total_amount > 0);

        return c.json({ success: true, holdings: filteredResults }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});
