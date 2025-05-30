/**
 * @file upi/index.ts
 * @description This file defines the main router for UPI payment generation and QR code creation
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import QRCode from 'qrcode';
import { z } from "zod";
interface UPIData {
    pa: string;
    pn: string;
    mc?: string;
    tid: string;
    am: number;
    cu: string;
    url: string;
}

interface TransactionData {
    tid: string;
    amount: number;
    status: 'success' | 'failed';
    userPaymentAddress: string;
}

const upiSchema = z.object({
    pa: z.string(),
    pn: z.string(),
    mc: z.string().optional(),
    tid: z.string(),
    am: z.number(),
    cu: z.string(),
    url: z.string(),
});

const transactionSchema = z.object({
    tid: z.string(),
    amount: z.number(),
    status: z.enum(['success', 'failed']),
    userPaymentAddress: z.string(),
});


// Mock function to simulate fund transfer
async function transferFunds(from: string, to: string, amount: number): Promise<boolean> {
    console.log(`Transferring ${amount} from ${from} to ${to}`);
    // Implement actual fund transfer logic here
    return true;
}

export const upiRouter = new Hono()
upiRouter.post("/generateUPI", zValidator("json", upiSchema), async (c) => {
    const body = await c.req.json();

    const { pa, pn, mc, tid, am, cu, url } = body as UPIData;

    const upiLink = `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&mc=${mc}&tid=${tid}&am=${am}&cu=${cu}&url=${encodeURIComponent(url)}`;
    return c.json(upiLink);
});

upiRouter.post("/webhook", zValidator("json", transactionSchema), async (c) => {
    const body = await c.req.json() as TransactionData;

    if (body.status === 'success' && body.amount === 100) {
        const companyWallet = "company_wallet_address"; // Replace with actual company wallet address
        const success = await transferFunds(companyWallet, body.userPaymentAddress, body.amount);

        if (success) {
            return c.json({ message: "Funds transferred successfully" }, 200);
        } else {
            return c.json({ message: "Fund transfer failed" }, 500);
        }
    }

    return c.json({ message: "No action taken" }, 200);
});

export type UpiRouter = typeof upiRouter;
