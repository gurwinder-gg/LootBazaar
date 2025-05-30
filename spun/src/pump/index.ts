import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import z from 'zod';
import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from "bs58";
import { RPC_URL } from "./constants";

// Schemas
const TradeActionSchema = z.enum(['buy', 'sell']);
const PoolSchema = z.enum(['pump', 'raydium']);

const TradeRequestSchema = z.object({
  action: TradeActionSchema,
  mint: z.string(),
  amount: z.union([z.number(), z.string()]),
  denominatedInSol: z.string(),
  slippage: z.number(),
  priorityFee: z.number(),
  pool: PoolSchema,
});

// Interfaces
interface TradeRequest {
  action: 'buy' | 'sell';
  mint: string;
  amount: number | string;
  denominatedInSol: string;
  slippage: number;
  priorityFee: number;
  pool: 'pump' | 'raydium';
}

interface WalletResponse {
  apiKey: string;
  privateKey: string;
  publicKey: string;
}

interface TradeResponse {
  signature: string;
}

const RPC_ENDPOINT = RPC_URL;  
const web3Connection = new Connection(RPC_ENDPOINT, 'confirmed');

export const pumpRouter = new Hono();

/**
 * Returns an api key, private key, and a public key to be used only to trade on pump.fun
 */
pumpRouter.get('/create-wallet', async (c) => {
  try {
    const response = await fetch("https://pumpportal.fun/api/create-wallet");
    if (!response.ok) {
      throw new Error(`Failed to create wallet: ${response.statusText}`);
    }
    const data: WalletResponse = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Wallet creation error:', error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
    }
    return c.json({ error: 'Failed to create wallet' }, 500);
  }
});

/**
 * Initiates a local trade transaction
 */
pumpRouter.post('/trade-local', zValidator('json', TradeRequestSchema), async (c) => {
  const tradeRequest = c.req.valid('json');

  try {
    const response = await fetch(`https://pumpportal.fun/api/trade?api-key=${userAPI_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tradeRequest),
    });

    if (response.status === 200) {
      const data = await response.arrayBuffer();
      return c.body(data, 200, { 'Content-Type': 'application/octet-stream' });
    } else {
      const errorText = await response.text();
      return c.json({ error: errorText }, response.status);
    }
  } catch (error) {
    console.error('Trade initiation error:', error);
    return c.json({
      error: 'Failed to initiate trade',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export type PumpRouter = typeof pumpRouter;
