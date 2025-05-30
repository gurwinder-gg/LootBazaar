/**
 * @file buy/index.ts
 * @description This file defines the tRPC router for the application to buy/swap tokens
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Transaction, Connection, VersionedTransaction } from '@solana/web3.js';
import { quoteBody, swapBody } from "./interfaces";
import z from 'zod';
import { quoteSchema } from './schemas';

const connection = new Connection('https://api.mainnet-beta.solana.com');

async function getInternalQuote(inputMint: string, outputMint: string, amount: number, slippage?: number, platformFees: number = 0) {
    const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippage?.toString() || '50',
        platformFeeBps: platformFees.toString(),
        swapMode: 'ExactOut'
    });

    const response = await fetch(`https://quote-api.jup.ag/v6/quote?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch internal quote: ${response.statusText}`);
    }
    return response.json();
}

export const buyRouter = new Hono()

/**
 * @description Fetches the current autofee rates
 * @returns object containing the autofee rates for very high, high & medium priority
 * @example http://<worker>/api/buy/autofee
 */
.get("/autofee", async (c) => {
    try {
        const response = await fetch('https://api-v3.raydium.io/main/auto-fee');
        if (!response.ok) {
            throw new Error(`Failed to fetch autofee: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
// @ts-ignore
        if (!data || typeof data !== 'object' || !data.data || !data.data.default) {
            throw new Error('Unexpected response structure');
        }
// @ts-ignore
        const { default: defaultFees } = data.data;

        const autofeeRes = {
            veryHighP: defaultFees.vh,
            highP: defaultFees.h,
            mediumP: defaultFees.m,
        };

        if (!autofeeRes.veryHighP || !autofeeRes.highP || !autofeeRes.mediumP) {
            throw new Error('Missing expected data in response');
        }
        return c.json(autofeeRes);
    } catch (error) {
        console.error('Full error:', error);
        if (error instanceof Error) {
            console.error(`Error details: ${error.message}`);
        }
        return c.json({ error: 'Failed to fetch autofee' }, 500);
    }
})

/**
 * @description Fetches the current Raydium RPCs
 * @returns array of objects containing RPCs urls, ws, weight, and name 
 * @example http://<worker>/api/buy/rpcs
 */
.get("/rpcs", async (c) => {
    try {
        const response = await fetch('https://api-v3.raydium.io/main/rpcs');
        if (!response.ok) {
            throw new Error(`Failed to fetch RPCs: ${response.statusText}`);
        }
        const data = await response.json();
// @ts-ignore
        return c.json(data.data.rpcs);
    } catch (error) {
        console.error('Full error:', error);
        if (error instanceof Error) {
            console.error(`Error details: ${error.message}`);
        }
        return c.json({ error: 'Failed to fetch RPCs' }, 500);
    }
})

/**
 * @description Fetches the quote for the specified input and output mints
 * @input inputMint
 *        outputMint
 *        amount
 *        slippage (optional) 
 *        platformFees
 * @returns the quote response
 * @example http://<worker>/api/buy/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=1000000&slippage=50&platformFees=0
 */
.get("/quote", zValidator("query", quoteSchema), async (c) => {
    const { inputMint, outputMint, amount, slippage, platformFees } = c.req.query();
    try {
        const params = new URLSearchParams({
            inputMint,
            outputMint,
            amount: parseInt(amount).toString(),
            slippageBps: slippage ? parseInt(slippage).toString() : '50',
            platformFeeBps: parseInt(platformFees).toString(),
            swapMode: 'ExactOut'
        });

        const response = await fetch(`https://quote-api.jup.ag/v6/quote?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch quote: ${response.statusText}`);
        }
        const data = await response.json();
// @ts-ignore
        return c.json(data);
    } catch (error) {
        console.error('Quote error:', error);
        if (error instanceof Error) {
            console.error(`Error details: ${error.message}`);
        }
        return c.json({ error: 'Failed to fetch quote' }, 500);
    }
})

/**
 * @description Serialize the swap transaction
 * @input object containing:
 *        quoteResponse: the quote response
 *        userPubkey: the public key of the user
 *        wrapAndUnwrapSol: (optional) whether to wrap and unwrap SOL
 *        feeAccount: the public key of the fee account
 * @returns the serialized transaction
 * @example http://<worker>/api/buy/swap
 */

/*
{
  "quoteResponse": {
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount": 1000000,
    "slippage": 50,
    "platformFees": 10
  },
  "userPubkey": "7DyWpi9NwKsF84ERrSJNd7JBwDjbrGRB8xvisr112ZLc",
  "wrapAndUnwrapSol": true,
  "feeAccount": "44LfWhS3PSYf7GxUE2evtTXvT5nYRe6jEMvTZd3YJ9E2"
}
*/
.post("/swap", zValidator("json", z.object({        
    quoteResponse: z.object({
        inputMint: z.string(),
        outputMint: z.string(),
        amount: z.number(),
        slippage: z.number().optional(),
        platformFees: z.number(),
    }),
    userPubkey: z.string(),
    wrapAndUnwrapSol: z.boolean().optional(),
    feeAccount: z.string(),
})), async (c) => {
    try {
        const body = await c.req.json();
        if (!body || typeof body !== 'object') {
            throw new Error('Invalid request body');
        }
        const { quoteResponse, userPubkey, feeAccount } = body as swapBody;
        if (!quoteResponse || typeof quoteResponse !== 'object') {
            throw new Error('Invalid quoteResponse in request body');
        }

        // Fetch the quote directly from Jupiter API
        const internalQuote = await getInternalQuote(
            quoteResponse.inputMint,
            quoteResponse.outputMint,
            quoteResponse.amount,
            quoteResponse.slippage,
            quoteResponse.platformFees
        );
        console.log('Internal quote:', internalQuote);

        // Prepare the swap request body for Jupiter API
        const swapRequestBody = {
            quoteResponse: internalQuote,
            userPublicKey: userPubkey,
            wrapUnwrapSOL: true,
            feeAccount: feeAccount,
        };
        console.log('Swap request body:', swapRequestBody);

        // Send the swap request directly to Jupiter API
        const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(swapRequestBody)
        });

        if (!swapResponse.ok) {
            throw new Error(`Failed to create swap transaction: ${swapResponse.statusText}`);
        }

        const swapData = await swapResponse.json();
        if (!swapData || typeof swapData !== 'object') {
            throw new Error('Unexpected swap response');
        }
        
        const { swapTransaction } = swapData;
        console.log('Swap transaction:', swapTransaction);

        // Return the unsigned transaction to the client
        return c.json({ 
            success: true, 
            unsignedTransaction: swapTransaction 
        });
    } catch (error) {
        console.error('Swap error:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        return c.json({ error: 'Failed to create swap transaction' }, 500);
    }
});

export type BuyRouter = typeof buyRouter;
