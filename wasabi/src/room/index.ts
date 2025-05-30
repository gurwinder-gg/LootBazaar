import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const chatRouter = new Hono();

export interface Env {
    DB: D1Database;
}

// Post a message
chatRouter.post("/message", zValidator("json", z.object({
    room_id: z.string(),
    user_id: z.string(),
    content: z.string().min(1).max(1000), // Add length constraints
    created_at: z.string().datetime(), // Ensure it's a valid datetime string
})), async (c) => {
    try {
        const { room_id, user_id, content, created_at } = c.req.valid('json');
        const query = `
        INSERT INTO messages (room_id, user_id, content, created_at, likes_count)
        VALUES (?, ?, ?, ?, 0);
        `;
        
        const result = await c.env.DB.prepare(query)
            .bind(room_id, user_id, content, created_at)
            .run();

        return c.json({ success: true, id: result.lastInsertRowId }, 201);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// Get messages for a specific room
chatRouter.get("/messages/:room_id", zValidator("param", z.object({ 
    room_id: z.string() 
})), zValidator("query", z.object({
    limit: z.string().optional().default("50"),
    offset: z.string().optional().default("0"),
})), async (c) => {
    try {
        const { room_id } = c.req.valid('param');
        const { limit, offset } = c.req.valid('query');

        // Ensure limit and offset are integers
        const limitInt = parseInt(limit, 10);
        const offsetInt = parseInt(offset, 10);

        const query = `
        SELECT m.*, u.username, u.profile_image_url
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?;
        `;

        const { results } = await c.env.DB.prepare(query)
            .bind(room_id, limitInt, offsetInt)
            .all();

        return c.json({ success: true, messages: results }, 200);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return c.json({ success: false, error: error.message }, 500);
    }
});


// Create a chat room in DB
chatRouter.post("/chat_room", zValidator("json", z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    admin_id: z.string(),
    created_at: z.string().datetime(),
    avatar : z.string().optional(),
})), async (c) => {
    try {
        const { id, name, description, admin_id, created_at, avatar } = c.req.valid('json');
        const query = `
        INSERT INTO chat_rooms(id, name, description, admin_id, created_at, avatar)
        VALUES (?, ?, ?, ?, ?,?);
        `;
        
        await c.env.DB.prepare(query)
            .bind(id, name, description, admin_id, created_at, avatar)
            .run();

        return c.json({ success: true, id: id }, 201);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
// Get all chat rooms
chatRouter.get("/chat_rooms", zValidator("query", z.object({
    limit: z.string().optional().default("20"),
    offset: z.string().optional().default("0"),
})), async (c) => {
    try {
        const { limit, offset } = c.req.valid('query');
        const query = `
        SELECT cr.*, COUNT(rp.user_id) as participant_count
        FROM chat_rooms cr
        LEFT JOIN room_participants rp ON cr.id = rp.room_id
        GROUP BY cr.id
        ORDER BY cr.created_at DESC
        LIMIT ? OFFSET ?;
        `;

        const { results } = await c.env.DB.prepare(query)
            .bind(parseInt(limit), parseInt(offset))
            .all();

        return c.json({ success: true, chat_rooms: results }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// Join a chat room
chatRouter.post("/chat_room/join", zValidator("json", z.object({
    user_id: z.string(),
    room_id: z.string(),
    joined_at: z.string().datetime(),
})), async (c) => {
    try {
        const { user_id, room_id, joined_at } = c.req.valid('json');
        const query = `
        INSERT INTO room_participants (user_id, room_id, joined_at)
        VALUES (?, ?, ?);
        `;
        
        await c.env.DB.prepare(query)
            .bind(user_id, room_id, joined_at)
            .run();

        return c.json({ success: true }, 201);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// Leave a chat room
chatRouter.post("/chat_room/leave", zValidator("json", z.object({
    user_id: z.string(),
    room_id: z.string(),
})), async (c) => {
    try {
        const { user_id, room_id } = c.req.valid('json');
        const query = `
        DELETE FROM room_participants
        WHERE user_id = ? AND room_id = ?;
        `;
        
        await c.env.DB.prepare(query)
            .bind(user_id, room_id)
            .run();

        return c.json({ success: true }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});

// Get participants of a chat room
chatRouter.get("/chat_room/:roomId/participants", zValidator("param", z.object({ 
    roomId: z.string() 
})), async (c) => {
    try {
        const { roomId } = c.req.valid('param');
        const query = `
        SELECT u.id, u.username, u.profile_image_url, rp.joined_at
        FROM room_participants rp
        JOIN users u ON rp.user_id = u.id
        WHERE rp.room_id = ?
        ORDER BY rp.joined_at DESC;
        `;

        const { results } = await c.env.DB.prepare(query)
            .bind(roomId)
            .all();

        return c.json({ success: true, participants: results }, 200);
    } catch (error) {
        return c.json({ success: false, error: (error as Error).message }, 500);
    }
});
