import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const leaderboardRouter = new Hono();

export interface Env {
    DB: D1Database;
}

// Endpoint to get the current leaderboard
leaderboardRouter.get("/live", zValidator("query", z.object({
    limit: z.string().optional().default("10"),
    offset: z.string().optional().default("0")
})), async (c) => {
    try {
        const { limit, offset } = c.req.valid('query');
        
        const query = `
        SELECT u.id as user_id, u.username, u.profile_image_url, COUNT(t.id) as points
        FROM users u
        LEFT JOIN transactions t ON u.id = t.user_id
        GROUP BY u.id
        ORDER BY points DESC
        LIMIT ? OFFSET ?
        `;

        const { results } = await c.env.DB.prepare(query)
            .bind(parseInt(limit), parseInt(offset))
            .all();

        return c.json({ success: true, leaderboard: results }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// Endpoint to get a user's rank
leaderboardRouter.get("/rank/:userId", zValidator("param", z.object({
    userId: z.string()
})), async (c) => {
    try {
        const { userId } = c.req.valid('param');
        
        const query = `
        WITH user_points AS (
            SELECT u.id as user_id, u.username, COUNT(t.id) as points
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id
            GROUP BY u.id
        )
        SELECT 
            up.user_id,
            up.username,
            up.points,
            (SELECT COUNT(*) + 1 FROM user_points where points > up.points) as rank
        FROM user_points up
        WHERE up.user_id = ?
        `;

        const result = await c.env.DB.prepare(query)
            .bind(userId)
            .first();

        if (!result) {
            return c.json({ success: false, error: "User not found" }, 404);
        }

        return c.json({ success: true, rank: result }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});
