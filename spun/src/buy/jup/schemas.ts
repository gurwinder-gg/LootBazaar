import { z } from "zod";

export const quoteSchema = z.object({
        inputMint: z.string(),
        outputMint: z.string(),
        amount: z.string(), // Query params come as strings
        slippage: z.string().optional(),
        platformFees: z.string(),
    });
