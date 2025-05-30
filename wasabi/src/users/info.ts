import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const userRouter = new Hono();

export interface Env {
    DB: D1Database;
}

// get user info by id
userRouter.get("/:id", zValidator("param", z.object({id: z.string()})), async (c) => {
    try {
        const id = c.req.param('id');
        const query = `
        SELECT * FROM users WHERE id = ?;
        `;

        const { results } = await c.env.DB.prepare(query)
            .bind(id)
            .all();

        if (results.length === 0) {
            return c.json({ success: false, error: "User not found" }, 404);
        }

        return c.json({ success: true, user: results[0] }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// Save user details from supabase
userRouter.post("/", zValidator("json", z.object({
    id: z.string(),
    username: z.string(),
    bio: z.string().optional(),
    profile_image_url: z.string().optional(),
    pub_address: z.string().optional(),
    created_at: z.string(),
    last_login: z.string().optional(),
})), async (c) => {
    try {
        const body = await c.req.json();
        const { id, username, bio, profile_image_url, pub_address, created_at, last_login } = body;

        const query = `
        INSERT INTO users (id, username, bio, profile_image_url, pub_address, created_at, last_login) 
        VALUES (?, ?, ?, ?, ?, ?, ?);
        `;

        const result = await c.env.DB.prepare(query)
            .bind(id, username, bio, profile_image_url, pub_address, created_at, last_login)
            .run();

        return c.json({ success: true, result }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});
