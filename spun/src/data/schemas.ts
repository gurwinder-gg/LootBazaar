/**
 * @file data/schemas.ts
 * @description Schemas for validating data
 */
import { z } from "zod";

export const metaSchema = z.object({
    ids: z.string().nonempty("Ids are required"),
});

export const querySchema = z.object({
    query: z.string().nonempty("Query is required"),
});
